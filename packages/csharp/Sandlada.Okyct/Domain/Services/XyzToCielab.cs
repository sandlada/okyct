using Sandlada.Okyct.Domain.Models;

namespace Sandlada.Okyct.Domain.Services;

public static partial class ColorScience
{
    private const double D65Xn = 0.95047;

    private const double D65Yn = 1.0;

    private const double D65Zn = 1.08883;

    private static double LabF(double t)
    {
        return t > CieEpsilon ? Math.Cbrt(t) : (CieKappa * t + 16) / 116;
    }

    private static CieLab XyzToCielab(Xyz xyz)
    {
        var fx = LabF(xyz.X / D65Xn);
        var fy = LabF(xyz.Y / D65Yn);
        var fz = LabF(xyz.Z / D65Zn);
        return new CieLab(116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz));
    }
}
