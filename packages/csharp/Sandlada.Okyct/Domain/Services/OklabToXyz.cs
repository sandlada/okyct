using Sandlada.Okyct.Domain.Models;

namespace Sandlada.Okyct.Domain.Services;

public static partial class ColorScience
{
    private static Xyz OklabToXyz(OkLab lab)
    {
        var l_ = lab.L + 0.3963377774 * lab.A + 0.2158037573 * lab.B;
        var m_ = lab.L - 0.1055613458 * lab.A - 0.0638541728 * lab.B;
        var s_ = lab.L - 0.0894841775 * lab.A - 1.2914855480 * lab.B;
        var l = l_ * l_ * l_;
        var m = m_ * m_ * m_;
        var s = s_ * s_ * s_;
        return new Xyz(1.2270138511 * l - 0.5577999807 * m + 0.2812561490 * s, -0.0405801784 * l + 1.1122568696 * m - 0.0716766787 * s, -0.0763812845 * l - 0.4214819784 * m + 1.5861632204 * s);
    }
}
