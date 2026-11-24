using Sandlada.Okyct.Adapters;
using Sandlada.Okyct.Application;
using Sandlada.Okyct.Domain.Models;
using Sandlada.Okyct.Ports.Inbound;
using Sandlada.Okyct.Ports.Outbound;
using TUnit.Assertions.Enums;

namespace Sandlada.Okyct.Tests;

public sealed class IntegrationTests
{
    [Test]
    public async Task PaletteCachesRemainBoundedAndKeepFractionalEntriesSeparate()
    {
        var palette = TonalPalette.FromHex("#0000ff", new TonalPaletteOptions(MaxCacheSize: 2));
        await Assert.That(palette.ToneOkyct(42.1)).IsNotEqualTo(palette.ToneOkyct(42.2));
        await Parallel.ForEachAsync(Enumerable.Range(0, 40), TestContext.Current!.Execution.CancellationToken,
            async (index, _) =>
            {
                var tone = 30 + index / 4.0;
                await Assert.That(palette.ToneOkyct(tone, GamutTarget.DisplayP3).T).IsEqualTo(tone);
                await Assert.That(palette.Tone(tone)).StartsWith("#");
            });
        await Assert.That(palette.CacheSize).IsEqualTo(4);
    }

    [Test]
    public async Task ExportersRejectTokenCollisionsAndHonorStateLayerSelection()
    {
        var theme = ThemeFactory.CreateTheme(new CreateThemeOptions("#2563eb", StateLayers: [StateLayer.Pressed]),
            new Dictionary<string, string> { ["primary"] = "#fc0" });
        Assert.ThrowsExactly<ArgumentException>(() => theme.Tokens());
        Assert.ThrowsExactly<ArgumentException>(() => theme.Export(TokenExportFormat.Tailwind));
        Assert.ThrowsExactly<ArgumentException>(() => theme.Export(TokenExportFormat.W3c));
        await Assert.That(theme.Export()).Contains("--md-sys-color-primary-pressed");
        await Assert.That(theme.Export(options: new ExportThemeOptions(StateLayers: [])))
            .DoesNotContain("--md-sys-color-primary-pressed");
    }

    [Test]
    public async Task ByteImageBufferAndNumericBufferProduceTheSameSeeds()
    {
        byte[] bytes = [25, 160, 210, 255, 200, 50, 85, 128, 20, 40, 50, 127];
        var quantizer = new ImageQuantizer();
        var actual = quantizer.ExtractSeedsFromImageData(new ImagePixelBuffer(bytes, 3, 1));
        var expected = quantizer.ExtractSeedsFromImageData(
            new ImagePixelBuffer(bytes.Select(value => (double)value).ToArray(), 3, 1));
        await Assert.That(actual).IsEquivalentTo(expected, CollectionOrdering.Matching);
        Assert.ThrowsExactly<ArgumentException>(() => quantizer.ExtractSeedsFromImageData(new ImagePixelBuffer(bytes, 3, 2)));
    }

    [Test]
    public async Task ExportersEmitLfOnlyAndPreserveSupplementaryUnicodeVerbatim()
    {
        var theme = ThemeFactory.CreateTheme(new CreateThemeOptions(
            "#2563eb",
            CustomColors: [new CustomColorInput("brandAccent😀", "#e93", Label: "品牌輔色😀 𠮷 \"literal \\uD83D\\uDE00\"")]));
        foreach (var format in Enum.GetValues<TokenExportFormat>())
        {
            var exported = theme.Export(format);
            await Assert.That(exported).DoesNotContain("\r");
        }
        var tsExport = theme.Export(TokenExportFormat.Ts);
        var w3cExport = theme.Export(TokenExportFormat.W3c);
        await Assert.That(tsExport).Contains("\"brandAccent😀\"");
        await Assert.That(tsExport).DoesNotContain("\\uD83D\\uDE00");
        await Assert.That(w3cExport).Contains("品牌輔色😀 𠮷 \\\"literal \\\\uD83D\\\\uDE00\\\"");
    }
}
