using Sandlada.Okyct.Domain.Models;

namespace Sandlada.Okyct.Domain.Services;

public static partial class ColorScience
{
    private const double HueSnapMinChromaForDrift = 0.01;

    private const double HueSnapMinChromaSq = HueSnapMinChromaForDrift * HueSnapMinChromaForDrift;

    private const double ToneBudgetStandard = 0.25;

    private const double ToneBudgetDark = 0.35;

    private const double HueBudgetDeg = 0.48;

    private const double WeightTone = 1.0 / (0.25 * 0.25);

    private const double WeightHueArc = 1.0 / (0.0018 * 0.0018);

    private const double WeightChroma = 1.0 / (0.012 * 0.012);

    private static readonly double TanHueBudgetSafe = Math.Tan((HueBudgetDeg + 1e-6) * DegToRad);

    private static double ByteLuminance(int r8, int g8, int b8)
    {
        return (0.2126729 * SrgbByteToLinearLut[r8] + 0.7151522 * SrgbByteToLinearLut[g8] + 0.0721750 * SrgbByteToLinearLut[b8]);
    }

    private static (double A, double B, double CSq) ByteOklabChromaSq(int r8, int g8, int b8, double y)
    {
        var lr = SrgbByteToLinearLut[r8];
        var lg = SrgbByteToLinearLut[g8];
        var lb = SrgbByteToLinearLut[b8];
        var x = 0.4124564 * lr + 0.3575761 * lg + 0.1804375 * lb;
        var z = 0.0193339 * lr + 0.1191920 * lg + 0.9503041 * lb;
        var l_ = Math.Cbrt(0.8189330101 * x + 0.3618667424 * y - 0.1288597137 * z);
        var m_ = Math.Cbrt(0.0329845436 * x + 0.9293118715 * y + 0.0361456387 * z);
        var s_ = Math.Cbrt(0.0482003018 * x + 0.2643662691 * y + 0.6338517070 * z);
        var a = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_;
        var b = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_;
        return (a, b, a * a + b * b);
    }

    private static (int Tier, double Cost) ScoreFromLab(double a, double b, double candC, double refCos, double refSin, double refChroma, double toneErr, bool withinTone, bool withinFallbackTone)
    {
        double hueRad = 0;
        double hueDeg = 0;
        if (candC > HueSnapMinChromaForDrift)
        {
            var dParallel = a * refCos + b * refSin;
            var dPerpAbs = Math.Abs(b * refCos - a * refSin);
            hueRad = Math.Atan2(dPerpAbs, dParallel);
            hueDeg = hueRad * RadToDeg;
        }
        var withinHue = hueDeg <= HueBudgetDeg;
        var tier = withinTone && withinHue ? 3 : withinFallbackTone && withinHue ? 2 : withinFallbackTone ? 1 : 0;
        var hueArc = candC * hueRad;
        var chromaErr = candC - refChroma;
        var cost = WeightTone * toneErr * toneErr + WeightHueArc * hueArc * hueArc + WeightChroma * chromaErr * chromaErr;
        return (tier, cost);
    }

    private static string HexFromBytes(int r, int g, int b)
    {
        var rc = r <= 0 ? 0 : r >= 255 ? 255 : r;
        var gc = g <= 0 ? 0 : g >= 255 ? 255 : g;
        var bc = b <= 0 ? 0 : b >= 255 ? 255 : b;
        return PackHex(rc, gc, bc);
    }

