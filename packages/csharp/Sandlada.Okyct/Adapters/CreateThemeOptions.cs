using Sandlada.Okyct.Domain.Models;
using Sandlada.Okyct.Ports.Inbound;

namespace Sandlada.Okyct.Adapters;

public sealed record CreateThemeOptions(string SourceHex, PaletteVariant Variant = PaletteVariant.TonalSpot,
    bool HarmonizeSemantics = true, double ContrastLevel = 0, ContrastMetric ContrastMetric = ContrastMetric.Both,
    AmbientSurround Ambient = AmbientSurround.Normal, GamutTarget Gamut = GamutTarget.Srgb,
    bool HkCompensation = false, bool SoftKnee = true, EmissiveSchemeOptions? Emissive = null,
    IReadOnlyList<CustomColorInput>? CustomColors = null, IReadOnlyList<StateLayer>? StateLayers = null,
    BlendSpace StateLayersBlendSpace = BlendSpace.Okyct, bool StateLayersContrastGuard = false);
