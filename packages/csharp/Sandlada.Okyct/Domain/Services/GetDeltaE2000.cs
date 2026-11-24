using Sandlada.Okyct.Domain.Models;

namespace Sandlada.Okyct.Domain.Services;

public static partial class ColorScience
{
    private const double TwentyFivePow7 = 6103515625;

    private static double Pow7(double x)
    {
        var x2 = x * x;
        var x4 = x2 * x2;
        return x4 * x2 * x;
    }

    private static CieLab Rgb24ToCielab(int rgb24)
    {
        var rl = SrgbByteToLinearLut[(rgb24 >> 16) & 255];
        var gl = SrgbByteToLinearLut[(rgb24 >> 8) & 255];
        var bl = SrgbByteToLinearLut[rgb24 & 255];
        return XyzToCielab(new Xyz(0.4124564 * rl + 0.3575761 * gl + 0.1804375 * bl, 0.2126729 * rl + 0.7151522 * gl + 0.0721750 * bl, 0.0193339 * rl + 0.1191920 * gl + 0.9503041 * bl));
    }

    private static double HueAngleDeg(double b, double aPrime)
    {
        if (aPrime == 0 && b == 0)
        {
            return 0;
        }
        var deg = Math.Atan2(b, aPrime) * RadToDeg;
        return deg >= 0 ? deg : deg + 360;
    }

    public static double GetDeltaE2000(string hexA, string hexB)
    {
        var rgb24A = ParseHexToRgb24(hexA);
        var rgb24B = ParseHexToRgb24(hexB);
        if (rgb24A == rgb24B)
        {
            return 0;
        }
        var lab1 = Rgb24ToCielab(rgb24A);
        var lab2 = Rgb24ToCielab(rgb24B);
        var c1 = double.Hypot(lab1.A, lab1.B);
        var c2 = double.Hypot(lab2.A, lab2.B);
        var cBar = (c1 + c2) * 0.5;
        var cBar7 = Pow7(cBar);
        var g = 0.5 * (1 - Math.Sqrt(cBar7 / (cBar7 + TwentyFivePow7)));
        var a1Prime = (1 + g) * lab1.A;
        var a2Prime = (1 + g) * lab2.A;
        var c1Prime = double.Hypot(a1Prime, lab1.B);
        var c2Prime = double.Hypot(a2Prime, lab2.B);
        var h1Prime = HueAngleDeg(lab1.B, a1Prime);
        var h2Prime = HueAngleDeg(lab2.B, a2Prime);
        var deltaLPrime = lab2.L - lab1.L;
        var deltaCPrime = c2Prime - c1Prime;
        double deltahPrime = 0;
        if (c1Prime * c2Prime != 0)
        {
            var diff = h2Prime - h1Prime;
            if (Math.Abs(diff) <= 180)
            {
                deltahPrime = diff;
            }
            else if (diff > 180)
            {
                deltahPrime = diff - 360;
            }
            else
            {
                deltahPrime = diff + 360;
            }
        }
        var deltaHPrime = 2 * Math.Sqrt(c1Prime * c2Prime) * Math.Sin((deltahPrime * 0.5) * DegToRad);
        var lBarPrime = (lab1.L + lab2.L) * 0.5;
        var cBarPrime = (c1Prime + c2Prime) * 0.5;
        var hBarPrime = h1Prime + h2Prime;
        if (c1Prime * c2Prime != 0)
        {
            if (Math.Abs(h1Prime - h2Prime) <= 180)
            {
                hBarPrime = (h1Prime + h2Prime) * 0.5;
            }
            else if (h1Prime + h2Prime < 360)
            {
                hBarPrime = (h1Prime + h2Prime + 360) * 0.5;
            }
            else
            {
                hBarPrime = (h1Prime + h2Prime - 360) * 0.5;
            }
        }
        var t = 1 - 0.17 * Math.Cos((hBarPrime - 30) * DegToRad) + 0.24 * Math.Cos(2 * hBarPrime * DegToRad) + 0.32 * Math.Cos((3 * hBarPrime + 6) * DegToRad) - 0.20 * Math.Cos((4 * hBarPrime - 63) * DegToRad);
        var thetaScaled = (hBarPrime - 275) / 25;
        var deltaTheta = 30 * Math.Exp(-(thetaScaled * thetaScaled));
        var cBarPrime7 = Pow7(cBarPrime);
        var rC = 2 * Math.Sqrt(cBarPrime7 / (cBarPrime7 + TwentyFivePow7));
        var lBarOffset = lBarPrime - 50;
        var lBarOffsetSq = lBarOffset * lBarOffset;
        var sL = 1 + (0.015 * lBarOffsetSq) / Math.Sqrt(20 + lBarOffsetSq);
        var sC = 1 + 0.045 * cBarPrime;
        var sH = 1 + 0.015 * cBarPrime * t;
        var rT = -Math.Sin(2 * deltaTheta * DegToRad) * rC;
        var termL = deltaLPrime / sL;
        var termC = deltaCPrime / sC;
        var termH = deltaHPrime / sH;
        return Math.Sqrt(termL * termL + termC * termC + termH * termH + rT * termC * termH);
    }
}
