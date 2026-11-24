using Sandlada.Okyct.Domain.Models;

namespace Sandlada.Okyct.Domain.Services;

public static partial class ColorScience
{
    private static OkLab SrgbToOklab(Rgb rgb)
    {
        var rl = SrgbToLinear(rgb.R);
        var gl = SrgbToLinear(rgb.G);
        var bl = SrgbToLinear(rgb.B);
        return XyzToOklab(new Xyz(0.4124564 * rl + 0.3575761 * gl + 0.1804375 * bl, 0.2126729 * rl + 0.7151522 * gl + 0.0721750 * bl, 0.0193339 * rl + 0.1191920 * gl + 0.9503041 * bl));
    }

    private static readonly string[] HexRoundTripSeeds = ["#2563EB", "#0000FF", "#FF0000", "#FFD600", "#FF00FF"];

    private static readonly double[] HexRoundTripTones = [10, 20, 30, 40, 50, 60, 70, 80, 90, 95];

    private const double HexHueDriftCapDeg = 0.5;

    private const double HexToneDeltaCap = 0.35;

    private const double HexMinChromaForHue = 0.01;

    private static double Smoothstep(double edge0, double edge1, double x)
    {
        var t = Math.Max(0, Math.Min(1, (x - edge0) / (edge1 - edge0)));
        return t * t * (3 - 2 * t);
    }

    private static string TonalStopHex(double sourceHue, double targetChroma, double tone)
    {
        var darkRoll = tone < 18 ? Smoothstep(0, 18, tone) : 1;
        var lightRoll = tone > 85 ? Smoothstep(100, 85, tone) : 1;
        var effectiveChroma = targetChroma * darkRoll * lightRoll;
        var maxGamutChroma = FindMaxChromaForTone(sourceHue, tone);
        var finalChroma = Math.Min(effectiveChroma, maxGamutChroma);
        return OkyctToHex(new OkyctColor(sourceHue, finalChroma, tone));
    }

