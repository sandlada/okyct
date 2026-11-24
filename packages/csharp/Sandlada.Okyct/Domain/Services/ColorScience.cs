using System.Globalization;
using System.Numerics;
using Sandlada.Okyct.Domain.Models;

namespace Sandlada.Okyct.Domain.Services;

public static partial class ColorScience
{
    private const double CieKappa = 24389.0 / 27.0;
    private const double CieEpsilon = 216.0 / 24389.0;
    private const double RadToDeg = 180 / Math.PI;
    private const double DegToRad = Math.PI / 180;
    private const double GamutTolerance = 1e-5;
    private const double ApcaBlkThrs = 0.022;
    private const double ApcaBlkClmp = 1.414;
    private const double ApcaLoClip = 0.1;
    private const double ApcaLoConOffset = 0.027;
    private const double ApcaScale = 1.14;

    private static readonly double[] SrgbByteToLinearLut = Enumerable.Range(0, 256)
        .Select(value => {
            var channel = value / 255.0;
            return channel <= 0.04045 ? channel / 12.92 : Math.Pow((channel + 0.055) / 1.055, 2.4);
        })
        .ToArray();

    public static double ToneToY(double tone)
    {
        RequireFinite(tone, nameof(tone));
        if (tone <= 0) return 0;
        if (tone >= 100) return 1;
        if (tone <= 8) return tone / CieKappa;
        var root = (tone + 16) / 116;
        return root * root * root;
    }

    public static double YToTone(double y)
    {
        RequireFinite(y, nameof(y));
        if (y <= 0) return 0;
        if (y >= 1) return 100;
        return y <= CieEpsilon ? y * CieKappa : Math.Min(100, 116 * Math.Cbrt(y) - 16);
    }

    public static double SrgbToLinear(double channel)
    {
        RequireFinite(channel, nameof(channel));
        if (channel == 1) return 1;
        return channel <= 0.04045 ? channel / 12.92 : Math.Pow((channel + 0.055) / 1.055, 2.4);
    }

    public static double LinearToSrgb(double channel)
    {
        RequireFinite(channel, nameof(channel));
        if (channel == 1) return 1;
        return channel <= 0.0031308
            ? 12.92 * channel
            : 1.055 * (Math.Pow(Math.Max(0, channel), 1 / 2.4) - 1) + 1;
    }

    public static double ShortestHueDelta(double first, double second)
    {
        RequireFinite(first, nameof(first));
        RequireFinite(second, nameof(second));
        var difference = Math.Abs(first - second) % 360;
        return difference > 180 ? 360 - difference : difference;
    }

    public static Rgb HexToRgb(string hex)
    {
        var packed = ParseHexToRgb24(hex);
        return new Rgb(((packed >> 16) & 255) / 255.0, ((packed >> 8) & 255) / 255.0, (packed & 255) / 255.0);
    }

    public static string RgbToHex(Rgb rgb)
    {
        ValidateRgb(rgb);
        return PackHex(ChannelToByte(rgb.R), ChannelToByte(rgb.G), ChannelToByte(rgb.B));
    }

    public static OkyctColor RgbToOkyct(Rgb rgb)
    {
        ValidateRgb(rgb);
        if (rgb.R == rgb.G && rgb.G == rgb.B)
        {
            return new OkyctColor(0, 0, YToTone(SrgbToLinear(rgb.R)));
        }

        return FromLinearRgb(new Rgb(SrgbToLinear(rgb.R), SrgbToLinear(rgb.G), SrgbToLinear(rgb.B)));
    }

    public static OkyctColor HexToOkyct(string hex)
    {
        var packed = ParseHexToRgb24(hex);
        var r = (packed >> 16) & 255;
        var g = (packed >> 8) & 255;
        var b = packed & 255;
        return r == g && g == b
            ? new OkyctColor(0, 0, YToTone(SrgbByteToLinearLut[r]))
            : FromLinearRgb(new Rgb(SrgbByteToLinearLut[r], SrgbByteToLinearLut[g], SrgbByteToLinearLut[b]));
    }

    public static GamutCheckResult IsInSrgbGamut(OkyctColor color) => IsInGamut(color);

    public static GamutCheckResult IsInSrgbGamut(double hue, double chroma, double tone) =>
        IsInGamut(new OkyctColor(hue, chroma, tone));

    private static OkyctColor FromLinearRgb(Rgb rgb)
    {
        var xyz = LinearRgbToXyz(rgb);
        var lab = XyzToOklab(xyz);
        var chroma = double.Hypot(lab.A, lab.B);
        var tone = YToTone(xyz.Y);
        if (chroma < 1e-7) return new OkyctColor(0, 0, tone);
        var hue = Math.Atan2(lab.B, lab.A) * RadToDeg;
        return new OkyctColor(hue < 0 ? hue + 360 : hue, chroma, tone);
    }

