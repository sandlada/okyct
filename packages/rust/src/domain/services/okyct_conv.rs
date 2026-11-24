use std::f64::consts::PI;
use crate::domain::models::{
    ColorConversionOptions, GamutMappingMode, GamutTarget, Okyct, OkyctError, Rgb,
};
use super::gamut::find_max_chroma_for_tone;
use super::internal::compress_to_gamut_cusp::compress_to_gamut_cusp;
use super::internal::eval_linear_gamut_margin::eval_linear_gamut_margin;
use super::internal::snap_rgb_for_hue_preserve::snap_rgb_to_hex_for_hue_preserve;
use super::internal::solve_oklab_l_for_target_y::solve_oklab_l_for_target_y;
use super::internal::srgb_lut::{parse_hex_to_rgb24, srgb_byte_to_linear};
use super::internal::xyz::{linear_rgb_to_xyz, xyz_to_oklab};
use super::srgb_to_linear::{linear_to_srgb, srgb_to_linear};
use super::tone_y::{tone_to_y, y_to_tone};

const RAD_TO_DEG: f64 = 180.0 / PI;
const GAMUT_TOLERANCE: f64 = 1e-5;

pub fn rgb_to_okyct(rgb: Rgb) -> Result<Okyct, OkyctError> {
    if !rgb.r.is_finite() || !rgb.g.is_finite() || !rgb.b.is_finite() {
        return Err(OkyctError::new(
            "Invalid RGB input: expected finite numeric r, g, and b fields.",
        ));
    }
    if rgb.r == rgb.g && rgb.g == rgb.b {
        return Ok(Okyct::new(0.0, 0.0, y_to_tone(srgb_to_linear(rgb.r)?)?));
    }

    let rl = srgb_to_linear(rgb.r)?;
    let gl = srgb_to_linear(rgb.g)?;
    let bl = srgb_to_linear(rgb.b)?;

    let xyz = linear_rgb_to_xyz(Rgb::new(rl, gl, bl));
    let oklab = xyz_to_oklab(xyz);

    let c = oklab.a.hypot(oklab.b);
    let t = y_to_tone(xyz.y)?;
    if c < 1e-7 {
        return Ok(Okyct::new(0.0, 0.0, t));
    }

    let mut h = oklab.b.atan2(oklab.a) * RAD_TO_DEG;
    if h < 0.0 {
        h += 360.0;
    }

    Ok(Okyct::new(h, c, t))
}

pub fn hex_to_okyct(hex: &str) -> Result<Okyct, OkyctError> {
    let rgb24 = parse_hex_to_rgb24(hex)?;
    let r8 = ((rgb24 >> 16) & 255) as u8;
    let g8 = ((rgb24 >> 8) & 255) as u8;
    let b8 = (rgb24 & 255) as u8;

    if r8 == g8 && g8 == b8 {
        return Ok(Okyct::new(0.0, 0.0, y_to_tone(srgb_byte_to_linear(r8))?));
    }

    let xyz = linear_rgb_to_xyz(Rgb::new(
        srgb_byte_to_linear(r8),
        srgb_byte_to_linear(g8),
        srgb_byte_to_linear(b8),
    ));
    let oklab = xyz_to_oklab(xyz);

    let c = oklab.a.hypot(oklab.b);
    let t = y_to_tone(xyz.y)?;
    if c < 1e-7 {
        return Ok(Okyct::new(0.0, 0.0, t));
    }

    let mut h = oklab.b.atan2(oklab.a) * RAD_TO_DEG;
    if h < 0.0 {
        h += 360.0;
    }

    Ok(Okyct::new(h, c, t))
}

#[inline]
fn clamp_unit_channel(linear: f64) -> f64 {
    if linear <= 0.0 {
        0.0
    } else if linear >= 1.0 {
        1.0
    } else {
        linear_to_srgb(linear).unwrap_or(0.0)
    }
}

#[inline]
fn clamp_unit_rgb(linear: Rgb) -> Rgb {
    Rgb::new(
        clamp_unit_channel(linear.r),
        clamp_unit_channel(linear.g),
        clamp_unit_channel(linear.b),
    )
}

