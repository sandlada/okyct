using Sandlada.Okyct.Domain.Models;

namespace Sandlada.Okyct.Domain.Services;

public static partial class ColorScience
{
    public static double GetContrastRatio(ColorToneInput toneOrColorA, ColorToneInput toneOrColorB)
    {
        var yA = ToneToY(ResolveToneInput(toneOrColorA));
        var yB = ToneToY(ResolveToneInput(toneOrColorB));
        var lighter = Math.Max(yA, yB);
        var darker = Math.Min(yA, yB);
        return (lighter + 0.05) / (darker + 0.05);
    }
}
