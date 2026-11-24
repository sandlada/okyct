using Sandlada.Okyct.Domain.Models;

namespace Sandlada.Okyct.Domain.Services;

public static partial class ColorScience
{
    private static Rgb XyzToLinearRgb(Xyz xyz)
    {
        return new Rgb(3.2404542 * xyz.X - 1.5371385 * xyz.Y - 0.4985314 * xyz.Z, -0.9692660 * xyz.X + 1.8760108 * xyz.Y + 0.0415560 * xyz.Z, 0.0556434 * xyz.X - 0.2040259 * xyz.Y + 1.0572252 * xyz.Z);
    }
}
