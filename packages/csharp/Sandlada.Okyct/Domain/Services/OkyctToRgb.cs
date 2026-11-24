using Sandlada.Okyct.Domain.Models;

namespace Sandlada.Okyct.Domain.Services;

public static partial class ColorScience
{
    private static double ClampUnitChannel(double linear)
    {
        if (linear <= 0)
        {
            return 0;
        }
        if (linear >= 1)
        {
            return 1;
        }
        return LinearToSrgb(linear);
    }

    private static Rgb ClampUnitRgb(Rgb linear)
    {
        return new Rgb(ClampUnitChannel(linear.R), ClampUnitChannel(linear.G), ClampUnitChannel(linear.B));
    }

    public static Rgb OkyctToRgb(OkyctColor okyct, ColorConversionOptions? options = null)
    {
        options ??= new();
        var (h, c, t) = okyct;
        if (!double.IsFinite(h) || !double.IsFinite(c) || !double.IsFinite(t) || c < 0 || t < 0 || t > 100)
        {
            throw new ArgumentException($"Invalid OKYCT coordinates: h={h}, c={c}, t={t}. Expected finite h, c >= 0, and t in [0, 100].");
        }
        var gamut = options.Gamut;
        if (!Enum.IsDefined(gamut))
        {
            throw new ArgumentException("Invalid gamut target");
        }
        var gamutMapping = options.GamutMapping;
        if (!Enum.IsDefined(gamutMapping))
        {
            throw new ArgumentException("Invalid gamutMapping mode");
        }
        if (t <= 0.001)
        {
            return new Rgb(0, 0, 0);
        }
        if (t >= 99.999)
        {
            return new Rgb(1, 1, 1);
        }
        var targetY = ToneToY(t);
        if (c == 0)
        {
            var srgb = LinearToSrgb(targetY);
            return new Rgb(srgb, srgb, srgb);
        }
        var rad = (h * Math.PI) / 180;
        var cosH = Math.Cos(rad);
        var sinH = Math.Sin(rad);
        var check = EvalLinearGamutMargin(targetY, c * cosH, c * sinH, gamut);
        if (check.Margin >= -GamutTolerance)
        {
            return ClampUnitRgb(check.Linear);
        }
        if (gamutMapping == GamutMappingMode.CuspCompress)
        {
            return ClampUnitRgb(CompressToGamutCusp(h, c, t, gamut));
        }
        var maxC = FindMaxChromaForTone(h, t, new ColorConversionOptions(gamut));
        var safe = EvalLinearGamutMargin(targetY, maxC * cosH, maxC * sinH, gamut, check.L);
        return ClampUnitRgb(safe.Linear);
    }
}
