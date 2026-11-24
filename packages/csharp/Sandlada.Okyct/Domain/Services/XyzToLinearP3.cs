using Sandlada.Okyct.Domain.Models;

namespace Sandlada.Okyct.Domain.Services;

public static partial class ColorScience
{
    private static Rgb XyzToLinearP3(Xyz xyz)
    {
        return new Rgb(2.4934969 * xyz.X - 0.9313836 * xyz.Y - 0.4027108 * xyz.Z, -0.8294890 * xyz.X + 1.7626641 * xyz.Y + 0.0236247 * xyz.Z, 0.0358458 * xyz.X - 0.0761724 * xyz.Y + 0.9568845 * xyz.Z);
    }
}
