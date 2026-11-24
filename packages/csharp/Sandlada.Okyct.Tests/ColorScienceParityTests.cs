using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Sandlada.Okyct.Adapters;
using Sandlada.Okyct.Application;
using Sandlada.Okyct.Domain.Models;
using Sandlada.Okyct.Ports.Inbound;
using Sandlada.Okyct.Ports.Outbound;
using TUnit.Assertions.Exceptions;
using static Sandlada.Okyct.Domain.Services.ColorScience;

namespace Sandlada.Okyct.Tests;

public sealed class ColorScienceParityTests
{
    private static readonly Lazy<OkyctTheme> Theme = new(() => ThemeFactory.CreateTheme(new CreateThemeOptions(
        "#2563eb", Gamut: GamutTarget.DisplayP3,
        Emissive: new EmissiveSchemeOptions(EmissivePanelType.WoledDesktop, BurnInGuard: true),
        CustomColors:
        [
            new CustomColorInput("brandAccent😀", "#e93", Label: "品牌輔色😀"),
            new CustomColorInput("ext𠮷Glyph", "#39e", Label: "擴充𠮷 \"literal \\uD83D\\uDE00\"")
        ],
        StateLayers: [StateLayer.Dragged, StateLayer.Hovered])));

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter(JsonNamingPolicy.KebabCaseLower) },
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    [Test]
    public async Task TypeScriptFixturesAgreeUnderNonEnglishCulture()
    {
        var previous = CultureInfo.CurrentCulture;
        try
        {
            CultureInfo.CurrentCulture = CultureInfo.GetCultureInfo("de-DE");
            using var document = JsonDocument.Parse(File.ReadAllText(
                Path.Combine(AppContext.BaseDirectory, "color-science.json")));
            var count = 0;
            var failures = new List<string>();
            foreach (var fixture in document.RootElement.EnumerateArray())
            {
                try
                {
                    await VerifyFixture(fixture);
                }
                catch (AssertionException ex)
                {
                    failures.Add($"{fixture.GetProperty("api").GetString()}({fixture.GetProperty("args").GetRawText()}): {ex.Message}");
                }
                catch (ArgumentException ex)
                {
                    failures.Add($"{fixture.GetRawText()} threw {ex.Message}");
                }
                count++;
            }
            await Assert.That(count > 0).IsTrue();
            await Assert.That(failures).IsEmpty().Because(string.Join(Environment.NewLine, failures.Take(12)));
        }
        finally
        {
            CultureInfo.CurrentCulture = previous;
        }
    }

    [Test]
    public async Task AllFiveColorimetricInvariantsPass()
    {
        var results = RunColorimetricInvariantSuite();
        await Assert.That(results.Length).IsEqualTo(5);
        foreach (var result in results)
            await Assert.That(result.Passed).IsTrue().Because($"{result.Id} — {result.MeasuredValue}");
    }

    private static async Task VerifyFixture(JsonElement fixture)
    {
        var api = fixture.GetProperty("api").GetString();
        var arguments = fixture.GetProperty("args");
        ColorConversionOptions GamutOptions(int index)
        {
            var options = arguments[index];
            var gamut = options.TryGetProperty("gamut", out var target) && target.GetString() == "display-p3"
                ? GamutTarget.DisplayP3 : GamutTarget.Srgb;
            var mode = options.TryGetProperty("gamutMapping", out var mapping) && mapping.GetString() == "cusp-compress"
                ? GamutMappingMode.CuspCompress : GamutMappingMode.PreserveTone;
            return new(gamut, mode);
        }

        ColorToneInput Tone(int index)
        {
            var item = arguments[index];
            return item.ValueKind switch
            {
                JsonValueKind.String => item.GetString()!,
                JsonValueKind.Object => item.Deserialize<OkyctColor>(JsonOptions),
                _ => item.GetDouble()
            };
        }

        string Text(int index) => arguments[index].GetString()!;
        double Number(int index) => arguments[index].GetDouble();
        OkyctColor Color() => arguments[0].Deserialize<OkyctColor>(JsonOptions);
        object Invoke() => api switch
        {
            "hexToRgb" => HexToRgb(Text(0)),
            "hexToOkyct" => HexToOkyct(Text(0)),
            "rgbToOkyct" => RgbToOkyct(arguments[0].Deserialize<Rgb>(JsonOptions)),
            "rgbToHex" => RgbToHex(arguments[0].Deserialize<Rgb>(JsonOptions)),
            "getDeltaEOklab" => GetDeltaEOklab(Text(0), Text(1)),
            "getDeltaE2000" => GetDeltaE2000(Text(0), Text(1)),
            "simulateCvd" => SimulateCvd(Text(0), Enum.Parse<CvdType>(Text(1), true), Number(2)),
            "shortestHueDelta" => ShortestHueDelta(Number(0), Number(1)),
            "findGamutCusp" => FindGamutCusp(Number(0), GamutOptions(1)),
            "findMaxChromaForTone" => FindMaxChromaForTone(Number(0), Number(1), GamutOptions(2)),
            "isInGamut" => IsInGamut(Color(), GamutOptions(1)),
            "isInSrgbGamut" => arguments.GetArrayLength() == 1
                ? IsInSrgbGamut(Color()) : IsInSrgbGamut(Number(0), Number(1), Number(2)),
            "srgbToLinear" => SrgbToLinear(Number(0)),
            "linearToSrgb" => LinearToSrgb(Number(0)),
            "okyctToRgb" => OkyctToRgb(Color(), GamutOptions(1)),
            "okyctToHex" => OkyctToHex(Color(), GamutOptions(1)),
            "okyctToDisplayP3Css" => OkyctToDisplayP3Css(Color(), GamutOptions(1)),
            "okyctToOklchCss" => OkyctToOklchCss(Color()),
            "toneToY" => ToneToY(Number(0)),
            "yToTone" => YToTone(Number(0)),
            "getContrastRatio" => GetContrastRatio(Tone(0), Tone(1)),
            "getApcaContrast" => GetApcaContrast(Tone(0), Tone(1)),
            "solveTonesForApca" => SolveTonesForApca(Tone(0), Number(1)),
            "solveTonesForContrast" => SolveTonesForContrast(Tone(0), Number(1),
                new ContrastSolveOptions(
                    arguments[2].TryGetProperty("metric", out var metric) ? Enum.Parse<ContrastMetric>(metric.GetString()!, true) : ContrastMetric.Wcag,
                    arguments[2].TryGetProperty("targetLc", out var lc) ? lc.GetDouble() : null)),
            "invariants" => RunColorimetricInvariantSuite().Select(item => new
            {
                item.Id,
                item.Name,
                item.Formula,
                item.Passed,
                item.Threshold,
                item.SamplesChecked,
                item.Details
            }).ToArray(),
            "palettes" => PaletteFixture(Text(0), Enum.Parse<PaletteVariant>(Text(1), true)),
            "stack" => LayerStacking.StackLayers(new StackOptions(
                arguments[1].Deserialize<BlendSpace>(JsonOptions)))(arguments[0].Deserialize<ColorLayer[]>(JsonOptions)!)("#128"),
            "cssMix" => LayerStacking.StackToCssColorMix()(arguments[0].Deserialize<ColorLayer[]>(JsonOptions)!)("var(--surface)"),
            "stackStates" => StackStates(arguments[0]),
            "stackAudit" => LayerStacking.AuditStackedContrast(Text(1))(StackStates(arguments[0])),
            "quantize" => Quantize(arguments[0], arguments[1].Deserialize<ImageQuantizerMode>(JsonOptions)),
            "scheme" => DynamicSchemes.BuildDynamicSchemeWithPhysics(
                Palettes.CreatePalettesFromSource(Text(0), new CreatePalettesOptions(Gamut: GamutTarget.DisplayP3)),
                new BuildDynamicSchemeOptions(arguments[2].Deserialize<ThemeMode>(JsonOptions), 0.6,
                    Emissive: new EmissiveSchemeOptions(arguments[1].Deserialize<EmissivePanelType>(JsonOptions), true, true, true),
                    StateLayers: [StateLayer.Pressed, StateLayer.Dragged], StateLayersContrastGuard: true),
                new DisplayPhysics()),
            "themeTokens" => Theme.Value.Tokens(),
            "themeCustomColors" => Theme.Value.DarkCustomColors,
            "contrastAudit" => Theme.Value.AuditContrast(),
            "cvdAudit" => DynamicSchemes.AuditSchemeCvd(Theme.Value.Scheme()),
            "telemetry" => Theme.Value.AnalyzeEmissive(),
            "pixelTelemetry" => new DisplayPhysics().ComputeColorEmissiveTelemetry(Text(0)),
            "exportJson" => JsonSerializer.Deserialize<JsonElement>(Theme.Value.Export(TokenExportFormat.W3c,
                new ExportThemeOptions(StateLayers: [StateLayer.Pressed], ColorFormat: arguments[0].Deserialize<CssColorFormat>(JsonOptions)))),
            "exportHash" => Convert.ToHexStringLower(SHA256.HashData(Encoding.UTF8.GetBytes(
                Theme.Value.Export(arguments[0].Deserialize<TokenExportFormat>(JsonOptions), new ExportThemeOptions(
                    CssSchemeMode: arguments[2].Deserialize<CssSchemeMode>(JsonOptions), StateLayers: [StateLayer.Pressed],
                    ColorFormat: arguments[1].Deserialize<CssColorFormat>(JsonOptions)))))),
            "tokenOperators" => TokenOperatorFixture(arguments[0].Deserialize<Dictionary<string, string>>(JsonOptions)!,
                arguments[1].Deserialize<Dictionary<string, string>>(JsonOptions)!),
            _ => throw new InvalidOperationException($"Unknown fixture API {api}")
        };

        if (fixture.TryGetProperty("throws", out _))
        {
            Assert.Throws<ArgumentException>(() => Invoke());
            return;
        }

        var result = Invoke();
        var jsonOptions = result is ContrastSolution or StackedContrastReport
            ? new JsonSerializerOptions(JsonSerializerDefaults.Web) : JsonOptions;
        await Compare(fixture.GetProperty("expected"), JsonSerializer.SerializeToElement(result, jsonOptions),
            $"{api}({arguments.GetRawText()})");
    }

    private static CompositedResult StackStates(JsonElement pair) =>
        LayerStacking.StackStateLayers([StateLayer.Hover, StateLayer.Pressed, StateLayer.Dragged])(
            pair.Deserialize<StateLayerPair>(JsonOptions)!);

    private static object TokenOperatorFixture(Dictionary<string, string> source, Dictionary<string, string> reference)
    {
        var styled = TokenOperators.WithPrefix("ui")(TokenOperators.RenameCase(NamingCase.Kebab)(source));
        var nested = TokenOperators.NestTokens()(source);
        return new
        {
            styled,
            nested,
            roundTrip = TokenOperators.FlattenTokens()(nested),
            picked = TokenOperators.PickTokens(["blue", "neutral"])(source),
            omitted = TokenOperators.OmitTokens(["blue"])(source),
            filtered = TokenOperators.FilterTokens((key, _) => key.Contains("neutral"))(source),
            mapped = TokenOperators.MapTokens((value, _) => TokenOperators.WithAlpha(0.5)(value))(source),
            css = TokenOperators.ToCssRuleBlock(" :root ")(styled),
            variable = TokenOperators.ToCssVarRef("--ui", "#fff")("--PrimaryAccent"),
            contract = TokenOperators.ValidateContract(["PrimaryAccent", "missing"])(source),
            diff = TokenOperators.DiffThemeParity(reference)(source),
            optimized = TokenOperators.OptimizeForOled(new EmissiveSchemeOptions(EmissivePanelType.AmoledAntiSmear, BurnInGuard: true))(source),
            guarded = TokenOperators.LimitBlueEmission()("#0000ff"),
            power = TokenOperators.AuditOledPower()(source)
        };
    }

    private static object Quantize(JsonElement image, ImageQuantizerMode mode)
    {
        var data = image.GetProperty("data").Deserialize<double[]>(JsonOptions)!;
        return new ImageQuantizer().ExtractSeedsFromImageData(
            new ImagePixelBuffer(data, image.GetProperty("width").GetInt32(), image.GetProperty("height").GetInt32()),
            new ExtractSeedsOptions(Mode: mode));
    }

    private static object PaletteFixture(string seed, PaletteVariant variant)
    {
        var palette = Palettes.CreatePalettesFromSource(seed, new CreatePalettesOptions(variant, Gamut: GamutTarget.DisplayP3));
        TonalPalette[] ordered = [palette.Primary, palette.Secondary, palette.Tertiary, palette.Neutral,
            palette.NeutralVariant, palette.Error, palette.Warning, palette.Success, palette.Info];
        return ordered.Select(entry => new
        {
            entry.Hue,
            entry.TargetChroma,
            Tones = new[] { 4.5, 40, 99 }.Select(entry.Tone),
            P3Css = entry.ToneCss(42.25, CssColorFormat.DisplayP3)
        }).ToArray();
    }

    private static async Task Compare(JsonElement expected, JsonElement actual, string context)
    {
        await Assert.That(actual.ValueKind).IsEqualTo(expected.ValueKind).Because(context);
        if (expected.ValueKind == JsonValueKind.Object)
        {
            await Assert.That(actual.EnumerateObject().Count()).IsEqualTo(expected.EnumerateObject().Count()).Because(context);
            foreach (var field in expected.EnumerateObject())
                await Compare(field.Value, actual.GetProperty(field.Name), $"{context} / {field.Name}");
        }
        else if (expected.ValueKind == JsonValueKind.Array)
        {
            await Assert.That(actual.GetArrayLength()).IsEqualTo(expected.GetArrayLength()).Because(context);
            for (var index = 0; index < expected.GetArrayLength(); index++)
                await Compare(expected[index], actual[index], $"{context} / [{index}]");
        }
        else if (expected.ValueKind == JsonValueKind.Number)
        {
            var value = expected.GetDouble();
            await Assert.That(actual.GetDouble()).IsEqualTo(value)
                .Within(1e-9 * Math.Max(1, Math.Abs(value))).Because(context);
        }
        else
        {
            await Assert.That(JsonElement.DeepEquals(expected, actual)).IsTrue()
                .Because($"{context} / actual = {actual.GetRawText()}");
        }
    }
}