pub fn okyct_to_rgb(okyct: Okyct, options: ColorConversionOptions) -> Result<Rgb, OkyctError> {
    let Okyct { h, c, t } = okyct;
    if !h.is_finite() || !c.is_finite() || !t.is_finite() || c < 0.0 || !(0.0..=100.0).contains(&t) {
        return Err(OkyctError::new(format!(
            "Invalid OKYCT coordinates: h={h}, c={c}, t={t}. Expected finite h, c >= 0, and t in [0, 100]."
        )));
    }

    if t <= 0.001 {
        return Ok(Rgb::new(0.0, 0.0, 0.0));
    }
    if t >= 99.999 {
        return Ok(Rgb::new(1.0, 1.0, 1.0));
    }

    let target_y = tone_to_y(t)?;
    if c == 0.0 {
        let srgb = linear_to_srgb(target_y)?;
        return Ok(Rgb::new(srgb, srgb, srgb));
    }

    let rad = h * PI / 180.0;
    let cos_h = rad.cos();
    let sin_h = rad.sin();

    let check = eval_linear_gamut_margin(target_y, c * cos_h, c * sin_h, options.gamut, None);
    if check.margin >= -GAMUT_TOLERANCE {
        return Ok(clamp_unit_rgb(check.linear));
    }

    if options.gamut_mapping == GamutMappingMode::CuspCompress {
        return Ok(clamp_unit_rgb(compress_to_gamut_cusp(h, c, t, options.gamut)));
    }

    let max_c = find_max_chroma_for_tone(h, t, options.gamut)?;
    let safe = eval_linear_gamut_margin(
        target_y,
        max_c * cos_h,
        max_c * sin_h,
        options.gamut,
        Some(check.l),
    );
    Ok(clamp_unit_rgb(safe.linear))
}

pub fn okyct_to_hex(okyct: Okyct, options: ColorConversionOptions) -> Result<String, OkyctError> {
    let rgb = okyct_to_rgb(okyct, options)?;
    if options.gamut == GamutTarget::DisplayP3 {
        return Err(OkyctError::new(
            "okyctToHex produces 8-bit sRGB hex strings; use okyctToDisplayP3Css for Display P3 output.",
        ));
    }
    if okyct.t <= 0.001 {
        return Ok("#000000".to_string());
    }
    if okyct.t >= 99.999 {
        return Ok("#ffffff".to_string());
    }
    if options.gamut_mapping == GamutMappingMode::CuspCompress {
        let mapped = rgb_to_okyct(rgb)?;
        return Ok(snap_rgb_to_hex_for_hue_preserve(
            rgb,
            okyct.h,
            mapped.t,
            Some(mapped.c),
        ));
    }
    Ok(snap_rgb_to_hex_for_hue_preserve(
        rgb,
        okyct.h,
        okyct.t,
        Some(okyct.c),
    ))
}

pub fn okyct_to_display_p3_css(
    okyct: Okyct,
    gamut_mapping: GamutMappingMode,
) -> Result<String, OkyctError> {
    let p3 = okyct_to_rgb(
        okyct,
        ColorConversionOptions::new(GamutTarget::DisplayP3, gamut_mapping),
    )?;
    Ok(format!(
        "color(display-p3 {:.4} {:.4} {:.4})",
        p3.r, p3.g, p3.b
    ))
}

pub fn okyct_to_oklch_css(okyct: Okyct) -> Result<String, OkyctError> {
    let Okyct { h, c, t } = okyct;
    if !h.is_finite() || !c.is_finite() || !t.is_finite() || c < 0.0 || !(0.0..=100.0).contains(&t) {
        return Err(OkyctError::new(format!(
            "Invalid OKYCT coordinates: h={h}, c={c}, t={t}. Expected finite h, c >= 0, and t in [0, 100]."
        )));
    }

    let y = tone_to_y(t)?;
    let l = if c == 0.0 {
        y.cbrt()
    } else {
        let rad = h * PI / 180.0;
        let a = c * rad.cos();
        let b = c * rad.sin();
        solve_oklab_l_for_target_y(y, a, b, None)
    };
    let h_norm = h.rem_euclid(360.0);
    Ok(format!("oklch({:.2}% {:.4} {:.2})", l * 100.0, c, h_norm))
}
