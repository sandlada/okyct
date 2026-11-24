using Sandlada.Okyct.Domain.Models;

namespace Sandlada.Okyct.Ports.Inbound;

public sealed record PaletteSet<T>(
    T Primary, T Secondary, T Tertiary, T Neutral, T NeutralVariant,
    T Error, T Warning, T Success, T Info) where T : ITonalPalettePort;
