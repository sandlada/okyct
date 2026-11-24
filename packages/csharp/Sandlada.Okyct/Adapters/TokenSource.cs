using Sandlada.Okyct.Ports.Inbound;

namespace Sandlada.Okyct.Adapters;

public sealed class TokenSource
{
    private readonly IReadOnlyDictionary<string, string>? _dictionary;
    private readonly DynamicSchemeColors? _scheme;

    public TokenSource(IReadOnlyDictionary<string, string> dictionary) =>
        _dictionary = dictionary ?? throw new ArgumentNullException(nameof(dictionary));

    public TokenSource(DynamicSchemeColors scheme) =>
        _scheme = scheme ?? throw new ArgumentNullException(nameof(scheme));

    public static implicit operator TokenSource(Dictionary<string, string> dictionary) => new(dictionary);
    public static implicit operator TokenSource(DynamicSchemeColors scheme) => new(scheme);

    internal IReadOnlyDictionary<string, string> Normalize()
    {
        if (_scheme is not null) return TokenOperators.ToTokenDictionary(_scheme);
        foreach (var (key, value) in _dictionary!)
            if (value is null) throw new ArgumentException($"Expected a string value for {key}.");
        return _dictionary!;
    }
}
