using Sandlada.Okyct.Domain.Models;

namespace Sandlada.Okyct.Domain.Services;

public static partial class ColorScience
{
    private static OkLab OklchToOklab(OkLch lch)
    {
        var rad = (lch.H * Math.PI) / 180;
        return new OkLab(lch.L, lch.C * Math.Cos(rad), lch.C * Math.Sin(rad));
    }
}
