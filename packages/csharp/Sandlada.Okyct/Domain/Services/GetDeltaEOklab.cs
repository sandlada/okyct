using Sandlada.Okyct.Domain.Models;

namespace Sandlada.Okyct.Domain.Services;

public static partial class ColorScience
{
    private static OkLab Rgb24ToOklab(int rgb24)
    {
        var rl = SrgbByteToLinearLut[(rgb24 >> 16) & 255];
        var gl = SrgbByteToLinearLut[(rgb24 >> 8) & 255];
        var bl = SrgbByteToLinearLut[rgb24 & 255];
        return XyzToOklab(new Xyz(0.4124564 * rl + 0.3575761 * gl + 0.1804375 * bl, 0.2126729 * rl + 0.7151522 * gl + 0.0721750 * bl, 0.0193339 * rl + 0.1191920 * gl + 0.9503041 * bl));
    }

    public static double GetDeltaEOklab(string hexA, string hexB)
    {
        var rgb24A = ParseHexToRgb24(hexA);
        var rgb24B = ParseHexToRgb24(hexB);
        if (rgb24A == rgb24B)
        {
            return 0;
        }
        var labA = Rgb24ToOklab(rgb24A);
        var labB = Rgb24ToOklab(rgb24B);
        return double.Hypot(double.Hypot(labB.L - labA.L, labB.A - labA.A), labB.B - labA.B);
    }
}
