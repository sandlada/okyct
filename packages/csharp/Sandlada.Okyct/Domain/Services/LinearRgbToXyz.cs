using Sandlada.Okyct.Domain.Models;

namespace Sandlada.Okyct.Domain.Services;

public static partial class ColorScience
{
    private static Xyz LinearRgbToXyz(Rgb rgb)
    {
        return new Xyz(0.4124564 * rgb.R + 0.3575761 * rgb.G + 0.1804375 * rgb.B, 0.2126729 * rgb.R + 0.7151522 * rgb.G + 0.0721750 * rgb.B, 0.0193339 * rgb.R + 0.1191920 * rgb.G + 0.9503041 * rgb.B);
    }
}
