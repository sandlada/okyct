using System.Collections;
using System.Globalization;
using System.Text;

namespace Sandlada.Okyct.Adapters;

internal static class CanonicalJsonWriter
{
    public static string Serialize(object value)
    {
        var builder = new StringBuilder(1024);
        WriteValue(builder, value, 0);
        return builder.ToString();
    }

    private static void WriteValue(StringBuilder builder, object? value, int depth)
    {
        switch (value)
        {
            case null:
                builder.Append("null");
                break;
            case string text:
                WriteString(builder, text);
                break;
            case IEnumerable<KeyValuePair<string, string>> stringMap:
                WriteObject(builder, stringMap.Select(pair => new KeyValuePair<string, object?>(pair.Key, pair.Value)), depth);
                break;
            case IEnumerable<KeyValuePair<string, object>> objectMap:
                WriteObject(builder, objectMap.Select(pair => new KeyValuePair<string, object?>(pair.Key, pair.Value)), depth);
                break;
            case IDictionary dictionary:
                var entries = new List<KeyValuePair<string, object?>>();
                foreach (DictionaryEntry entry in dictionary)
                {
                    entries.Add(new KeyValuePair<string, object?>((string)entry.Key, entry.Value));
                }
                WriteObject(builder, entries, depth);
                break;
            default:
                throw new NotSupportedException($"Unsupported canonical JSON value type: {value.GetType().FullName}");
        }
    }

    private static void WriteObject(StringBuilder builder, IEnumerable<KeyValuePair<string, object?>> properties, int depth)
    {
        var ordered = properties
            .OrderBy(pair =>
                uint.TryParse(pair.Key, NumberStyles.None, CultureInfo.InvariantCulture, out var index) &&
                index < uint.MaxValue &&
                pair.Key == index.ToString(CultureInfo.InvariantCulture)
                    ? index
                    : uint.MaxValue)
            .ToArray();

        if (ordered.Length == 0)
        {
            builder.Append("{}");
            return;
        }

        builder.Append("{\n");
        var childIndent = new string(' ', (depth + 1) * 2);
        for (var i = 0; i < ordered.Length; i++)
        {
            builder.Append(childIndent);
            WriteString(builder, ordered[i].Key);
            builder.Append(": ");
            WriteValue(builder, ordered[i].Value, depth + 1);
            if (i + 1 < ordered.Length)
            {
                builder.Append(',');
            }
            builder.Append('\n');
        }
        builder.Append(' ', depth * 2);
        builder.Append('}');
    }

    internal static void WriteString(StringBuilder builder, string value)
    {
        builder.Append('"');
        for (var i = 0; i < value.Length; i++)
        {
            var c = value[i];
            switch (c)
            {
                case '"':
                    builder.Append("\\\"");
                    break;
                case '\\':
                    builder.Append("\\\\");
                    break;
                case '\b':
                    builder.Append("\\b");
                    break;
                case '\f':
                    builder.Append("\\f");
                    break;
                case '\n':
                    builder.Append("\\n");
                    break;
                case '\r':
                    builder.Append("\\r");
                    break;
                case '\t':
                    builder.Append("\\t");
                    break;
                default:
                    if (c < ' ')
                    {
                        builder.Append("\\u");
                        builder.Append(((int)c).ToString("x4", CultureInfo.InvariantCulture));
                    }
                    else if (char.IsHighSurrogate(c))
                    {
                        if (i + 1 < value.Length && char.IsLowSurrogate(value[i + 1]))
                        {
                            builder.Append(c);
                            builder.Append(value[++i]);
                        }
                        else
                        {
                            builder.Append("\\u");
                            builder.Append(((int)c).ToString("x4", CultureInfo.InvariantCulture));
                        }
                    }
                    else if (char.IsLowSurrogate(c))
                    {
                        builder.Append("\\u");
                        builder.Append(((int)c).ToString("x4", CultureInfo.InvariantCulture));
                    }
                    else
                    {
                        builder.Append(c);
                    }
                    break;
            }
        }
        builder.Append('"');
    }
}
