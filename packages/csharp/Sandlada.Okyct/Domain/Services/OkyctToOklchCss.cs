using Sandlada.Okyct.Domain.Models;

namespace Sandlada.Okyct.Domain.Services;

public static partial class ColorScience
{
    public static string OkyctToOklchCss(OkyctColor okyct)
    {
        var (h, c, t) = okyct;
        if (!double.IsFinite(h) || !double.IsFinite(c) || !double.IsFinite(t) || c < 0 || t < 0 || t > 100)
        {
            throw new ArgumentException($"Invalid OKYCT coordinates: h={h}, c={c}, t={t}. Expected finite h, c >= 0, and t in [0, 100].");
        }
        var y = ToneToY(t);
        double l;
        if (c == 0)
        {
            l = Math.Cbrt(y);
        }
        else
        {
            var rad = (h * Math.PI) / 180;
            var a = c * Math.Cos(rad);
            var b = c * Math.Sin(rad);
            l = SolveOklabLForTargetY(y, a, b);
        }
        var hNorm = h % 360;
        if (hNorm < 0)
        {
            hNorm += 360;
        }
        return $"oklch({ToFixed((l * 100), 2)}% {ToFixed(c, 4)} {ToFixed(hNorm, 2)})";
    }
}
