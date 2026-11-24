use std::cmp::Ordering;
use std::f64::consts::PI;

use crate::domain::models::{ColorConversionOptions, Okyct, OkyctError, Rgb};
use crate::domain::services::{hex_to_okyct, okyct_to_hex, rgb_to_okyct, shortest_hue_delta};
use crate::ports::outbound::{
    ExtractSeedsOptions, ExtractedSeedColor, ImagePixelBuffer, ImageQuantizerMode,
};

const GRID_HUE_BINS: usize = 72;
const GRID_TONE_BANDS: usize = 5;
const DEG_TO_RAD: f64 = PI / 180.0;
const RAD_TO_DEG: f64 = 180.0 / PI;
const FALLBACK_HEX: &str = "#1A73E8";

#[inline]
fn js_round(x: f64) -> f64 {
    (x + 0.5).floor()
}

fn create_fallback_seed() -> ExtractedSeedColor {
    ExtractedSeedColor {
        hex: FALLBACK_HEX.to_string(),
        okyct: hex_to_okyct(FALLBACK_HEX).unwrap(),
        population_ratio: 0.0,
        salience_score: 0.0,
        is_fallback: Some(true),
    }
}

struct SeedCandidate {
    hue: f64,
    score: f64,
    avg_c: f64,
    avg_t: f64,
    pop_ratio: f64,
}

fn extract_hue_histogram_seeds(
    data: &[u8],
    max_colors: usize,
    min_hue_distance: f64,
) -> Result<Vec<ExtractedSeedColor>, OkyctError> {
    let mut hue_bins = [0.0_f64; 360];
    let mut chroma_sum = [0.0_f64; 360];
    let mut tone_sum = [0.0_f64; 360];

    let mut total_opaque_pixels: usize = 0;
    let mut valid_pixels: usize = 0;

    for chunk in data.as_chunks::<4>().0 {
        if chunk[3] < 128 {
            continue;
        }
        total_opaque_pixels += 1;

        let okyct = rgb_to_okyct(Rgb::new(
            (chunk[0] as f64) / 255.0,
            (chunk[1] as f64) / 255.0,
            (chunk[2] as f64) / 255.0,
        ))?;

        if okyct.t < 10.0 || okyct.t > 95.0 || okyct.c < 0.028 {
            continue;
        }

        let bin = (okyct.h.floor() as isize).rem_euclid(360) as usize;
        hue_bins[bin] += 1.0;
        chroma_sum[bin] += okyct.c;
        tone_sum[bin] += okyct.t;
        valid_pixels += 1;
    }

    if valid_pixels == 0 || total_opaque_pixels == 0 {
        return Ok(vec![create_fallback_seed()]);
    }

    let mut scores = Vec::new();
    for h in 0..360 {
        if hue_bins[h] == 0.0 {
            continue;
        }

        let mut neighbor_pop = 0.0;
        let mut raw_cluster_pop = 0.0;
        let mut weighted_chroma = 0.0;
        let mut weighted_tone = 0.0;

        for offset in -7_isize..=7 {
            let idx = (h as isize + offset).rem_euclid(360) as usize;
            let weight = 1.0 - (offset.abs() as f64) / 9.0;
            neighbor_pop += hue_bins[idx] * weight;
            raw_cluster_pop += hue_bins[idx];
            weighted_chroma += chroma_sum[idx] * weight;
            weighted_tone += tone_sum[idx] * weight;
        }

        let avg_c = weighted_chroma / neighbor_pop;
        let avg_t = weighted_tone / neighbor_pop;
        let pop_ratio = raw_cluster_pop / (total_opaque_pixels as f64);

        let chroma_factor = (avg_c.min(0.28) / 0.14).powf(1.15);
        let tone_penalty = if !(20.0..=85.0).contains(&avg_t) {
            0.65
        } else {
            1.0
        };
        let score = (neighbor_pop / (valid_pixels as f64)) * 100.0 * chroma_factor * tone_penalty;

        scores.push(SeedCandidate {
            hue: h as f64,
            score,
            avg_c,
            avg_t,
            pop_ratio,
        });
    }

    scores.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap_or(Ordering::Equal));

    let mut selected: Vec<ExtractedSeedColor> = Vec::new();
    for candidate in scores {
        let mut is_too_close = false;
        for existing in &selected {
            if shortest_hue_delta(existing.okyct.h, candidate.hue)? < min_hue_distance {
                is_too_close = true;
                break;
            }
        }
        if !is_too_close {
            let clamped_t = candidate.avg_t.clamp(35.0, 72.0);
            let clamped_c = candidate.avg_c.clamp(0.08, 0.24);
            let coord = Okyct::new(candidate.hue, clamped_c, clamped_t);
            let hex = okyct_to_hex(coord, ColorConversionOptions::default())?;

            selected.push(ExtractedSeedColor {
                hex,
                okyct: coord,
                population_ratio: candidate.pop_ratio.min(1.0),
                salience_score: js_round(candidate.score * 10.0) / 10.0,
                is_fallback: None,
            });

            if selected.len() >= max_colors {
                break;
            }
        }
    }

    Ok(selected)
}

