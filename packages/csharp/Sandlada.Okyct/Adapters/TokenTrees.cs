using System.Globalization;

namespace Sandlada.Okyct.Adapters;

public static partial class TokenOperators
{
    private const string LeafKey = "$value";

    public static Func<TokenSource, Dictionary<string, object>> NestTokens(string delimiter = "-")
    {
        ArgumentException.ThrowIfNullOrEmpty(delimiter);
        return source =>
        {
            var root = new Dictionary<string, object>(StringComparer.Ordinal);
            var slots = new HashSet<string>(StringComparer.Ordinal);
            foreach (var (key, token) in Entries(source))
            {
                var parts = StripPrefix(key).Split(delimiter, StringSplitOptions.RemoveEmptyEntries);
                if (parts.Length == 0 || parts.Any(part => part is "__proto__" or "constructor" or "prototype"))
                    throw new ArgumentException($"Invalid token path for {key}.");

                var slot = string.Join('\0', parts) + (parts[^1] == LeafKey ? "" : "\0" + LeafKey);
                if (!slots.Add(slot)) throw new ArgumentException($"Token path collision: {key}.");

                var current = root;
                for (var i = 0; i < parts.Length - 1; i++)
                {
                    var part = parts[i];
                    var previous = current.GetValueOrDefault(part);
                    if (previous is not Dictionary<string, object> branch)
                    {
                        branch = new Dictionary<string, object>(StringComparer.Ordinal);
                        if (previous is not null) branch[LeafKey] = previous;
                        current[part] = branch;
                    }
                    current = branch;
                }

                if (current.GetValueOrDefault(parts[^1]) is Dictionary<string, object> existing)
                    existing[LeafKey] = token;
                else
                    current[parts[^1]] = token;
            }
            return root;
        };
    }

    public static Func<IReadOnlyDictionary<string, object>, Dictionary<string, string>> FlattenTokens(string delimiter = "-")
    {
        ArgumentException.ThrowIfNullOrEmpty(delimiter);
        return tree =>
        {
            ArgumentNullException.ThrowIfNull(tree);
            var result = new Dictionary<string, string>(StringComparer.Ordinal);
            void Visit(IReadOnlyDictionary<string, object> node, string? parent)
            {
                foreach (var (key, value) in Entries(node))
                {
                    if (key.StartsWith('$')) continue;
                    var path = parent is null ? key : parent + delimiter + key;
                    if (value is IReadOnlyDictionary<string, object> branch)
                    {
                        if (branch.TryGetValue(LeafKey, out var leaf)) result[path] = FormatLeaf(leaf, path);
                        Visit(branch, path);
                    }
                    else
                    {
                        result[path] = FormatLeaf(value, path);
                    }
                }
            }
            Visit(tree, null);
            return result;
        };
    }

    private static string FormatLeaf(object value, string path) => value switch
    {
        string text => text,
        bool boolean => boolean ? "true" : "false",
        byte or sbyte or short or ushort or int or uint or long or ulong or float or double or decimal =>
            Convert.ToString(value, CultureInfo.InvariantCulture)!,
        _ => throw new ArgumentException($"Invalid token leaf at {path}.")
    };
}
