namespace Sandlada.Okyct.Domain.Services;

public static partial class ColorScience
{
    private const double HalleyDlA = 0.3963377774;
    private const double HalleyDlB = 0.2158037573;
    private const double HalleyDmA = -0.1055613458;
    private const double HalleyDmB = -0.0638541728;
    private const double HalleyDsA = -0.0894841775;
    private const double HalleyDsB = -1.2914855480;
    private const double HalleyYL3 = -0.0405801784;
    private const double HalleyYM3 = 1.1122568696;
    private const double HalleyYS3 = -0.0716766787;
    private const double HalleyD1L2 = -0.1217405352;
    private const double HalleyD1M2 = 3.3367706088;
    private const double HalleyD1S2 = -0.2150300361;
    private const double HalleyD2L1 = -0.2434810704;
    private const double HalleyD2M1 = 6.6735412176;
    private const double HalleyD2S1 = -0.4300600722;

    private static double SolveOklabLForTargetY(double targetY, double a, double b, double? initialL = null)
    {
        if (targetY <= 0) return 0;
        if (targetY >= 1.0) return 1.0;
        if (a == 0 && b == 0) return Math.Cbrt(targetY);

        var dl = HalleyDlA * a + HalleyDlB * b;
        var dm = HalleyDmA * a + HalleyDmB * b;
        var ds = HalleyDsA * a + HalleyDsB * b;
        var L = initialL is double guess && double.IsFinite(guess) ? guess : Math.Cbrt(targetY);

        for (var i = 0; i < 10; i++)
        {
            var l_ = L + dl;
            var m_ = L + dm;
            var s_ = L + ds;
            var l2 = l_ * l_;
            var m2 = m_ * m_;
            var s2 = s_ * s_;
            var currentY = HalleyYL3 * l2 * l_ + HalleyYM3 * m2 * m_ + HalleyYS3 * s2 * s_;
            var f = currentY - targetY;
            if (Math.Abs(f) < 1e-12) break;

            var d1 = HalleyD1L2 * l2 + HalleyD1M2 * m2 + HalleyD1S2 * s2;
            if (Math.Abs(d1) < 1e-12) break;

            var d2 = HalleyD2L1 * l_ + HalleyD2M1 * m_ + HalleyD2S1 * s_;
            var denom = 2 * d1 * d1 - f * d2;
            L = Math.Abs(denom) < 1e-15 ? L - f / d1 : L - (2 * f * d1) / denom;
            L = Math.Max(0, Math.Min(1.0, L));
        }

        return L;
    }
}