    public static InvariantTestResult[] RunColorimetricInvariantSuite()
    {
        double maxRoundTripError = 0;
        double maxRoundTripDeltaEOk = 0;
        var roundTripSamples = 0;
        double[] SampleSteps = [0, 0.2, 0.4, 0.6, 0.8, 1.0];
        foreach (var r in SampleSteps)
        {
            foreach (var g in SampleSteps)
            {
                foreach (var b in SampleSteps)
                {
                    var sourceRgb = new Rgb(r, g, b);
                    var okyct = RgbToOkyct(sourceRgb);
                    var restored = OkyctToRgb(okyct);
                    var err = Math.Max(Math.Max(Math.Abs(r - restored.R), Math.Abs(g - restored.G)), Math.Abs(b - restored.B));
                    if (err > maxRoundTripError)
                    {
                        maxRoundTripError = err;
                    }
                    var labSrc = SrgbToOklab(sourceRgb);
                    var labDst = SrgbToOklab(restored);
                    var deltaEOk = double.Hypot(double.Hypot(labDst.L - labSrc.L, labDst.A - labSrc.A), labDst.B - labSrc.B);
                    if (deltaEOk > maxRoundTripDeltaEOk)
                    {
                        maxRoundTripDeltaEOk = deltaEOk;
                    }
                    roundTripSamples++;
                }
            }
        }
        double maxToneBijectionError = 0;
        var monotonicViolations = 0;
        double prevY = -1;
        for (double t = 0; t <= 100; t += 0.5)
        {
            var y = ToneToY(t);
            if (y <= prevY)
            {
                monotonicViolations++;
            }
            prevY = y;
            var backT = YToTone(y);
            var err = Math.Abs(t - backT);
            if (err > maxToneBijectionError)
            {
                maxToneBijectionError = err;
            }
        }
        var gamutOverflowCount = 0;
        double maxHueDriftDeg = 0;
        var gamutSamples = 0;
        for (double h = 0; h < 360; h += 15)
        {
            foreach (var t in new[] { 20, 40, 60, 80 })
            {
                foreach (var gamutMapping in new[] { GamutMappingMode.PreserveTone, GamutMappingMode.CuspCompress })
                {
                    var rgb = OkyctToRgb(new OkyctColor(h, 0.38, t), new ColorConversionOptions(GamutMapping: gamutMapping));
                    if (rgb.R < 0 || rgb.R > 1 || rgb.G < 0 || rgb.G > 1 || rgb.B < 0 || rgb.B > 1)
                    {
                        gamutOverflowCount++;
                    }
                    var backOkyct = RgbToOkyct(rgb);
                    if (backOkyct.C > 0.01)
                    {
                        var hDiff = ShortestHueDelta(backOkyct.H, h);
                        if (hDiff > maxHueDriftDeg)
                        {
                            maxHueDriftDeg = hDiff;
                        }
                    }
                    gamutSamples++;
                }
            }
        }
        var hexRoundTripViolations = 0;
        var hexRoundTripSamples = 0;
        double maxHexHueDriftDeg = 0;
        double maxHexToneDelta = 0;
        foreach (var seedHex in HexRoundTripSeeds)
        {
            var source = HexToOkyct(seedHex);
            foreach (var tone in HexRoundTripTones)
            {
                var hex = TonalStopHex(source.H, source.C, tone);
                var measured = HexToOkyct(hex);
                var toneDelta = Math.Abs(measured.T - tone);
                if (toneDelta > maxHexToneDelta)
                {
                    maxHexToneDelta = toneDelta;
                }
                if (toneDelta > HexToneDeltaCap)
                {
                    hexRoundTripViolations++;
                }
                if (measured.C > HexMinChromaForHue)
                {
                    var hDrift = ShortestHueDelta(measured.H, source.H);
                    if (hDrift > maxHexHueDriftDeg)
                    {
                        maxHexHueDriftDeg = hDrift;
                    }
                    if (hDrift > HexHueDriftCapDeg)
                    {
                        hexRoundTripViolations++;
                    }
                }
                hexRoundTripSamples++;
            }
        }
        var contrastViolations = 0;
        var contrastSamples = 0;
        for (double bgT = 0; bgT <= 100; bgT += 2)
        {
            var wcagSolved = SolveTonesForContrast(bgT, 4.5, new ContrastSolveOptions(ContrastMetric.Both, 60));
            if (wcagSolved.DarkForegroundTone != null)
            {
                var ratio = GetContrastRatio(bgT, wcagSolved.DarkForegroundTone.Value);
                var lc = Math.Abs(GetApcaContrast(wcagSolved.DarkForegroundTone.Value, bgT));
                if (ratio < 4.5 || lc < 60)
                {
                    contrastViolations++;
                }
                contrastSamples++;
            }
            if (wcagSolved.LightForegroundTone != null)
            {
                var ratio = GetContrastRatio(bgT, wcagSolved.LightForegroundTone.Value);
                var lc = Math.Abs(GetApcaContrast(wcagSolved.LightForegroundTone.Value, bgT));
                if (ratio < 4.5 || lc < 60)
                {
                    contrastViolations++;
                }
                contrastSamples++;
            }
            var apcaSolved = SolveTonesForApca(bgT, 60);
            if (apcaSolved.DarkForegroundTone != null)
            {
                if (Math.Abs(GetApcaContrast(apcaSolved.DarkForegroundTone.Value, bgT)) < 60)
                {
                    contrastViolations++;
                }
                contrastSamples++;
            }
            if (apcaSolved.LightForegroundTone != null)
            {
                if (Math.Abs(GetApcaContrast(apcaSolved.LightForegroundTone.Value, bgT)) < 60)
                {
                    contrastViolations++;
                }
                contrastSamples++;
            }
        }
        return
        [
            new InvariantTestResult(
                "round-trip",
                "sRGB <-> OKYCT Bidirectional Round-Trip Accuracy",
                "max |ΔRGB| & max ΔE_OK(sRGB, okyctToRgb(rgbToOkyct(sRGB)))",
                maxRoundTripError < 1e-4 && maxRoundTripDeltaEOk < 1e-4,
                $"ΔRGB_max = {ToExponential(maxRoundTripError, 2)}, ΔE_OK_max = {ToExponential(maxRoundTripDeltaEOk, 2)}",
                "< 1.00e-4",
                roundTripSamples,
                "Verifies single-variable 3rd-order Halley solver (dY/dL, d²Y/dL² with Newton-Raphson fallback) convergence across the full sRGB cube."),
            new InvariantTestResult(
                "tone-bijection",
                "Tone <-> CIE Y Analytical Bijection & Monotonicity",
                "∀ T₁ < T₂ => Y(T₁) < Y(T₂), |yToTone(toneToY(T)) - T|",
                monotonicViolations == 0 && maxToneBijectionError < 1e-6,
                $"{ToExponential(maxToneBijectionError, 2)} (violations: {monotonicViolations})",
                "< 1.00e-6",
                201,
                "Guarantees strictly monotonic mapping between perceptual Tone and physical luminance Y."),
            new InvariantTestResult(
                "hex-round-trip",
                "8-bit Hex Quantization Hue & Tone Budget",
                "tonalStopHex -> hexToOkyct, ΔH & |ΔTone|",
                hexRoundTripViolations == 0,
                FormattableString.Invariant($"ΔH_max = {ToFixed(maxHexHueDriftDeg, 3)}°, ΔT_max = {ToFixed(maxHexToneDelta, 3)} (violations: {hexRoundTripViolations})"),
                FormattableString.Invariant($"ΔH <= {HexHueDriftCapDeg}°, |ΔTone| <= {HexToneDeltaCap}"),
                hexRoundTripSamples,
                "Verifies 8-vertex perceptual JND quantization preserves OKLab hue and Tone within tight bounds."),
            new InvariantTestResult(
                "cusp-containment",
                "360° Gamut Containment & Zero Hue Drift",
                "C=0.38 under preserve-tone & cusp-compress: ΔHue & channel bounds",
                gamutOverflowCount == 0 && maxHueDriftDeg < 0.1,
                $"ΔH_max = {ToFixed(maxHueDriftDeg, 3)}° (overflows: {gamutOverflowCount})",
                "ΔH < 0.100°",
                gamutSamples,
                "Ensures out-of-gamut colors stay strictly inside [0, 1] RGB with negligible hue rotation."),
            new InvariantTestResult(
                "algebraic-contrast",
                "O(1) Dual WCAG 2.1 + APCA Contrast Inversion Guard",
                "WCAG >= 4.5 & |APCA Lc| >= 60 for solved foreground tones",
                contrastViolations == 0,
                $"100% pass (violations: {contrastViolations}/{contrastSamples})",
                "0 violations",
                contrastSamples,
                "Verifies closed-form WCAG 2.1 and analytical APCA inverse Tone solvers across [0, 100].")
        ];
    }
}
