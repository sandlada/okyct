using Sandlada.Okyct.Domain.Models;

namespace Sandlada.Okyct.Domain.Services;

public static partial class ColorScience
{
    public static GamutCheckResult IsInGamut(OkyctColor okyct, ColorConversionOptions? options = null)
    {
        options ??= new();
        var (h, c, t) = okyct;
        var gamut = options.Gamut;
        if (!Enum.IsDefined(gamut))
        {
            throw new ArgumentException("Invalid gamut target");
        }
        if (!double.IsFinite(h) || !double.IsFinite(c) || !double.IsFinite(t) || c < 0 || t < 0 || t > 100)
        {
            throw new ArgumentException($"Invalid OKYCT coordinates for gamut check: h={h}, c={c}, t={t}. Expected finite h, c >= 0, and t in [0, 100].");
        }
        if (t <= 0.001 && c <= GamutTolerance)
        {
            return new GamutCheckResult(true, new Rgb(0, 0, 0));
        }
        if (t >= 99.999 && c <= GamutTolerance)
        {
            return new GamutCheckResult(true, new Rgb(1, 1, 1));
        }
        var targetY = ToneToY(t);
        var rad = (h * Math.PI) / 180;
        var a = c * Math.Cos(rad);
        var b = c * Math.Sin(rad);
        var ev = EvalLinearGamutMargin(targetY, a, b, gamut);
        Rgb rgb = new Rgb(LinearToSrgb(ev.Linear.R), LinearToSrgb(ev.Linear.G), LinearToSrgb(ev.Linear.B));
        return new GamutCheckResult(ev.Margin >= -GamutTolerance, rgb);
    }
}
