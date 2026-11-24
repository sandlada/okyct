using Sandlada.Okyct.Domain.Models;

namespace Sandlada.Okyct.Domain.Services;

public static partial class ColorScience
{
    private static readonly Rgb[] ChromaticVertices = [new Rgb(1, 0, 0), new Rgb(1, 1, 0), new Rgb(0, 1, 0), new Rgb(0, 1, 1), new Rgb(0, 0, 1), new Rgb(1, 0, 1)];

    private static VertexCusp EvalVertex(Rgb rgb, GamutTarget gamut)
    {
        var xyz = gamut == GamutTarget.DisplayP3 ? LinearP3ToXyz(rgb) : LinearRgbToXyz(rgb);
        var lab = XyzToOklab(xyz);
        var h = Math.Atan2(lab.B, lab.A) * RadToDeg;
        if (h < 0)
        {
            h += 360;
        }
        return new VertexCusp(h, double.Hypot(lab.A, lab.B), YToTone(xyz.Y));
    }

    private static VertexCusp[] BuildVertexTable(GamutTarget gamut)
    {
        return Array.ConvertAll(ChromaticVertices, v => EvalVertex(v, gamut));
    }

    private static readonly VertexCusp[] SrgbVertices = BuildVertexTable(GamutTarget.Srgb);

    private static readonly VertexCusp[] P3Vertices = BuildVertexTable(GamutTarget.DisplayP3);

    private static double SignedHueDiff(double actualHue, double targetHue)
    {
        return ((actualHue - targetHue + 540) % 360) - 180;
    }

    private static int FindContainingEdgeIndex(double h, VertexCusp[] vertices)
    {
        var n = vertices.Length;
        for (var i = 0; i < n; i++)
        {
            var h0 = vertices[i].Hue;
            var h1 = vertices[(i + 1) % n].Hue;
            var span = (h1 - h0 + 360) % 360;
            var offset = (h - h0 + 360) % 360;
            if (offset < span)
            {
                return i;
            }
        }
        return n - 1;
    }

    private static GamutCusp FindCuspForMaxChroma(double hue, GamutTarget gamut = GamutTarget.Srgb)
    {
        var h = hue % 360;
        if (h < 0)
        {
            h += 360;
        }
        var isP3 = gamut == GamutTarget.DisplayP3;
        var vertices = isP3 ? P3Vertices : SrgbVertices;
        var edgeIdx = FindContainingEdgeIndex(h, vertices);
        var v0Vert = vertices[edgeIdx];
        var fLo = SignedHueDiff(v0Vert.Hue, h);
        if (Math.Abs(fLo) < 1e-7)
        {
            return new GamutCusp(v0Vert.Tone, v0Vert.Chroma);
        }
        var v1Vert = vertices[(edgeIdx + 1) % 6];
        var fHi = SignedHueDiff(v1Vert.Hue, h);
        if (Math.Abs(fHi) < 1e-7)
        {
            return new GamutCusp(v1Vert.Tone, v1Vert.Chroma);
        }
        var v0 = ChromaticVertices[edgeIdx];
        var v1 = ChromaticVertices[(edgeIdx + 1) % 6];
        var dr = v1.R - v0.R;
        var dg = v1.G - v0.G;
        var db = v1.B - v0.B;
        var targetRad = h * DegToRad;
        var refCos = Math.Cos(targetRad);
        var refSin = Math.Sin(targetRad);
        double lo = 0;
        double hi = 1;
        var side = 0;
        double bestY = 0;
        double bestA = 0;
        double bestB = 0;
        for (var i = 0; i < 16; i++)
        {
            var denom = fHi - fLo;
            var u = Math.Abs(denom) > 1e-12 ? (lo * fHi - hi * fLo) / denom : (lo + hi) * 0.5;
            if (!(u > lo && u < hi))
            {
                u = (lo + hi) * 0.5;
            }
            var r = v0.R + dr * u;
            var g = v0.G + dg * u;
            var b = v0.B + db * u;
            double x;
            double y;
            double z;
            if (isP3)
            {
                x = 0.4865710 * r + 0.2656677 * g + 0.1982173 * b;
                y = 0.2289746 * r + 0.6917385 * g + 0.0792869 * b;
                z = 0.0451134 * g + 1.0439444 * b;
            }
            else
            {
                x = 0.4124564 * r + 0.3575761 * g + 0.1804375 * b;
                y = 0.2126729 * r + 0.7151522 * g + 0.0721750 * b;
                z = 0.0193339 * r + 0.1191920 * g + 0.9503041 * b;
            }
            var l_ = Math.Cbrt(0.8189330101 * x + 0.3618667424 * y - 0.1288597137 * z);
            var m_ = Math.Cbrt(0.0329845436 * x + 0.9293118715 * y + 0.0361456387 * z);
            var s_ = Math.Cbrt(0.0482003018 * x + 0.2643662691 * y + 0.6338517070 * z);
            bestA = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_;
            bestB = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_;
            bestY = y;
            var dParallel = bestA * refCos + bestB * refSin;
            var dPerp = bestB * refCos - bestA * refSin;
            var err = Math.Atan2(dPerp, dParallel) * RadToDeg;
            if (Math.Abs(err) < 1e-4 || hi - lo < 1e-6)
            {
                break;
            }
            if (err <= 0)
            {
                lo = u;
                fLo = err;
                if (side == -1)
                {
                    fHi *= 0.5;
                }
                side = -1;
            }
            else
            {
                hi = u;
                fHi = err;
                if (side == 1)
                {
                    fLo *= 0.5;
                }
                side = 1;
            }
        }
        return new GamutCusp(YToTone(bestY), double.Hypot(bestA, bestB));
    }
}
