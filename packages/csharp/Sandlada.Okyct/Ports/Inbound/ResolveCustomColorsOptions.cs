using Sandlada.Okyct.Domain.Models;

namespace Sandlada.Okyct.Ports.Inbound;

public sealed record ResolveCustomColorsOptions(
    ThemeMode Mode = ThemeMode.Dark, double ContrastLevel = 0, ContrastMetric ContrastMetric = ContrastMetric.Both,
    IReadOnlyList<StateLayer>? StateLayers = null, BlendSpace StateLayersBlendSpace = BlendSpace.Okyct,
    bool StateLayersContrastGuard = false);
