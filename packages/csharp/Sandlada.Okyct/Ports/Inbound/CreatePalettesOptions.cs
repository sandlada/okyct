using Sandlada.Okyct.Domain.Models;

namespace Sandlada.Okyct.Ports.Inbound;

public sealed record CreatePalettesOptions(
    PaletteVariant Variant = PaletteVariant.TonalSpot,
    bool HarmonizeSemantics = true,
    GamutTarget Gamut = GamutTarget.Srgb,
    bool HkCompensation = false,
    bool SoftKnee = true,
    int MaxCacheSize = 256) : TonalPaletteOptions(Gamut, HkCompensation, SoftKnee, MaxCacheSize);
