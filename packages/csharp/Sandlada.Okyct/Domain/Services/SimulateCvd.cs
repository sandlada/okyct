using Sandlada.Okyct.Domain.Models;

namespace Sandlada.Okyct.Domain.Services;

public static partial class ColorScience
{
    private static readonly Rgb[] ProtanopiaMatrix = [
        new(0.152286, 1.052583, -0.204868),
        new(0.114503, 0.786281, 0.099216),
        new(-0.003882, -0.048116, 1.051998)
    ];

    private static readonly Rgb[] DeuteranopiaMatrix = [
        new(0.367322, 0.860646, -0.227968),
        new(0.280085, 0.672501, 0.047413),
        new(-0.01182, 0.04294, 0.968881)
    ];

    private static readonly Rgb[] TritanopiaMatrix = [
        new(1.255528, -0.076749, -0.178779),
        new(-0.078411, 0.930809, 0.147602),
        new(0.004733, 0.691367, 0.3039)
    ];

    private static readonly Rgb LuminanceWeights = new(0.2126729, 0.7151522, 0.072175);
    private static readonly Rgb[] AchromatopsiaMatrix = [LuminanceWeights, LuminanceWeights, LuminanceWeights];

    public static string SimulateCvd(string hex, CvdType type, double severity = 1.0)
    {
        if (!Enum.IsDefined(type)) throw new ArgumentOutOfRangeException(nameof(type));
        RequireFinite(severity, nameof(severity));
        var packed = ParseHexToRgb24(hex);
        var strength = Math.Clamp(severity, 0, 1);
        if (type == CvdType.None || strength == 0) return hex;

        var matrix = type switch
        {
            CvdType.Protanopia => ProtanopiaMatrix,
            CvdType.Deuteranopia => DeuteranopiaMatrix,
            CvdType.Tritanopia => TritanopiaMatrix,
            CvdType.Achromatopsia => AchromatopsiaMatrix,
            _ => throw new ArgumentOutOfRangeException(nameof(type))
        };

        var input = new Rgb(
            SrgbByteToLinearLut[(packed >> 16) & 255],
            SrgbByteToLinearLut[(packed >> 8) & 255],
            SrgbByteToLinearLut[packed & 255]);
        return RgbToHex(new Rgb(
            Project(input, matrix[0], input.R, strength),
            Project(input, matrix[1], input.G, strength),
            Project(input, matrix[2], input.B, strength)));
    }

    private static double Project(Rgb input, Rgb weights, double original, double strength)
    {
        var projected = weights.R * input.R + weights.G * input.G + weights.B * input.B;
        return LinearToSrgb(Math.Clamp((1 - strength) * original + strength * projected, 0, 1));
    }
}
