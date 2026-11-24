using Sandlada.Okyct.Domain.Models;

namespace Sandlada.Okyct.Ports.Inbound;

public record TonalPaletteOptions(
    GamutTarget Gamut = GamutTarget.Srgb,
    bool HkCompensation = false,
    bool SoftKnee = true,
    int MaxCacheSize = 256);
