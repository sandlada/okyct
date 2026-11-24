using System.Globalization;
using System.Text.RegularExpressions;
using Sandlada.Okyct.Ports.Inbound;
using Sandlada.Okyct.Ports.Outbound;
using static Sandlada.Okyct.Domain.Services.ColorScience;

namespace Sandlada.Okyct.Adapters;

public static partial class TokenOperators
{
    public static Dictionary<string, string> ToTokenDictionary(DynamicSchemeColors scheme,
        IReadOnlyList<ResolvedCustomColor>? customColors = null, bool includeStateLayers = true)
    {
        ArgumentNullException.ThrowIfNull(scheme);
        var result = SystemColorTokens.Values.ToDictionary(key => key, key => scheme[key], StringComparer.Ordinal);
        if (includeStateLayers && scheme.StateLayers is { } states)
            foreach (var (key, value) in Entries(states)) TokenExporter.Add(result, key, value);

        foreach (var color in customColors ?? [])
        {
            var baseName = Rename(color.Name, NamingCase.Camel);
            if (baseName.Length == 0) throw new ArgumentException("Expected a non-empty custom token name.");
            var foreground = "on" + Capitalize(baseName);
            (string Source, string Target, string Hex)[] roles =
            [
                ("color", baseName, color.Color), ("onColor", foreground, color.OnColor),
                ("colorContainer", baseName + "Container", color.ColorContainer),
                ("onColorContainer", foreground + "Container", color.OnColorContainer)
            ];
            foreach (var role in roles) TokenExporter.Add(result, role.Target, role.Hex);
            if (!includeStateLayers || color.StateLayers is not { } customStates) continue;
            foreach (var (key, value) in Entries(customStates))
            {
                foreach (var index in new[] { 2, 3, 1, 0 })
                {
                    var role = roles[index];
                    if (!key.StartsWith(role.Source, StringComparison.Ordinal)) continue;
                    TokenExporter.Add(result, role.Target + key[role.Source.Length..], value);
                    break;
                }
            }
        }
        return result;
    }

    public static Func<TokenSource, Dictionary<string, string>> RenameCase(NamingCase targetCase)
    {
        if (!Enum.IsDefined(targetCase)) throw new ArgumentOutOfRangeException(nameof(targetCase));
        return source =>
        {
            var result = new Dictionary<string, string>(StringComparer.Ordinal);
            foreach (var (key, value) in Entries(source)) TokenExporter.Add(result, Rename(key, targetCase), value);
            return result;
        };
    }

    public static Func<TokenSource, Dictionary<string, string>> MapTokens(Func<string, string, string> mapper)
    {
        ArgumentNullException.ThrowIfNull(mapper);
        return source => Entries(source).ToDictionary(pair => pair.Key, pair => mapper(pair.Value, pair.Key), StringComparer.Ordinal);
    }

    public static Func<TokenSource, Dictionary<string, string>> FilterTokens(Func<string, string, bool> predicate)
    {
        ArgumentNullException.ThrowIfNull(predicate);
        return source => Entries(source).Where(pair => predicate(pair.Key, pair.Value))
            .ToDictionary(StringComparer.Ordinal);
    }

    public static Func<TokenSource, Dictionary<string, string>> WithPrefix(string prefix)
    {
        ArgumentNullException.ThrowIfNull(prefix);
        var trimmed = TrimAsciiWhitespace(prefix);
        var clean = trimmed.Length == 0 || trimmed.EndsWith('-') ? trimmed : trimmed + "-";
        return source =>
        {
            var result = new Dictionary<string, string>(StringComparer.Ordinal);
            foreach (var (key, value) in Entries(source))
                result[clean.Length == 0 ? key : clean + StripPrefix(key)] = value;
            return result;
        };
    }

    public static Func<TokenSource, Dictionary<string, string>> PickTokens(IReadOnlyList<string> keys)
    {
        ArgumentNullException.ThrowIfNull(keys);
        return source =>
        {
            var input = source.Normalize();
            var result = new Dictionary<string, string>(StringComparer.Ordinal);
            foreach (var key in keys)
                if (input.TryGetValue(key, out var value)) result[key] = value;
            return result;
        };
    }

