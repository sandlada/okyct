namespace Sandlada.Okyct.Ports.Inbound;

public sealed record CustomColorInput(string Name, string SourceHex, string? Id = null, string? Label = null, bool Harmonize = true);
