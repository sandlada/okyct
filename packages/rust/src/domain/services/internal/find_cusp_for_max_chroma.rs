use std::f64::consts::PI;
use crate::domain::models::{GamutCusp, GamutTarget, Rgb};
use super::super::tone_y::y_to_tone_unchecked as y_to_tone;
use super::xyz::{linear_p3_to_xyz, linear_rgb_to_xyz, xyz_to_oklab};

#[derive(Debug, Clone, Copy)]
struct VertexCusp {
    hue: f64,
    chroma: f64,
    tone: f64,
}

const DEG_TO_RAD: f64 = PI / 180.0;
const RAD_TO_DEG: f64 = 180.0 / PI;

const CHROMATIC_VERTICES: [Rgb; 6] = [
    Rgb::new(1.0, 0.0, 0.0),
    Rgb::new(1.0, 1.0, 0.0),
    Rgb::new(0.0, 1.0, 0.0),
    Rgb::new(0.0, 1.0, 1.0),
    Rgb::new(0.0, 0.0, 1.0),
    Rgb::new(1.0, 0.0, 1.0),
];

fn eval_vertex(rgb: Rgb, gamut: GamutTarget) -> VertexCusp {
    let xyz = match gamut {
        GamutTarget::DisplayP3 => linear_p3_to_xyz(rgb),
        GamutTarget::Srgb => linear_rgb_to_xyz(rgb),
    };
    let lab = xyz_to_oklab(xyz);
    let mut h = lab.b.atan2(lab.a) * RAD_TO_DEG;
    if h < 0.0 {
        h += 360.0;
    }
    VertexCusp {
        hue: h,
        chroma: lab.a.hypot(lab.b),
        tone: y_to_tone(xyz.y),
    }
}

fn signed_hue_diff(actual_hue: f64, target_hue: f64) -> f64 {
    ((actual_hue - target_hue + 540.0).rem_euclid(360.0)) - 180.0
}

fn find_containing_edge_index(h: f64, vertices: &[VertexCusp; 6]) -> usize {
    for i in 0..6 {
        let h0 = vertices[i].hue;
        let h1 = vertices[(i + 1) % 6].hue;
        let span = (h1 - h0 + 360.0).rem_euclid(360.0);
        let offset = (h - h0 + 360.0).rem_euclid(360.0);
        if offset < span {
            return i;
        }
    }
    5
}

pub fn find_cusp_for_max_chroma(hue: f64, gamut: GamutTarget) -> GamutCusp {
    let h = hue.rem_euclid(360.0);
    let is_p3 = gamut == GamutTarget::DisplayP3;

    let vertices = [
        eval_vertex(CHROMATIC_VERTICES[0], gamut),
        eval_vertex(CHROMATIC_VERTICES[1], gamut),
        eval_vertex(CHROMATIC_VERTICES[2], gamut),
        eval_vertex(CHROMATIC_VERTICES[3], gamut),
        eval_vertex(CHROMATIC_VERTICES[4], gamut),
        eval_vertex(CHROMATIC_VERTICES[5], gamut),
    ];

    let edge_idx = find_containing_edge_index(h, &vertices);
    let v0_vert = vertices[edge_idx];
    let mut f_lo = signed_hue_diff(v0_vert.hue, h);
    if f_lo.abs() < 1e-7 {
        return GamutCusp {
            tone: v0_vert.tone,
            chroma: v0_vert.chroma,
        };
    }

    let v1_vert = vertices[(edge_idx + 1) % 6];
    let mut f_hi = signed_hue_diff(v1_vert.hue, h);
    if f_hi.abs() < 1e-7 {
        return GamutCusp {
            tone: v1_vert.tone,
            chroma: v1_vert.chroma,
        };
    }

    let v0 = CHROMATIC_VERTICES[edge_idx];
    let v1 = CHROMATIC_VERTICES[(edge_idx + 1) % 6];
    let dr = v1.r - v0.r;
    let dg = v1.g - v0.g;
    let db = v1.b - v0.b;

    let target_rad = h * DEG_TO_RAD;
    let ref_cos = target_rad.cos();
    let ref_sin = target_rad.sin();

    let mut lo = 0.0;
    let mut hi = 1.0;
    let mut side = 0;
    let mut best_y = 0.0;
    let mut best_a = 0.0;
    let mut best_b = 0.0;

    for _ in 0..16 {
        let denom = f_hi - f_lo;
        let mut u = if denom.abs() > 1e-12 {
            (lo * f_hi - hi * f_lo) / denom
        } else {
            (lo + hi) * 0.5
        };
        if !(u > lo && u < hi) {
            u = (lo + hi) * 0.5;
        }

        let r = v0.r + dr * u;
        let g = v0.g + dg * u;
        let b = v0.b + db * u;

        let (x, y, z) = if is_p3 {
            (
                0.4865710 * r + 0.2656677 * g + 0.1982173 * b,
                0.2289746 * r + 0.6917385 * g + 0.0792869 * b,
                0.0451134 * g + 1.0439444 * b,
            )
        } else {
            (
                0.4124564 * r + 0.3575761 * g + 0.1804375 * b,
                0.2126729 * r + 0.7151522 * g + 0.0721750 * b,
                0.0193339 * r + 0.1191920 * g + 0.9503041 * b,
            )
        };

        let l_ = (0.8189330101 * x + 0.3618667424 * y - 0.1288597137 * z).cbrt();
        let m_ = (0.0329845436 * x + 0.9293118715 * y + 0.0361456387 * z).cbrt();
        let s_ = (0.0482003018 * x + 0.2643662691 * y + 0.6338517070 * z).cbrt();

        best_a = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_;
        best_b = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_;
        best_y = y;

        let d_parallel = best_a * ref_cos + best_b * ref_sin;
        let d_perp = best_b * ref_cos - best_a * ref_sin;
        let err = d_perp.atan2(d_parallel) * RAD_TO_DEG;
        if err.abs() < 1e-4 || hi - lo < 1e-6 {
            break;
        }

        if err <= 0.0 {
            lo = u;
            f_lo = err;
            if side == -1 {
                f_hi *= 0.5;
            }
            side = -1;
        } else {
            hi = u;
            f_hi = err;
            if side == 1 {
                f_lo *= 0.5;
            }
            side = 1;
        }
    }

    GamutCusp {
        tone: y_to_tone(best_y),
        chroma: best_a.hypot(best_b),
    }
}
