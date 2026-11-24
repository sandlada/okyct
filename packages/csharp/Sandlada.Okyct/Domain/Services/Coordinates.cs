using Sandlada.Okyct.Domain.Models;

namespace Sandlada.Okyct.Domain.Services;

public static partial class ColorScience
{
    private readonly record struct Xyz(double X, double Y, double Z);
    private readonly record struct OkLab(double L, double A, double B);
    private readonly record struct OkLch(double L, double C, double H);
    private readonly record struct CieLab(double L, double A, double B);
    private readonly record struct VertexCusp(double Hue, double Chroma, double Tone);
    private readonly record struct LinearGamutEvaluation(double Margin, double L, Rgb Linear);
}
