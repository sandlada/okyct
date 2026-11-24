using Sandlada.Okyct.Domain.Models;
using Sandlada.Okyct.Ports.Inbound;
using static Sandlada.Okyct.Domain.Services.ColorScience;

namespace Sandlada.Okyct.Application;

public static class Palettes
{
    public static PaletteSet<TonalPalette> CreatePalettesFromSource(string sourceHex, CreatePalettesOptions? options = null)
    {
        options ??= new();
        if (!Enum.IsDefined(options.Variant)) throw new ArgumentOutOfRangeException(nameof(options));

        var source = HexToOkyct(sourceHex);
        var h = source.H;
        var c = Math.Max(0.04, source.C);
        var neutral = IsWarmHue(h) ? 0.012 : 0.014;
        var neutralVariant = neutral * 2.2;

        TonalPalette Semantic(string hex, double maxShift) =>
            TonalPalette.FromHex(options.HarmonizeSemantics ? HarmonizeHex(hex, sourceHex, maxShift) : hex, options);

        var error = Semantic("#BA1A1A", 15);
        var warning = Semantic("#E69900", 18);
        var success = Semantic("#1E8E3E", 18);
        var info = Semantic("#0288D1", 18);

        TonalPalette Palette(double hue, double chroma) => new(hue, chroma, options);
        PaletteSet<TonalPalette> Set(
            double primary, double secondaryHue, double secondary, double tertiaryHue, double tertiary,
            double neutralHue, double neutralChroma, double neutralVariantChroma) =>
            new(Palette(h, primary), Palette(secondaryHue, secondary), Palette(tertiaryHue, tertiary),
                Palette(neutralHue, neutralChroma), Palette(neutralHue, neutralVariantChroma),
                error, warning, success, info);

        return options.Variant switch
        {
            PaletteVariant.Vibrant => Set(Math.Max(0.12, c), (h + 25) % 360, Math.Max(0.08, c * 0.7),
                (h + 60) % 360, Math.Max(0.1, c * 0.85), h, neutral * 1.5, neutralVariant * 1.3),
            PaletteVariant.Expressive => Set(Math.Max(0.1, c), (h + 90) % 360, Math.Max(0.07, c * 0.65),
                (h + 180) % 360, Math.Max(0.09, c * 0.8), (h + 15) % 360, neutral * 1.4, neutralVariant * 1.3),
            PaletteVariant.Neutral => Set(Math.Min(0.08, c * 0.6), h, Math.Min(0.04, c * 0.35),
                (h + 40) % 360, Math.Min(0.05, c * 0.45), h, neutral * 0.8, neutralVariant * 0.8),
            PaletteVariant.Monochrome => Set(0, h, 0, h, 0, h, 0, 0),
            PaletteVariant.Fidelity => Set(c, (h + 15) % 360, c * 0.5, (h + 30) % 360, c * 0.7,
                h, neutral, neutralVariant),
            _ => Set(Math.Max(0.09, Math.Min(0.18, c)), (h + 15) % 360, Math.Max(0.04, c * 0.45),
                (h + 60) % 360, Math.Max(0.06, c * 0.65), h, neutral, neutralVariant)
        };
    }

    public static bool IsWarmHue(double hue)
    {
        if (!double.IsFinite(hue)) throw new ArgumentOutOfRangeException(nameof(hue));
        var normalized = ((hue % 360) + 360) % 360;
        return normalized is >= 20 and <= 110 or >= 340;
    }

    public static string HarmonizeHex(string designHex, string sourceHex, double maxShiftAngle = 18)
    {
        if (!double.IsFinite(maxShiftAngle) || maxShiftAngle < 0)
            throw new ArgumentOutOfRangeException(nameof(maxShiftAngle));

        var design = HexToOkyct(designHex);
        var source = HexToOkyct(sourceHex);
        var weight = Smoothstep(0.005, 0.035, source.C);
        if (weight <= 0) return designHex;

        var difference = ((source.H - design.H + 180) % 360) - 180;
        if (difference < -180) difference += 360;
        if (Math.Abs(difference) >= 120) return designHex;

        var shift = Math.Sign(difference) * Math.Min(Math.Abs(difference) * 0.45, maxShiftAngle) * weight;
        var hue = (design.H + shift + 360) % 360;
        var maxOld = FindMaxChromaForTone(design.H, design.T);
        var maxNew = FindMaxChromaForTone(hue, design.T);
        var chroma = maxOld > 1e-4 ? Math.Min(design.C, design.C * (maxNew / maxOld)) : design.C;
        return OkyctToHex(new OkyctColor(hue, chroma, design.T));
    }

    internal static double Smoothstep(double edge0, double edge1, double value)
    {
        var t = Math.Clamp((value - edge0) / (edge1 - edge0), 0, 1);
        return t * t * (3 - 2 * t);
    }
}
