use std::collections::{BTreeMap, VecDeque};
use std::f64::consts::PI;
use std::sync::Mutex;

use crate::domain::models::{
    ColorConversionOptions, CssColorFormat, GamutTarget, Okyct, OkyctError,
};
use crate::domain::services::{
    find_gamut_cusp, find_max_chroma_for_tone, hex_to_okyct, okyct_to_display_p3_css,
    okyct_to_hex, okyct_to_oklch_css,
};
use crate::ports::inbound::{STANDARD_TONES, TonalPaletteOptions, TonalPalettePort};

const SEED_NEUTRAL_THRESHOLD: f64 = 0.025;
const WARM_YELLOW_CENTER_HUE: f64 = 100.0;
const WARM_YELLOW_HALF_WINDOW: f64 = 28.0;

#[inline]
fn smoothstep(edge0: f64, edge1: f64, x: f64) -> f64 {
    let t = ((x - edge0) / (edge1 - edge0)).clamp(0.0, 1.0);
    t * t * (3.0 - 2.0 * t)
}

#[inline]
fn apply_soft_knee(chroma: f64, max_gamut_chroma: f64) -> f64 {
    if max_gamut_chroma <= 0.0 || chroma <= 0.0 {
        return 0.0;
    }
    let knee = 0.8 * max_gamut_chroma;
    if chroma <= knee {
        return chroma;
    }
    let headroom = max_gamut_chroma - knee;
    let excess = chroma - knee;
    knee + headroom * (excess / (excess + headroom))
}

fn compute_hk_tone_delta(hue: f64, chroma: f64, tone: f64) -> f64 {
    if chroma <= 0.02 || tone <= 5.0 || tone >= 95.0 {
        return 0.0;
    }
    let rad = hue * PI / 180.0;
    let blue_purple_boost = 0.5 + 0.5 * (rad - 265.0 * PI / 180.0).cos();
    let red_boost = 0.5 + 0.5 * (rad - 25.0 * PI / 180.0).cos();
    let hue_weight = 0.45 + 0.55 * blue_purple_boost.max(red_boost * 0.75);
    let mid_bell = smoothstep(5.0, 35.0, tone) * smoothstep(95.0, 65.0, tone);
    (chroma * 22.0 * hue_weight * mid_bell).min(6.0)
}

struct LruCache<K: Eq + Clone, V: Clone> {
    order: VecDeque<K>,
    entries: Vec<(K, V)>,
}

impl<K: Eq + Clone, V: Clone> Default for LruCache<K, V> {
    fn default() -> Self {
        Self {
            order: VecDeque::new(),
            entries: Vec::new(),
        }
    }
}

impl<K: Eq + Clone, V: Clone> LruCache<K, V> {
    fn get(&mut self, key: &K) -> Option<V> {
        let pos = self.entries.iter().position(|(k, _)| k == key)?;
        let val = self.entries[pos].1.clone();
        if let Some(opos) = self.order.iter().position(|k| k == key) {
            self.order.remove(opos);
        }
        self.order.push_back(key.clone());
        Some(val)
    }

    fn set(&mut self, key: K, value: V, max_size: usize) {
        if max_size == 0 {
            return;
        }
        if let Some(pos) = self.entries.iter().position(|(k, _)| k == &key) {
            self.entries[pos].1 = value;
            if let Some(opos) = self.order.iter().position(|k| k == &key) {
                self.order.remove(opos);
            }
            self.order.push_back(key);
            return;
        }
        if self.entries.len() >= max_size
            && let Some(oldest) = self.order.pop_front()
            && let Some(pos) = self.entries.iter().position(|(k, _)| k == &oldest)
        {
            self.entries.swap_remove(pos);
        }
        self.order.push_back(key.clone());
        self.entries.push((key, value));
    }

    fn len(&self) -> usize {
        self.entries.len()
    }
}

#[derive(Default)]
struct PaletteCache {
    hex: LruCache<u64, String>,
    okyct: LruCache<(GamutTarget, u64), Okyct>,
}

