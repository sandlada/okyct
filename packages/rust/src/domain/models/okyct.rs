/// OKYCT (OKLab Chroma-Hue + CIE Y-Tone) perceptual color coordinate model.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Okyct {
    pub h: f64,
    pub c: f64,
    pub t: f64,
}

impl Okyct {
    pub const fn new(h: f64, c: f64, t: f64) -> Self {
        Self { h, c, t }
    }
}

/// Polymorphic tone/color input accepted by contrast and tone solvers.
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum ColorToneInput<'a> {
    Tone(f64),
    Hex(&'a str),
    Okyct(Okyct),
}

impl From<f64> for ColorToneInput<'_> {
    fn from(value: f64) -> Self {
        Self::Tone(value)
    }
}

impl<'a> From<&'a str> for ColorToneInput<'a> {
    fn from(value: &'a str) -> Self {
        Self::Hex(value)
    }
}

impl From<Okyct> for ColorToneInput<'_> {
    fn from(value: Okyct) -> Self {
        Self::Okyct(value)
    }
}
