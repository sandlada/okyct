using Sandlada.Okyct.Domain.Models;

namespace Sandlada.Okyct.Domain.Services;

public static partial class ColorScience
{
    private static Xyz LinearP3ToXyz(Rgb rgb)
    {
        return new Xyz(0.4865710 * rgb.R + 0.2656677 * rgb.G + 0.1982173 * rgb.B, 0.2289746 * rgb.R + 0.6917385 * rgb.G + 0.0792869 * rgb.B, 0.0451134 * rgb.G + 1.0439444 * rgb.B);
    }
}
