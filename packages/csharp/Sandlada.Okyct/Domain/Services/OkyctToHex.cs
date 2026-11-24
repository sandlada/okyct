using Sandlada.Okyct.Domain.Models;

namespace Sandlada.Okyct.Domain.Services;

public static partial class ColorScience
{
    public static string OkyctToHex(OkyctColor okyct, ColorConversionOptions? options = null)
    {
        options ??= new();
        var rgb = OkyctToRgb(okyct, options);
        if (options.Gamut == GamutTarget.DisplayP3)
        {
            throw new ArgumentException("okyctToHex produces 8-bit sRGB hex strings; use okyctToDisplayP3Css for Display P3 output.");
        }
        if (okyct.T <= 0.001)
        {
            return "#000000";
        }
        if (okyct.T >= 99.999)
        {
            return "#ffffff";
        }
        if (options.GamutMapping == GamutMappingMode.CuspCompress)
        {
            var mapped = RgbToOkyct(rgb);
            return SnapRgbToHexForHuePreserve(rgb, okyct.H, mapped.T, mapped.C);
        }
        return SnapRgbToHexForHuePreserve(rgb, okyct.H, okyct.T, okyct.C);
    }
}
