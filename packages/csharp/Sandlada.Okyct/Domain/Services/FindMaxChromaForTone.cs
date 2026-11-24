using Sandlada.Okyct.Domain.Models;

namespace Sandlada.Okyct.Domain.Services;

public static partial class ColorScience
{
    private const double GamutSearchMarginTolerance = 1e-6;

    public static double FindMaxChromaForTone(double h, double t, ColorConversionOptions? options = null)
    {
        options ??= new();
        var gamut = options.Gamut;
        if (!Enum.IsDefined(gamut))
        {
            throw new ArgumentException("Invalid gamut target");
        }
        if (!double.IsFinite(h) || !double.IsFinite(t) || t < 0 || t > 100)
        {
            throw new ArgumentException($"Invalid hue/tone coordinates: h={h}, t={t}. Expected finite h and t in [0, 100].");
        }
        if (t <= 0.001 || t >= 99.999)
        {
            return 0;
        }
        var targetY = ToneToY(t);
        var rad = (h * Math.PI) / 180;
        var cosH = Math.Cos(rad);
        var sinH = Math.Sin(rad);
        double low = 0;
        var high = gamut == GamutTarget.DisplayP3 ? 0.50 : 0.38;
        var lastL = Math.Cbrt(targetY);
        var fLow = Math.Min(targetY, 1 - targetY);
        var fHigh = double.NaN;
        for (var i = 0; i < 6; i++)
        {
            var mid = (low + high) * 0.5;
            var ev = EvalLinearGamutMargin(targetY, mid * cosH, mid * sinH, gamut, lastL);
            if (ev.Margin >= -GamutSearchMarginTolerance)
            {
                low = mid;
                fLow = ev.Margin;
                lastL = ev.L;
            }
            else
            {
                high = mid;
                fHigh = ev.Margin;
            }
        }
        if (double.IsNaN(fHigh))
        {
            fHigh = EvalLinearGamutMargin(targetY, high * cosH, high * sinH, gamut, lastL).Margin;
        }
        var side = 0;
        for (var i = 0; i < 8; i++)
        {
            if (high - low < 1e-6)
            {
                break;
            }
            var denom = fHigh - fLow;
            var x = Math.Abs(denom) > 1e-12 ? (low * fHigh - high * fLow) / denom : (low + high) * 0.5;
            if (!(x > low && x < high))
            {
                x = (low + high) * 0.5;
            }
            var ev = EvalLinearGamutMargin(targetY, x * cosH, x * sinH, gamut, lastL);
            if (Math.Abs(ev.Margin) <= GamutSearchMarginTolerance)
            {
                low = x;
                break;
            }
            if (ev.Margin > 0)
            {
                low = x;
                fLow = ev.Margin;
                lastL = ev.L;
                if (side == -1)
                {
                    fHigh *= 0.5;
                }
                side = -1;
            }
            else
            {
                high = x;
                fHigh = ev.Margin;
                if (side == 1)
                {
                    fLow *= 0.5;
                }
                side = 1;
            }
        }
        return low;
    }
}
