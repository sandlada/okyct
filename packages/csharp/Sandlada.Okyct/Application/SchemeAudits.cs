using System.Globalization;
using Sandlada.Okyct.Domain.Models;
using Sandlada.Okyct.Ports.Inbound;
using static Sandlada.Okyct.Domain.Services.ColorScience;

namespace Sandlada.Okyct.Application;

public static partial class DynamicSchemes
{
    private static readonly CvdType[] DefaultCvdTypes = [CvdType.Protanopia, CvdType.Deuteranopia, CvdType.Tritanopia];
    private static readonly (string First, string Second)[] SemanticAuditPairs = [
        ("error", "success"), ("error", "warning"), ("warning", "success"), ("primary", "error"),
        ("primary", "tertiary"), ("errorContainer", "successContainer")];

    public static IReadOnlyList<ContrastAuditItem> AuditSchemeContrast(DynamicSchemeColors scheme)
    {
        ArgumentNullException.ThrowIfNull(scheme);
        double Tone(string token) => scheme.Colors.TryGetValue(token, out var hex)
            ? HexToOkyct(hex).T : scheme.Tones.GetValueOrDefault(token, 50);
        static double Format(double value) => RoundToInteger(value * 100) / 100;

        // Preserve the audit's original ordering for the two surface pairs.
        var pairs = Pairs.ToArray();
        (pairs[9], pairs[10]) = (pairs[10], pairs[9]);
        return pairs.Select(pair =>
        {
            var fg = Tone(pair.Foreground);
            var bg = Tone(pair.Background);
            var wcag = GetContrastRatio(fg, bg);
            var apca = Math.Abs(GetApcaContrast(fg, bg));
            return new ContrastAuditItem(pair.Foreground, pair.Background, Format(fg), Format(bg), Format(wcag),
                wcag >= (pair.IsOutline ? 3 : 4.5), wcag >= 7, apca, apca >= (pair.IsOutline ? 45 : 60));
        }).ToArray();
    }

    public static IReadOnlyList<CvdSeparabilityAuditItem> AuditSchemeCvd(
        DynamicSchemeColors scheme, AuditSchemeCvdOptions? options = null)
    {
        ArgumentNullException.ThrowIfNull(scheme);
        options ??= new();
        var types = options.CvdTypes ?? DefaultCvdTypes;
        if (types.Any(type => !Enum.IsDefined(type) || type == CvdType.None) ||
            !double.IsFinite(options.MinDeltaE) || options.MinDeltaE < 0 ||
            !double.IsFinite(options.MinDeltaTone) || options.MinDeltaTone < 0)
            throw new ArgumentOutOfRangeException(nameof(options));

        var results = new List<CvdSeparabilityAuditItem>(types.Count * SemanticAuditPairs.Length);
        foreach (var type in types)
        foreach (var (first, second) in SemanticAuditPairs)
        {
            var a = SimulateCvd(scheme[first], type, options.Severity);
            var b = SimulateCvd(scheme[second], type, options.Severity);
            var deltaE = RoundToInteger(GetDeltaEOklab(a, b) * 10000) / 10000;
            var deltaTone = RoundToInteger(Math.Abs(HexToOkyct(a).T - HexToOkyct(b).T) * 100) / 100;
            var separable = deltaE >= options.MinDeltaE || deltaTone >= options.MinDeltaTone;
            var recommendation = separable ? "OK" : FormattableString.Invariant(
                $"Low {type.ToString().ToLowerInvariant()} separability (ΔE={deltaE}, ΔT={deltaTone}): separate Tone by >={options.MinDeltaTone} or shift hue/iconography.");
            results.Add(new CvdSeparabilityAuditItem(first, second, type, deltaE, deltaTone, separable, recommendation));
        }
        return results.AsReadOnly();
    }
}