fn extract_hue_tone_grid_seeds(
    data: &[u8],
    max_colors: usize,
    min_hue_distance: f64,
    min_tone_distance: f64,
) -> Result<Vec<ExtractedSeedColor>, OkyctError> {
    let total_cells = GRID_HUE_BINS * GRID_TONE_BANDS;
    let mut cell_count = vec![0.0_f64; total_cells];
    let mut cell_chroma_sum = vec![0.0_f64; total_cells];
    let mut cell_tone_sum = vec![0.0_f64; total_cells];
    let mut cell_cos_sum = vec![0.0_f64; total_cells];
    let mut cell_sin_sum = vec![0.0_f64; total_cells];

    let mut total_opaque_pixels: usize = 0;
    let mut valid_pixels: usize = 0;

    for chunk in data.as_chunks::<4>().0 {
        if chunk[3] < 128 {
            continue;
        }
        total_opaque_pixels += 1;

        let okyct = rgb_to_okyct(Rgb::new(
            (chunk[0] as f64) / 255.0,
            (chunk[1] as f64) / 255.0,
            (chunk[2] as f64) / 255.0,
        ))?;

        if okyct.t < 10.0 || okyct.t > 95.0 || okyct.c < 0.028 {
            continue;
        }

        let h_bin = ((okyct.h / 5.0).floor() as isize).rem_euclid(GRID_HUE_BINS as isize) as usize;
        let t_band = ((okyct.t / 20.0).floor() as usize).min(GRID_TONE_BANDS - 1);
        let cell = h_bin * GRID_TONE_BANDS + t_band;
        let rad = okyct.h * DEG_TO_RAD;

        cell_count[cell] += 1.0;
        cell_chroma_sum[cell] += okyct.c;
        cell_tone_sum[cell] += okyct.t;
        cell_cos_sum[cell] += rad.cos();
        cell_sin_sum[cell] += rad.sin();
        valid_pixels += 1;
    }

    if valid_pixels == 0 || total_opaque_pixels == 0 {
        return Ok(vec![create_fallback_seed()]);
    }

    let mut scores = Vec::new();
    for h_bin in 0..GRID_HUE_BINS {
        for t_band in 0..GRID_TONE_BANDS {
            let center_cell = h_bin * GRID_TONE_BANDS + t_band;
            if cell_count[center_cell] == 0.0 {
                continue;
            }

            let mut weighted_pop = 0.0;
            let mut raw_cluster_pop = 0.0;
            let mut weighted_chroma = 0.0;
            let mut weighted_tone = 0.0;
            let mut weighted_cos = 0.0;
            let mut weighted_sin = 0.0;

            for dh in -1_isize..=1 {
                let nh = (h_bin as isize + dh).rem_euclid(GRID_HUE_BINS as isize) as usize;
                let h_weight = if dh == 0 { 1.0 } else { 0.5 };
                for dt in -1_isize..=1 {
                    let nt = t_band as isize + dt;
                    if nt < 0 || nt >= GRID_TONE_BANDS as isize {
                        continue;
                    }
                    let t_weight = if dt == 0 { 1.0 } else { 0.25 };
                    let weight = h_weight * t_weight;
                    let n_cell = nh * GRID_TONE_BANDS + (nt as usize);
                    let count = cell_count[n_cell];
                    if count == 0.0 {
                        continue;
                    }

                    weighted_pop += count * weight;
                    raw_cluster_pop += count;
                    weighted_chroma += cell_chroma_sum[n_cell] * weight;
                    weighted_tone += cell_tone_sum[n_cell] * weight;
                    weighted_cos += cell_cos_sum[n_cell] * weight;
                    weighted_sin += cell_sin_sum[n_cell] * weight;
                }
            }

            let avg_c = weighted_chroma / weighted_pop;
            let avg_t = weighted_tone / weighted_pop;
            let mut mean_hue = weighted_sin.atan2(weighted_cos) * RAD_TO_DEG;
            if mean_hue < 0.0 {
                mean_hue += 360.0;
            }
            let pop_ratio = raw_cluster_pop / (total_opaque_pixels as f64);

            let chroma_factor = (avg_c.min(0.28) / 0.14).powf(1.15);
            let tone_penalty = if !(16.0..=88.0).contains(&avg_t) {
                0.7
            } else {
                1.0
            };
            let score = (weighted_pop / (valid_pixels as f64)) * 100.0 * chroma_factor * tone_penalty;

            scores.push(SeedCandidate {
                hue: mean_hue,
                score,
                avg_c,
                avg_t,
                pop_ratio,
            });
        }
    }

    scores.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap_or(Ordering::Equal));

    let mut selected: Vec<ExtractedSeedColor> = Vec::new();
    for candidate in scores {
        let clamped_t = candidate.avg_t.clamp(20.0, 82.0);
        let clamped_c = candidate.avg_c.clamp(0.08, 0.24);
        let mut is_too_close = false;
        for existing in &selected {
            if shortest_hue_delta(existing.okyct.h, candidate.hue)? < min_hue_distance
                && (existing.okyct.t - clamped_t).abs() < min_tone_distance
            {
                is_too_close = true;
                break;
            }
        }

        if !is_too_close {
            let rounded_h = js_round(candidate.hue * 100.0) / 100.0;
            let coord = Okyct::new(rounded_h, clamped_c, clamped_t);
            let hex = okyct_to_hex(coord, ColorConversionOptions::default())?;

            selected.push(ExtractedSeedColor {
                hex,
                okyct: coord,
                population_ratio: candidate.pop_ratio.min(1.0),
                salience_score: js_round(candidate.score * 10.0) / 10.0,
                is_fallback: None,
            });

            if selected.len() >= max_colors {
                break;
            }
        }
    }

    Ok(selected)
}