    private static double ResolveToneInput(ColorToneInput input)
    {
        var tone = input.Hex is { } hex ? HexToOkyct(hex).T : input.Tone;
        if (!double.IsFinite(tone) || tone is < 0 or > 100)
        {
            throw new ArgumentOutOfRangeException(nameof(input), "Expected a finite tone in [0, 100].");
        }
        return tone;
    }

    private static int ParseHexToRgb24(string hex)
    {
        ArgumentNullException.ThrowIfNull(hex);
        var digits = TrimAsciiWhitespace(hex.AsSpan());
        if (!digits.IsEmpty && digits[0] == '#') digits = digits[1..];
        if (digits.Length is not (3 or 6))
        {
            throw new ArgumentException("Expected #RGB or #RRGGBB hexadecimal string.", nameof(hex));
        }

        var value = 0;
        foreach (var character in digits)
        {
            var nibble = character switch
            {
                >= '0' and <= '9' => character - '0',
                >= 'a' and <= 'f' => character - 'a' + 10,
                >= 'A' and <= 'F' => character - 'A' + 10,
                _ => throw new ArgumentException("Expected #RGB or #RRGGBB hexadecimal string.", nameof(hex))
            };
            value = digits.Length == 3 ? (value << 8) | (nibble * 17) : (value << 4) | nibble;
        }
        return value;
    }

    internal static bool IsAsciiWhitespace(char character) =>
        character is ' ' or '\t' or '\n' or '\r' or '\f';

    internal static ReadOnlySpan<char> TrimAsciiWhitespace(ReadOnlySpan<char> span)
    {
        var start = 0;
        var end = span.Length - 1;
        while (start <= end && IsAsciiWhitespace(span[start])) start++;
        while (end >= start && IsAsciiWhitespace(span[end])) end--;
        return start > end ? ReadOnlySpan<char>.Empty : span[start..(end + 1)];
    }

    internal static string TrimAsciiWhitespace(string text)
    {
        var trimmed = TrimAsciiWhitespace(text.AsSpan());
        return trimmed.Length == text.Length ? text : new string(trimmed);
    }

    private static string PackHex(int r, int g, int b) => $"#{(r << 16 | g << 8 | b):x6}";

    private static int ChannelToByte(double channel) => (int)(Math.Clamp(channel, 0, 1) * 255 + 0.5);

    private static void ValidateRgb(Rgb rgb)
    {
        if (!double.IsFinite(rgb.R) || !double.IsFinite(rgb.G) || !double.IsFinite(rgb.B))
        {
            throw new ArgumentException("Expected finite numeric RGB channels.", nameof(rgb));
        }
    }

    private static void RequireFinite(double value, string parameter)
    {
        if (!double.IsFinite(value)) throw new ArgumentOutOfRangeException(parameter, "Expected a finite number.");
    }

    internal static double RoundToInteger(double value)
    {
        var lower = Math.Floor(value);
        return value - lower < 0.5 ? lower : lower + 1;
    }

    // Round the exact binary double for ECMAScript toFixed midpoint semantics.
    internal static string ToFixed(double value, int digits)
    {
        if (!double.IsFinite(value) || Math.Abs(value) >= 1e21)
            return value.ToString("G", CultureInfo.InvariantCulture);

        var bits = (ulong)BitConverter.DoubleToInt64Bits(Math.Abs(value));
        var exponent = (int)(bits >> 52);
        var mantissa = bits & 0x000F_FFFF_FFFF_FFFF;
        if (exponent != 0) mantissa |= 1UL << 52;
        var shift = Math.Max(1, exponent) - 1075;
        var scaled = new BigInteger(mantissa) * BigInteger.Pow(10, digits);
        if (shift < 0)
        {
            var divisor = BigInteger.One << -shift;
            scaled = BigInteger.DivRem(scaled, divisor, out var remainder);
            if (remainder * 2 >= divisor) scaled++;
        }
        else
        {
            scaled <<= shift;
        }

        var text = scaled.ToString(CultureInfo.InvariantCulture).PadLeft(digits + 1, '0');
        if (digits > 0) text = text.Insert(text.Length - digits, ".");
        return value < 0 ? "-" + text : text;
    }

    private static string ToExponential(double value, int digits) =>
        value.ToString("0." + new string('0', digits) + "e+0", CultureInfo.InvariantCulture);
}
