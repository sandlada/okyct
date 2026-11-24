using Sandlada.Okyct.Domain.Models;

namespace Sandlada.Okyct.Domain.Services;

public static partial class ColorScience
{
    private static readonly double ApcaMinFloorY = Math.Pow(ApcaBlkThrs, ApcaBlkClmp);

    private const double ApcaToneMargin = 0.35;

    private static double SoftClampY(double y)
    {
        return y < ApcaBlkThrs ? y + Math.Pow(ApcaBlkThrs - y, ApcaBlkClmp) : y;
    }

    private static double InvertSoftClampY(double ySoft)
    {
        if (ySoft >= ApcaBlkThrs)
        {
            return ySoft;
        }
        if (ySoft <= ApcaMinFloorY)
        {
            return 0;
        }
        var y = Math.Max(0, Math.Min(ApcaBlkThrs, ySoft * 0.7));
        for (var i = 0; i < 6; i++)
        {
            var f = y + Math.Pow(ApcaBlkThrs - y, ApcaBlkClmp) - ySoft;
            if (Math.Abs(f) < 1e-12)
            {
                break;
            }
            var df = 1 - ApcaBlkClmp * Math.Pow(ApcaBlkThrs - y, ApcaBlkClmp - 1);
            y = Math.Max(0, Math.Min(ApcaBlkThrs, y - f / df));
        }
        return y;
    }

    public static ContrastSolution SolveTonesForApca(ColorToneInput bgToneOrColor, double targetLc = 60)
    {
        var bgTone = ResolveToneInput(bgToneOrColor);
        if (!double.IsFinite(targetLc) || targetLc < 0 || targetLc > 108)
        {
            throw new ArgumentException($"Invalid targetLc: {targetLc}. Expected a finite number in [0, 108].");
        }
        if (targetLc == 0)
        {
            return new ContrastSolution(Math.Floor(bgTone), Math.Ceiling(bgTone));
        }
        var bgYSoft = SoftClampY(ToneToY(bgTone));
        var sapcRequired = Math.Max(ApcaLoClip, targetLc / 100 + ApcaLoConOffset);
        double? darkTone = null;
        var darkTerm = Math.Pow(bgYSoft, 0.56) - sapcRequired / ApcaScale;
        double darkCandidate = 0;
        double darkLc;
        if (darkTerm >= 0)
        {
            var txtYSoft = Math.Pow(darkTerm, 1 / 0.57);
            var rawY = InvertSoftClampY(txtYSoft);
            darkCandidate = Math.Max(0, Math.Floor(YToTone(rawY) - ApcaToneMargin));
            darkLc = Math.Abs(GetApcaContrast(darkCandidate, bgTone));
            while (darkCandidate > 0 && darkLc < targetLc)
            {
                darkCandidate--;
                darkLc = Math.Abs(GetApcaContrast(darkCandidate, bgTone));
            }
        }
        else
        {
            darkLc = Math.Abs(GetApcaContrast(0, bgTone));
        }
        if (darkLc >= targetLc)
        {
            darkTone = darkCandidate;
        }
        double? lightTone = null;
        var lightTerm = Math.Pow(bgYSoft, 0.65) + sapcRequired / ApcaScale;
        double lightCandidate = 100;
        double lightLc;
        if (lightTerm <= 1.0)
        {
            var txtYSoft = Math.Min(1.0, Math.Pow(Math.Max(0, lightTerm), 1 / 0.62));
            var rawY = InvertSoftClampY(txtYSoft);
            lightCandidate = Math.Min(100, Math.Ceiling(YToTone(rawY) + ApcaToneMargin));
            lightLc = Math.Abs(GetApcaContrast(lightCandidate, bgTone));
            while (lightCandidate < 100 && lightLc < targetLc)
            {
                lightCandidate++;
                lightLc = Math.Abs(GetApcaContrast(lightCandidate, bgTone));
            }
        }
        else
        {
            lightLc = Math.Abs(GetApcaContrast(100, bgTone));
        }
        if (lightLc >= targetLc)
        {
            lightTone = lightCandidate;
        }
        return new ContrastSolution(darkTone, lightTone);
    }
}