pub fn extract_seeds_from_image_data(
    image_data: ImagePixelBuffer<'_>,
    options: ExtractSeedsOptions,
) -> Result<Vec<ExtractedSeedColor>, OkyctError> {
    if !image_data.data.len().is_multiple_of(4) {
        return Err(OkyctError::new(format!(
            "Invalid imageData.data length: {}. Expected a multiple of 4 (RGBA).",
            image_data.data.len()
        )));
    }
    if let (Some(w), Some(h)) = (image_data.width, image_data.height)
        && w * h * 4 != image_data.data.len()
    {
        return Err(OkyctError::new(format!(
            "Invalid imageData buffer size: width ({w}) * height ({h}) * 4 = {}, but data.length is {}.",
            w * h * 4,
            image_data.data.len()
        )));
    }
    if options.max_colors < 1 {
        return Err(OkyctError::new(format!(
            "Invalid maxColors: {}. Expected >= 1.",
            options.max_colors
        )));
    }
    if !options.min_hue_distance.is_finite() || options.min_hue_distance < 0.0 {
        return Err(OkyctError::new(format!(
            "Invalid minHueDistance: {}. Expected a non-negative finite number.",
            options.min_hue_distance
        )));
    }
    if !options.min_tone_distance.is_finite() || options.min_tone_distance < 0.0 {
        return Err(OkyctError::new(format!(
            "Invalid minToneDistance: {}. Expected a non-negative finite number.",
            options.min_tone_distance
        )));
    }

    match options.mode {
        ImageQuantizerMode::HueHistogram => extract_hue_histogram_seeds(
            image_data.data,
            options.max_colors,
            options.min_hue_distance,
        ),
        ImageQuantizerMode::HueToneGrid => extract_hue_tone_grid_seeds(
            image_data.data,
            options.max_colors,
            options.min_hue_distance,
            options.min_tone_distance,
        ),
    }
}
