using Sandlada.Okyct.Domain.Models;

namespace Sandlada.Okyct.Domain.Services;

public static partial class ColorScience
{
    private const double QuantizationToneMargin = 0.35;

    private static ContrastSolution SolveWcagOnly(double bgTone, double targetRatio)
    {
        var bgY = ToneToY(bgTone);
        var darkTargetY = (bgY + 0.05) / targetRatio - 0.05;
        double? darkTone = darkTargetY >= -1e-12 ? Math.Max(0, Math.Floor(YToTone(Math.Max(0, darkTargetY)) - QuantizationToneMargin)) : null;
        var lightTargetY = targetRatio * (bgY + 0.05) - 0.05;
        double? lightTone = lightTargetY <= 1.0 + 1e-12 ? Math.Min(100, Math.Ceiling(YToTone(Math.Min(1.0, lightTargetY)) + QuantizationToneMargin)) : null;
        return new ContrastSolution(darkTone, lightTone);
    }

    public static ContrastSolution SolveTonesForContrast(ColorToneInput bgToneOrColor, double targetRatio = 4.5, ContrastSolveOptions? options = null)
    {
        options ??= new();
        var bgTone = ResolveToneInput(bgToneOrColor);
        if (!double.IsFinite(targetRatio) || targetRatio < 1 || targetRatio > 21)
        {
            throw new ArgumentException($"Invalid targetRatio: {targetRatio}. Expected a finite number in [1, 21].");
        }
        var metric = options.Metric;
        if (!Enum.IsDefined(metric))
        {
            throw new ArgumentException("Invalid contrast metric");
        }
        var targetLc = options.TargetLc ?? (targetRatio >= 7.0 ? 75 : targetRatio >= 4.5 ? 60 : 45);
        if (metric == ContrastMetric.Wcag)
        {
            return SolveWcagOnly(bgTone, targetRatio);
        }
        if (metric == ContrastMetric.Apca)
        {
            return SolveTonesForApca(bgTone, targetLc);
        }
        var wcag = SolveWcagOnly(bgTone, targetRatio);
        var apca = SolveTonesForApca(bgTone, targetLc);
        double? darkForegroundTone = wcag.DarkForegroundTone != null && apca.DarkForegroundTone != null ? Math.Min(wcag.DarkForegroundTone.Value, apca.DarkForegroundTone.Value) : null;
        double? lightForegroundTone = wcag.LightForegroundTone != null && apca.LightForegroundTone != null ? Math.Max(wcag.LightForegroundTone.Value, apca.LightForegroundTone.Value) : null;
        return new ContrastSolution(darkForegroundTone, lightForegroundTone);
    }
}