    private static string SnapRgbToHexForHuePreserve(Rgb rgb, double referenceHueDeg, double nominalTone, double? nominalChroma = null)
    {
        if (nominalTone <= 0.001)
        {
            return "#000000";
        }
        if (nominalTone >= 99.999)
        {
            return "#ffffff";
        }
        var rf = Math.Max(0, Math.Min(255, rgb.R * 255));
        var gf = Math.Max(0, Math.Min(255, rgb.G * 255));
        var bf = Math.Max(0, Math.Min(255, rgb.B * 255));
        var rRound = (int)RoundToInteger(rf);
        var gRound = (int)RoundToInteger(gf);
        var bRound = (int)RoundToInteger(bf);
        if (nominalChroma is double chroma && chroma < HueSnapMinChromaForDrift)
        {
            return HexFromBytes(rRound, gRound, bRound);
        }
        var baseY = ByteLuminance(rRound, gRound, bRound);
        var baseLab = ByteOklabChromaSq(rRound, gRound, bRound, baseY);
        var baseC = Math.Sqrt(baseLab.CSq);
        var refChroma = nominalChroma ?? baseC;
        if (refChroma < HueSnapMinChromaForDrift && baseC < HueSnapMinChromaForDrift)
        {
            return HexFromBytes(rRound, gRound, bRound);
        }
        var r0 = (int)Math.Min(254, Math.Floor(rf));
        var g0 = (int)Math.Min(254, Math.Floor(gf));
        var b0 = (int)Math.Min(254, Math.Floor(bf));
        var refRad = referenceHueDeg * DegToRad;
        var refCos = Math.Cos(refRad);
        var refSin = Math.Sin(refRad);
        var toneBudget = nominalTone < 10 ? ToneBudgetDark : ToneBudgetStandard;
        var yMinTone = ToneToY(Math.Max(0, nominalTone - toneBudget - 1e-6));
        var yMaxTone = ToneToY(Math.Min(100, nominalTone + toneBudget + 1e-6));
        var yMinFallback = ToneToY(Math.Max(0, nominalTone - ToneBudgetDark - 1e-6));
        var yMaxFallback = ToneToY(Math.Min(100, nominalTone + ToneBudgetDark + 1e-6));
        var baseT = YToTone(baseY);
        var baseToneErr = Math.Abs(baseT - nominalTone);
        var baseScore = ScoreFromLab(baseLab.A, baseLab.B, baseC, refCos, refSin, refChroma, baseToneErr, baseToneErr <= toneBudget, baseToneErr <= ToneBudgetDark);
        var bestTier = baseScore.Tier;
        var bestCost = baseScore.Cost;
        var bestR = rRound;
        var bestG = gRound;
        var bestB = bRound;
        var roundMask = ((rRound - r0) << 2) | ((gRound - g0) << 1) | (bRound - b0);
        for (var mask = 0; mask < 8; mask++)
        {
            if (mask == roundMask)
            {
                continue;
            }
            var cr = r0 + ((mask >> 2) & 1);
            var cg = g0 + ((mask >> 1) & 1);
            var cb = b0 + (mask & 1);
            var y = ByteLuminance(cr, cg, cb);
            if (bestTier == 3 && (y < yMinTone || y > yMaxTone))
            {
                continue;
            }
            if (bestTier >= 1 && (y < yMinFallback || y > yMaxFallback))
            {
                continue;
            }
            var candT = YToTone(y);
            var toneErr = Math.Abs(candT - nominalTone);
            var withinTone = toneErr <= toneBudget;
            var withinFallbackTone = toneErr <= ToneBudgetDark;
            var maxPossibleTier = withinTone ? 3 : withinFallbackTone ? 2 : 0;
            if (maxPossibleTier < bestTier)
            {
                continue;
            }
            var lab = ByteOklabChromaSq(cr, cg, cb, y);
            if (bestTier >= 2 && lab.CSq > HueSnapMinChromaSq)
            {
                var dParallel = lab.A * refCos + lab.B * refSin;
                var dPerpAbs = Math.Abs(lab.B * refCos - lab.A * refSin);
                if (dParallel <= 0 || dPerpAbs > dParallel * TanHueBudgetSafe)
                {
                    continue;
                }
            }
            var candC = Math.Sqrt(lab.CSq);
            var candScore = ScoreFromLab(lab.A, lab.B, candC, refCos, refSin, refChroma, toneErr, withinTone, withinFallbackTone);
            if (candScore.Tier < bestTier)
            {
                continue;
            }
            if (candScore.Tier > bestTier || candScore.Cost < bestCost)
            {
                bestTier = candScore.Tier;
                bestCost = candScore.Cost;
                bestR = cr;
                bestG = cg;
                bestB = cb;
            }
        }
        return HexFromBytes(bestR, bestG, bestB);
    }
}
