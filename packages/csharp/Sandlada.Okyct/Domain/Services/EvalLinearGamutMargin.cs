using Sandlada.Okyct.Domain.Models;

namespace Sandlada.Okyct.Domain.Services;

public static partial class ColorScience
{
    private static LinearGamutEvaluation EvalLinearGamutMargin(double targetY, double a, double b, GamutTarget gamut, double? initialL = null)
    {
        if (a == 0 && b == 0)
        {
            var yClamped = Math.Max(0, Math.Min(1, targetY));
            return new LinearGamutEvaluation(Math.Min(yClamped, 1 - yClamped), Math.Cbrt(yClamped), new Rgb(yClamped, yClamped, yClamped));
        }

        var L = SolveOklabLForTargetY(targetY, a, b, initialL);
        var l_ = L + HalleyDlA * a + HalleyDlB * b;
        var m_ = L + HalleyDmA * a + HalleyDmB * b;
        var s_ = L + HalleyDsA * a + HalleyDsB * b;
        var l3 = l_ * l_ * l_;
        var m3 = m_ * m_ * m_;
        var s3 = s_ * s_ * s_;

        var x = 1.2270138511 * l3 - 0.5577999807 * m3 + 0.2812561490 * s3;
        var y = HalleyYL3 * l3 + HalleyYM3 * m3 + HalleyYS3 * s3;
        var z = -0.0763812845 * l3 - 0.4214819784 * m3 + 1.5861632204 * s3;

        double r;
        double g;
        double bLin;
        if (gamut == GamutTarget.DisplayP3)
        {
            r = 2.4934969 * x - 0.9313836 * y - 0.4027108 * z;
            g = -0.8294890 * x + 1.7626641 * y + 0.0236247 * z;
            bLin = 0.0358458 * x - 0.0761724 * y + 0.9568845 * z;
        }
        else
        {
            r = 3.2404542 * x - 1.5371385 * y - 0.4985314 * z;
            g = -0.9692660 * x + 1.8760108 * y + 0.0415560 * z;
            bLin = 0.0556434 * x - 0.2040259 * y + 1.0572252 * z;
        }

        var margin = Math.Min(Math.Min(Math.Min(r, g), bLin), Math.Min(Math.Min(1 - r, 1 - g), 1 - bLin));
        return new LinearGamutEvaluation(margin, L, new Rgb(r, g, bLin));
    }
}
