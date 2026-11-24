using Sandlada.Okyct.Domain.Models;

namespace Sandlada.Okyct.Ports.Inbound;

public sealed record BuildDynamicSchemeOptions(
    ThemeMode Mode = ThemeMode.Dark,
    double ContrastLevel = 0,
    ContrastMetric ContrastMetric = ContrastMetric.Both,
    AmbientSurround Ambient = AmbientSurround.Normal,
    EmissiveSchemeOptions? Emissive = null,
    IReadOnlyList<StateLayer>? StateLayers = null,
    BlendSpace StateLayersBlendSpace = BlendSpace.Okyct,
    bool StateLayersContrastGuard = false);