#[derive(Debug)]
pub struct TonalPalette {
    pub hue: f64,
    pub target_chroma: f64,
    pub gamut: GamutTarget,
    pub hk_compensation: bool,
    pub soft_knee: bool,
    pub max_cache_size: usize,
    cache: Mutex<PaletteCache>,
}

impl Clone for TonalPalette {
    fn clone(&self) -> Self {
        Self {
            hue: self.hue,
            target_chroma: self.target_chroma,
            gamut: self.gamut,
            hk_compensation: self.hk_compensation,
            soft_knee: self.soft_knee,
            max_cache_size: self.max_cache_size,
            cache: Mutex::new(PaletteCache::default()),
        }
    }
}

impl std::fmt::Debug for PaletteCache {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("PaletteCache")
            .field("hex_len", &self.hex.len())
            .field("okyct_len", &self.okyct.len())
            .finish()
    }
}

impl TonalPalette {
    pub fn new(
        hue: f64,
        target_chroma: f64,
        options: TonalPaletteOptions,
    ) -> Result<Self, OkyctError> {
        if !hue.is_finite() || !target_chroma.is_finite() || target_chroma < 0.0 {
            return Err(OkyctError::new(format!(
                "Invalid TonalPalette arguments: hue={hue}, targetChroma={target_chroma}. Expected finite hue and non-negative chroma."
            )));
        }
        Ok(Self {
            hue: hue.rem_euclid(360.0),
            target_chroma,
            gamut: options.gamut,
            hk_compensation: options.hk_compensation,
            soft_knee: options.soft_knee,
            max_cache_size: options.max_cache_size,
            cache: Mutex::new(PaletteCache::default()),
        })
    }

    pub fn cache_size(&self) -> usize {
        let guard = self.cache.lock().unwrap();
        guard.hex.len() + guard.okyct.len()
    }

    pub fn from_hex(hex: &str, options: TonalPaletteOptions) -> Result<Self, OkyctError> {
        let okyct = hex_to_okyct(hex)?;
        let gamut = options.gamut;
        let mut resolved_chroma = okyct.c;

        if okyct.c > SEED_NEUTRAL_THRESHOLD && (okyct.t < 22.0 || okyct.t > 82.0) {
            let max_at_seed = find_max_chroma_for_tone(okyct.h, okyct.t, gamut)?;
            let cusp = find_gamut_cusp(okyct.h, gamut)?;
            if max_at_seed > 1e-4 && cusp.chroma > max_at_seed {
                let sat_ratio = (okyct.c / max_at_seed).min(1.0);
                let extremity = if okyct.t < 22.0 {
                    smoothstep(22.0, 6.0, okyct.t)
                } else {
                    smoothstep(82.0, 96.0, okyct.t)
                };
                let deattenuated = sat_ratio * cusp.chroma * 0.72;
                resolved_chroma = okyct.c + (okyct.c.max(deattenuated) - okyct.c) * extremity;
            }
        }

        Self::new(okyct.h, resolved_chroma, options)
    }

