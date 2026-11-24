using Sandlada.Okyct.Domain.Models;

namespace Sandlada.Okyct.Domain.Services;

public static partial class ColorScience
{
    private static OkLab XyzToOklab(Xyz xyz)
    {
        var l = 0.8189330101 * xyz.X + 0.3618667424 * xyz.Y - 0.1288597137 * xyz.Z;
        var m = 0.0329845436 * xyz.X + 0.9293118715 * xyz.Y + 0.0361456387 * xyz.Z;
        var s = 0.0482003018 * xyz.X + 0.2643662691 * xyz.Y + 0.6338517070 * xyz.Z;
        var l_ = Math.Cbrt(l);
        var m_ = Math.Cbrt(m);
        var s_ = Math.Cbrt(s);
        return new OkLab(0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_, 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_, 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_);
    }
}
