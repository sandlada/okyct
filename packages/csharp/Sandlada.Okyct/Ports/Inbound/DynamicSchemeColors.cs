using Sandlada.Okyct.Domain.Models;

namespace Sandlada.Okyct.Ports.Inbound;

public sealed record DynamicSchemeColors(
    IReadOnlyDictionary<string, string> Colors,
    IReadOnlyDictionary<string, double> Tones,
    IReadOnlyDictionary<string, OkyctColor> Okyct,
    IReadOnlyDictionary<string, string>? StateLayers = null)
{
    public string this[string token] => Colors[token];
}