    pub fn tone_okyct(&self, tone_value: f64, gamut: Option<GamutTarget>) -> Result<Okyct, OkyctError> {
        if !tone_value.is_finite() {
            return Err(OkyctError::new(format!(
                "Invalid tone value: {tone_value}. Expected a finite number in [0, 100]."
            )));
        }
        let gamut = gamut.unwrap_or(self.gamut);
        let t = tone_value.clamp(0.0, 100.0);
        let t_norm = if t == 0.0 { 0.0 } else { t };
        let cache_key = (gamut, t_norm.to_bits());

        if let Some(cached) = self.cache.lock().unwrap().okyct.get(&cache_key) {
            return Ok(cached);
        }

        let result = if t_norm <= 0.001 {
            Okyct::new(self.hue, 0.0, 0.0)
        } else if t_norm >= 99.999 {
            Okyct::new(self.hue, 0.0, 100.0)
        } else {
            let effective_tone = if self.hk_compensation {
                (t_norm - compute_hk_tone_delta(self.hue, self.target_chroma, t_norm)).max(1.0)
            } else {
                t_norm
            };

            let dark_roll = if effective_tone < 18.0 {
                smoothstep(0.0, 18.0, effective_tone)
            } else {
                1.0
            };
            let light_roll = if effective_tone > 85.0 {
                smoothstep(100.0, 85.0, effective_tone)
            } else {
                1.0
            };
            let mut effective_chroma = self.target_chroma * dark_roll * light_roll;

            if effective_tone < 45.0 && effective_chroma > 0.02 {
                let dist = ((self.hue - WARM_YELLOW_CENTER_HUE + 540.0).rem_euclid(360.0) - 180.0).abs();
                if dist < WARM_YELLOW_HALF_WINDOW {
                    let hue_weight = 0.5 + 0.5 * ((dist / WARM_YELLOW_HALF_WINDOW) * PI).cos();
                    let dark_factor = smoothstep(45.0, 10.0, effective_tone);
                    effective_chroma *= 1.0 - 0.35 * hue_weight * dark_factor;
                }
            }

            let max_gamut_chroma = find_max_chroma_for_tone(self.hue, effective_tone, gamut)?;
            let final_chroma = if self.soft_knee {
                apply_soft_knee(effective_chroma, max_gamut_chroma)
            } else {
                effective_chroma.min(max_gamut_chroma)
            };

            Okyct::new(self.hue, final_chroma, effective_tone)
        };

        self.cache
            .lock()
            .unwrap()
            .okyct
            .set(cache_key, result, self.max_cache_size);
        Ok(result)
    }

    pub fn tone(&self, tone_value: f64) -> Result<String, OkyctError> {
        if !tone_value.is_finite() {
            return Err(OkyctError::new(format!(
                "Invalid tone value: {tone_value}. Expected a finite number in [0, 100]."
            )));
        }
        let t = tone_value.clamp(0.0, 100.0);
        let t_norm = if t == 0.0 { 0.0 } else { t };
        let cache_key = t_norm.to_bits();

        if let Some(cached) = self.cache.lock().unwrap().hex.get(&cache_key) {
            return Ok(cached);
        }

        let color_hex = if t_norm <= 0.001 {
            "#000000".to_string()
        } else if t_norm >= 99.999 {
            "#ffffff".to_string()
        } else {
            let okyct = self.tone_okyct(t_norm, Some(GamutTarget::Srgb))?;
            okyct_to_hex(okyct, ColorConversionOptions::default())?
        };

        self.cache
            .lock()
            .unwrap()
            .hex
            .set(cache_key, color_hex.clone(), self.max_cache_size);
        Ok(color_hex)
    }

    pub fn tone_css(&self, tone_value: f64, format: CssColorFormat) -> Result<String, OkyctError> {
        match format {
            CssColorFormat::Hex => self.tone(tone_value),
            CssColorFormat::Oklch => {
                let coord = self.tone_okyct(tone_value, Some(self.gamut))?;
                okyct_to_oklch_css(coord)
            }
            CssColorFormat::DisplayP3 => {
                let coord = self.tone_okyct(tone_value, Some(GamutTarget::DisplayP3))?;
                okyct_to_display_p3_css(coord, Default::default())
            }
        }
    }

    pub fn get_all_tones(&self) -> Result<BTreeMap<u8, String>, OkyctError> {
        let mut result = BTreeMap::new();
        for t in STANDARD_TONES {
            result.insert(t, self.tone(t as f64)?);
        }
        Ok(result)
    }
}

impl TonalPalettePort for TonalPalette {
    fn hue(&self) -> f64 {
        self.hue
    }

    fn target_chroma(&self) -> f64 {
        self.target_chroma
    }

    fn gamut(&self) -> GamutTarget {
        self.gamut
    }

    fn tone(&self, tone_value: f64) -> Result<String, OkyctError> {
        self.tone(tone_value)
    }

    fn tone_okyct(&self, tone_value: f64, gamut: Option<GamutTarget>) -> Result<Okyct, OkyctError> {
        self.tone_okyct(tone_value, gamut)
    }

    fn tone_css(&self, tone_value: f64, format: CssColorFormat) -> Result<String, OkyctError> {
        self.tone_css(tone_value, format)
    }

    fn get_all_tones(&self) -> Result<BTreeMap<u8, String>, OkyctError> {
        self.get_all_tones()
    }
}
