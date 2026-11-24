using Sandlada.Okyct.Domain.Models;

namespace Sandlada.Okyct.Domain.Services;

public static partial class ColorScience
{
    public static string OkyctToDisplayP3Css(OkyctColor okyct, ColorConversionOptions? options = null)
    {
        options ??= new();
        var p3 = OkyctToRgb(okyct, new ColorConversionOptions(GamutTarget.DisplayP3, options.GamutMapping));
        return $"color(display-p3 {ToFixed(p3.R, 4)} {ToFixed(p3.G, 4)} {ToFixed(p3.B, 4)})";
    }
}