    public static Func<TokenSource, Dictionary<string, string>> OmitTokens(IReadOnlyList<string> keys)
    {
        ArgumentNullException.ThrowIfNull(keys);
        var omitted = keys.ToHashSet(StringComparer.Ordinal);
        return FilterTokens((key, _) => !omitted.Contains(key));
    }

    public static Func<TokenSource, string> ToCssRuleBlock(string selector)
    {
        ArgumentNullException.ThrowIfNull(selector);
        var trimmed = TrimAsciiWhitespace(selector);
        if (trimmed.Length == 0) throw new ArgumentException("Expected a non-empty CSS selector.", nameof(selector));
        return source =>
        {
            var lines = Entries(source).Select(pair =>
                $"  {(pair.Key.StartsWith("--", StringComparison.Ordinal) ? pair.Key : "--" + pair.Key)}: {pair.Value};");
            return trimmed + " {\n" + string.Join('\n', lines) + "\n}";
        };
    }

    public static Func<string, string> ToCssVarRef(string? prefix = null, string? fallback = null) => tokenKey =>
    {
        ArgumentNullException.ThrowIfNull(tokenKey);
        var key = TrimAsciiWhitespace(Regex.Replace(tokenKey, "^[- \\t\\n\\r\\f]+", ""));
        if (key.Length == 0) throw new ArgumentException("Expected a non-empty token name.", nameof(tokenKey));
        var start = string.IsNullOrEmpty(prefix) ? "--" : prefix.EndsWith('-') ? prefix : prefix + "-";
        return string.IsNullOrEmpty(fallback) ? $"var({start}{key})" : $"var({start}{key}, {fallback})";
    };

    public static Func<string, string> WithAlpha(double opacity)
    {
        if (!double.IsFinite(opacity)) throw new ArgumentOutOfRangeException(nameof(opacity));
        var alpha = Math.Clamp(opacity, 0, 1);
        return input =>
        {
            ArgumentNullException.ThrowIfNull(input);
            var color = TrimAsciiWhitespace(input);
            if (color.Length == 0) throw new ArgumentException("Expected a non-empty color or CSS variable.", nameof(input));
            if (HexPattern().IsMatch(color))
            {
                if (color.Length == 4) color = "#" + string.Concat(color.Skip(1).Select(c => new string(c, 2)));
                return color.ToUpperInvariant() + ((int)RoundToInteger(alpha * 255)).ToString("X2", CultureInfo.InvariantCulture);
            }
            if (color.StartsWith("--", StringComparison.Ordinal)) color = $"var({color})";
            return FormattableString.Invariant($"color-mix(in srgb, {color} {RoundToInteger(alpha * 100)}%, transparent)");
        };
    }

    public static Func<TokenSource, ContractValidationReport> ValidateContract(IReadOnlyList<string> requiredKeys)
    {
        ArgumentNullException.ThrowIfNull(requiredKeys);
        var required = requiredKeys.ToHashSet(StringComparer.Ordinal);
        return source =>
        {
            var keys = Entries(source).Select(pair => StripPrefix(pair.Key)).Distinct(StringComparer.Ordinal).ToArray();
            var missing = requiredKeys.Where(key => !keys.Contains(key, StringComparer.Ordinal)).ToArray();
            var extra = keys.Where(key => !required.Contains(key)).ToArray();
            return new ContractValidationReport(missing.Length == 0, missing, extra, requiredKeys.Count);
        };
    }

    public static Func<TokenSource, ThemeParityReport> DiffThemeParity(TokenSource reference)
    {
        var keys = Entries(reference).Select(pair => pair.Key).ToArray();
        return target =>
        {
            var other = Entries(target).Select(pair => pair.Key).ToArray();
            var differences = keys.Except(other, StringComparer.Ordinal).Select(key => $"Target missing: {key}")
                .Concat(other.Except(keys, StringComparer.Ordinal).Select(key => $"Reference missing: {key}")).ToArray();
            return new ThemeParityReport(differences.Length == 0, differences);
        };
    }

