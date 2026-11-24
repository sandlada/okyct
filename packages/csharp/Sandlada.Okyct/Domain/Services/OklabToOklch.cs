using Sandlada.Okyct.Domain.Models;

namespace Sandlada.Okyct.Domain.Services;

public static partial class ColorScience
{
    private static OkLch OklabToOklch(OkLab lab)
    {
        var C = double.Hypot(lab.A, lab.B);
        if (C < 1e-7)
        {
            return new OkLch(lab.L, 0, 0);
        }
        var h = (Math.Atan2(lab.B, lab.A) * 180) / Math.PI;
        if (h < 0)
        {
            h += 360;
        }
        return new OkLch(lab.L, C, h);
    }
}
