using Sandlada.Okyct.Domain.Models;

namespace Sandlada.Okyct.Domain.Services;

public static partial class ColorScience
{
    private const double CuspAnchorPull = 0.65;

    private static Rgb CompressToGamutCusp(double h, double c, double t, GamutTarget gamut)
    {
        var cusp = FindCuspForMaxChroma(h, gamut);
        var tAnchor = Math.Max(0.5, Math.Min(99.5, t + (cusp.Tone - t) * CuspAnchorPull));
        var rad = (h * Math.PI) / 180;
        var cosH = Math.Cos(rad);
        var sinH = Math.Sin(rad);
        double lo = 0;
        double hi = 1;
        double? lastL = null;
        var yAnchor = ToneToY(tAnchor);
        Rgb bestLinear = new Rgb(yAnchor, yAnchor, yAnchor);
        for (var i = 0; i < 16; i++)
        {
            if (hi - lo < 1e-5)
            {
                break;
            }
            var mid = (lo + hi) * 0.5;
            var tMid = tAnchor + mid * (t - tAnchor);
            var cMid = mid * c;
            var targetY = ToneToY(tMid);
            var ev = EvalLinearGamutMargin(targetY, cMid * cosH, cMid * sinH, gamut, lastL);
            if (ev.Margin >= -1e-6)
            {
                lo = mid;
                lastL = ev.L;
                bestLinear = ev.Linear;
            }
            else
            {
                hi = mid;
            }
        }
        return bestLinear;
    }
}
