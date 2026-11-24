using Sandlada.Okyct.Domain.Models;

namespace Sandlada.Okyct.Domain.Services;

public static partial class ColorScience
{
    public static GamutCusp FindGamutCusp(double hue, ColorConversionOptions? options = null)
    {
        options ??= new();
        if (!double.IsFinite(hue))
        {
            throw new ArgumentException($"Invalid hue: {hue}. Expected a finite number.");
        }
        var gamut = options.Gamut;
        if (!Enum.IsDefined(gamut))
        {
            throw new ArgumentException("Invalid gamut target");
        }
        return FindCuspForMaxChroma(hue, gamut);
    }
}
