using System.Globalization;
using Sandlada.Okyct.Domain.Models;
using Sandlada.Okyct.Ports.Inbound;
using static Sandlada.Okyct.Domain.Services.ColorScience;

namespace Sandlada.Okyct.Application;

public static class LayerStacking
{
    public static Func<IReadOnlyList<ColorLayer>, Func<string, CompositedResult>> StackLayers(
        StackOptions? options = null) => layers => baseColor =>
    {
        ArgumentNullException.ThrowIfNull(layers);
        var space = options?.BlendSpace ?? BlendSpace.LinearSrgb;
        if (!Enum.IsDefined(space)) throw new ArgumentOutOfRangeException(nameof(options));

        var rgb = HexToRgb(baseColor);
        var traces = new List<LayerStepTrace>(layers.Count + 1);
        traces.Add(Trace(0, "Base", baseColor, 1, rgb));
        for (var index = 0; index < layers.Count; index++)
        {
            var layer = layers[index];
            if (!double.IsFinite(layer.Opacity))
                throw new ArgumentException($"Layer {index} must have finite opacity.", nameof(layers));

            rgb = Blend(HexToRgb(layer.Color), rgb, Math.Clamp(layer.Opacity, 0, 1), space);
            var label = string.IsNullOrEmpty(layer.Label) ? $"Layer {index + 1}" : layer.Label;
            traces.Add(Trace(index + 1, label, layer.Color, layer.Opacity, rgb));
        }

        var final = traces[^1];
        return new CompositedResult(baseColor, layers.Count, final.AccumulatedHex,
            final.AccumulatedOkyct, traces.AsReadOnly(), space);
    };

    public static Func<StateLayerPair, CompositedResult> StackStateLayers(IReadOnlyList<StateLayer> states)
    {
        ArgumentNullException.ThrowIfNull(states);
        var opacities = states.Select(state => (State: state, Opacity: state switch
        {
            StateLayer.Hovered or StateLayer.Hover => 0.08,
            StateLayer.Focused or StateLayer.Focus or StateLayer.Pressed => 0.12,
            StateLayer.Dragged => 0.16,
            _ => throw new ArgumentOutOfRangeException(nameof(states))
        })).ToArray();

        return pair =>
        {
            ArgumentNullException.ThrowIfNull(pair);
            var layers = opacities.Select(entry => new ColorLayer(pair.StateColor, entry.Opacity,
                $"{entry.State.ToString().ToUpperInvariant()} State Layer ({entry.Opacity * 100:0}%)")).ToArray();
            return StackLayers(new StackOptions(BlendSpace.Okyct))(layers)(pair.Base);
        };
    }

    public static Func<CompositedResult, StackedContrastReport> AuditStackedContrast(string foregroundHex) => result =>
    {
        var foreground = RgbToOkyct(HexToRgb(foregroundHex)).T;
        var background = result.FinalOkyct.T;
        var delta = background - (result.Traces.FirstOrDefault()?.AccumulatedOkyct.T ?? background);
        var wcag = GetContrastRatio(foreground, background);
        var apca = Math.Abs(GetApcaContrast(foreground, background));
        var ratioText = ToFixed(wcag, 2);
        var deltaText = ToFixed(delta, 1);

        string? warning = null;
        double? compensation = null;
        if (wcag < 4.5 || apca < 60)
        {
            var sign = delta > 0 ? "+" : "";
            warning = FormattableString.Invariant(
                $"Warning: after {result.TotalLayers} composited layers, background Tone shifted by ΔT={sign}{deltaText}, reducing contrast to WCAG {ratioText}:1 / APCA Lc {apca}.");
            var solution = SolveTonesForContrast(background, 4.5, new ContrastSolveOptions(ContrastMetric.Both, 60));
            compensation = foreground > background ? solution.LightForegroundTone : solution.DarkForegroundTone;
        }

        return new StackedContrastReport(foregroundHex, result.FinalHex,
            double.Parse(ratioText, CultureInfo.InvariantCulture), wcag >= 4.5, wcag >= 7, apca,
            double.Parse(deltaText, CultureInfo.InvariantCulture), warning, compensation);
    };

    public static Func<IReadOnlyList<ColorLayer>, Func<string, string>> StackToCssColorMix(
        CssMixSpace space = CssMixSpace.Oklch)
    {
        var name = space switch
        {
            CssMixSpace.Oklch => "oklch",
            CssMixSpace.Srgb => "srgb",
            _ => throw new ArgumentOutOfRangeException(nameof(space))
        };

        return layers =>
        {
            ArgumentNullException.ThrowIfNull(layers);
            return baseExpression =>
            {
                ArgumentNullException.ThrowIfNull(baseExpression);
                if (TrimAsciiWhitespace(baseExpression.AsSpan()).IsEmpty)
                    throw new ArgumentException("Expected a non-empty base expression.", nameof(baseExpression));
                var expression = baseExpression;
                foreach (var layer in layers)
                {
                    ArgumentNullException.ThrowIfNull(layer.Color);
                    if (TrimAsciiWhitespace(layer.Color.AsSpan()).IsEmpty)
                        throw new ArgumentException("Expected a non-empty layer color.", nameof(layers));
                    if (!double.IsFinite(layer.Opacity)) throw new ArgumentOutOfRangeException(nameof(layers));
                    var foreground = ToFixed(Math.Clamp(layer.Opacity, 0, 1) * 100, 2);
                    var background = ToFixed(100 - double.Parse(foreground, CultureInfo.InvariantCulture), 2);
                    expression = $"color-mix(in {name}, {expression} {TrimFraction(background)}%, {layer.Color} {TrimFraction(foreground)}%)";
                }
                return expression;
            };
        };
    }

    private static string TrimFraction(string number) => number.TrimEnd('0').TrimEnd('.');

    private static LayerStepTrace Trace(int index, string label, string color, double opacity, Rgb rgb)
    {
        var okyct = RgbToOkyct(rgb);
        return new LayerStepTrace(index, label, color, opacity, RgbToHex(rgb), okyct,
            GetContrastRatio(okyct.T, 100), GetContrastRatio(okyct.T, 0));
    }

    private static Rgb Blend(Rgb foreground, Rgb background, double weight, BlendSpace space)
    {
        // The initial background is opaque, so compositing preserves alpha = 1.
        var remaining = 1 - weight;

        if (space == BlendSpace.Okyct)
        {
            var fg = RgbToOkyct(foreground);
            var bg = RgbToOkyct(background);
            var fgAngle = fg.H * Math.PI / 180;
            var bgAngle = bg.H * Math.PI / 180;
            var a = fg.C * Math.Cos(fgAngle) * weight + bg.C * Math.Cos(bgAngle) * remaining;
            var b = fg.C * Math.Sin(fgAngle) * weight + bg.C * Math.Sin(bgAngle) * remaining;
            var hue = Math.Atan2(b, a) * 180 / Math.PI;
            var tone = fg.T * weight + bg.T * remaining;
            return OkyctToRgb(new OkyctColor(hue < 0 ? hue + 360 : hue, double.Hypot(a, b), tone));
        }

        double Channel(double front, double back) => Math.Clamp(space == BlendSpace.LinearSrgb
            ? LinearToSrgb(SrgbToLinear(front) * weight + SrgbToLinear(back) * remaining)
            : front * weight + back * remaining, 0, 1);

        return new Rgb(Channel(foreground.R, background.R), Channel(foreground.G, background.G),
            Channel(foreground.B, background.B));
    }
}