    public static Func<string, string> LimitBlueEmission(double maxBlueAttenuation = 0.22, double hueShiftDeg = 3) =>
        hex => ThemeFactory.Physics.ApplyBlueBurnInGuard(hex, maxBlueAttenuation, hueShiftDeg);

    public static Func<TokenSource, Dictionary<string, string>> OptimizeForOled(EmissiveSchemeOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);
        ThemeFactory.Physics.GetPanelSpec(options.Profile);
        return MapTokens((value, key) => ThemeFactory.Physics.ApplyEmissiveProfileToTokenHex(key, value, options));
    }

    public static Func<TokenSource, OledPowerAuditReport> AuditOledPower(double maxAvgPowerMw = 320, double maxBlueStress = 65)
    {
        if (!double.IsFinite(maxAvgPowerMw) || maxAvgPowerMw < 0) throw new ArgumentOutOfRangeException(nameof(maxAvgPowerMw));
        if (!double.IsFinite(maxBlueStress) || maxBlueStress < 0) throw new ArgumentOutOfRangeException(nameof(maxBlueStress));
        return source =>
        {
            var readings = Entries(source).Where(pair => HexPattern().IsMatch(TrimAsciiWhitespace(pair.Value.AsSpan())))
                .Select(pair => (pair.Key, Reading: ThemeFactory.Physics.ComputeColorEmissiveTelemetry(pair.Value))).ToArray();
            if (readings.Length == 0) return new OledPowerAuditReport(true, 0, 0, "none", 0, 0, 0, 0);

            var maximum = readings.MaxBy(entry => entry.Reading.BlueStressIndex);
            var power = RoundToInteger(readings.Average(entry => entry.Reading.PowerMw) * 10) / 10;
            var apl = RoundToInteger(readings.Average(entry => entry.Reading.AplPercent) * 10) / 10;
            var stress = maximum.Reading.BlueStressIndex;
            var trueBlack = readings.Count(entry => entry.Reading.IsPixelOff);
            var nearBlack = readings.Count(entry => entry.Reading.EmitterState == EmitterState.NearBlack);
            return new OledPowerAuditReport(power <= maxAvgPowerMw && stress <= maxBlueStress, power, apl,
                maximum.Key, stress, trueBlack, nearBlack, readings.Length);
        };
    }

    private static string Rename(string key, NamingCase style)
    {
        var words = TokenExporter.Words(key);
        return style switch
        {
            NamingCase.Kebab => string.Join('-', words.Select(word => word.ToLowerInvariant())),
            NamingCase.Camel => string.Concat(words.Select((word, index) => index == 0
                ? word.ToLowerInvariant() : Capitalize(word.ToLowerInvariant()))),
            NamingCase.Snake => string.Join('_', words.Select(word => word.ToLowerInvariant())),
            NamingCase.Constant => string.Join('_', words.Select(word => word.ToUpperInvariant())),
            _ => throw new ArgumentOutOfRangeException(nameof(style))
        };
    }

    private static string Capitalize(string text) => char.ToUpperInvariant(text[0]) + text[1..];
    private static string StripPrefix(string text) => text.StartsWith("--", StringComparison.Ordinal) ? text[2..] : text;

    private static IEnumerable<KeyValuePair<string, T>> Entries<T>(IReadOnlyDictionary<string, T> dictionary) =>
        dictionary.OrderBy(pair => uint.TryParse(pair.Key, NumberStyles.None, CultureInfo.InvariantCulture, out var index) &&
            pair.Key == index.ToString(CultureInfo.InvariantCulture) ? index : uint.MaxValue);

    private static IEnumerable<KeyValuePair<string, string>> Entries(TokenSource source)
    {
        ArgumentNullException.ThrowIfNull(source);
        return Entries(source.Normalize());
    }

    [GeneratedRegex("^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$")]
    internal static partial Regex HexPattern();
}
