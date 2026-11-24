using Sandlada.Okyct.Domain.Models;
using Sandlada.Okyct.Ports.Inbound;
using static Sandlada.Okyct.Domain.Services.ColorScience;

namespace Sandlada.Okyct.Application;

public sealed class TonalPalette : ITonalPalettePort
{
    private readonly object _cacheLock = new();
    private readonly OrderedDictionary<double, string> _hexCache = new();
    private readonly OrderedDictionary<(GamutTarget Gamut, double Tone), OkyctColor> _colorCache = new();

    public TonalPalette(double hue, double targetChroma, TonalPaletteOptions? options = null)
    {
        ArgumentOutOfRangeException.ThrowIfNegative(targetChroma);
        if (!double.IsFinite(hue) || !double.IsFinite(targetChroma))
            throw new ArgumentException("Expected finite hue and chroma.");

        options ??= new();
        if (!Enum.IsDefined(options.Gamut)) throw new ArgumentOutOfRangeException(nameof(options));
        ArgumentOutOfRangeException.ThrowIfNegative(options.MaxCacheSize);

        Hue = ((hue % 360) + 360) % 360;
        TargetChroma = targetChroma;
        Gamut = options.Gamut;
        HkCompensation = options.HkCompensation;
        SoftKnee = options.SoftKnee;
        MaxCacheSize = options.MaxCacheSize;
    }

    public double Hue { get; }
    public double TargetChroma { get; }
    public GamutTarget Gamut { get; }
    public bool HkCompensation { get; }
    public bool SoftKnee { get; }
    public int MaxCacheSize { get; }

    public int CacheSize
    {
        get { lock (_cacheLock) return _hexCache.Count + _colorCache.Count; }
    }

    public static TonalPalette FromHex(string hex, TonalPaletteOptions? options = null)
    {
        options ??= new();
        if (!Enum.IsDefined(options.Gamut)) throw new ArgumentOutOfRangeException(nameof(options));
        var color = HexToOkyct(hex);
        var chroma = color.C;

        if (chroma > 0.025 && (color.T < 22 || color.T > 82))
        {
            var conversion = new ColorConversionOptions(options.Gamut);
            var maxAtSeed = FindMaxChromaForTone(color.H, color.T, conversion);
            var cusp = FindGamutCusp(color.H, conversion);
            if (maxAtSeed > 1e-4 && cusp.Chroma > maxAtSeed)
            {
                var saturation = Math.Min(1, chroma / maxAtSeed);
                var extremity = color.T < 22
                    ? Palettes.Smoothstep(22, 6, color.T)
                    : Palettes.Smoothstep(82, 96, color.T);
                var deattenuated = saturation * cusp.Chroma * 0.72;
                chroma += (Math.Max(chroma, deattenuated) - chroma) * extremity;
            }
        }

        return new TonalPalette(color.H, chroma, options);
    }

    public OkyctColor ToneOkyct(double tone, GamutTarget? gamut = null)
    {
        var target = gamut ?? Gamut;
        if (!Enum.IsDefined(target)) throw new ArgumentOutOfRangeException(nameof(gamut));
        var clamped = ClampTone(tone);
        lock (_cacheLock)
        {
            return GetOrCreate(_colorCache, (target, clamped), () => CalculateColor(clamped, target));
        }
    }

    public string Tone(double tone)
    {
        var clamped = ClampTone(tone);
        lock (_cacheLock)
        {
            return GetOrCreate(_hexCache, clamped, () => clamped switch
            {
                <= 0.001 => "#000000",
                >= 99.999 => "#ffffff",
                _ => OkyctToHex(ToneOkyct(clamped, GamutTarget.Srgb))
            });
        }
    }

    public string ToneCss(double tone, CssColorFormat format = CssColorFormat.Oklch) => format switch
    {
        CssColorFormat.Hex => Tone(tone),
        CssColorFormat.Oklch => OkyctToOklchCss(ToneOkyct(tone)),
        CssColorFormat.DisplayP3 => OkyctToDisplayP3Css(ToneOkyct(tone, GamutTarget.DisplayP3)),
        _ => throw new ArgumentOutOfRangeException(nameof(format))
    };

    public IReadOnlyDictionary<int, string> GetAllTones() =>
        StandardTones.Values.ToDictionary(tone => tone, tone => Tone(tone));

    private OkyctColor CalculateColor(double tone, GamutTarget gamut)
    {
        if (tone <= 0.001) return new OkyctColor(Hue, 0, 0);
        if (tone >= 99.999) return new OkyctColor(Hue, 0, 100);

        var effectiveTone = HkCompensation ? Math.Max(1, tone - ComputeHkToneDelta(tone)) : tone;
        var darkRoll = effectiveTone < 18 ? Palettes.Smoothstep(0, 18, effectiveTone) : 1;
        var lightRoll = effectiveTone > 85 ? Palettes.Smoothstep(100, 85, effectiveTone) : 1;
        var chroma = TargetChroma * darkRoll * lightRoll;
        if (effectiveTone < 45 && chroma > 0.02)
        {
            var distance = Math.Abs(((Hue - 100 + 540) % 360) - 180);
            if (distance < 28)
            {
                var hueWeight = 0.5 + 0.5 * Math.Cos(distance / 28 * Math.PI);
                chroma *= 1 - 0.35 * hueWeight * Palettes.Smoothstep(45, 10, effectiveTone);
            }
        }

        var maxChroma = FindMaxChromaForTone(Hue, effectiveTone, new ColorConversionOptions(gamut));
        var result = SoftKnee ? ApplySoftKnee(chroma, maxChroma) : Math.Min(chroma, maxChroma);
        return new OkyctColor(Hue, result, effectiveTone);
    }

    private double ComputeHkToneDelta(double tone)
    {
        if (TargetChroma <= 0.02 || tone <= 5 || tone >= 95) return 0;
        var rad = Hue * Math.PI / 180;
        var bluePurpleBoost = 0.5 + 0.5 * Math.Cos(rad - 265 * Math.PI / 180);
        var redBoost = 0.5 + 0.5 * Math.Cos(rad - 25 * Math.PI / 180);
        var hueWeight = 0.45 + 0.55 * Math.Max(bluePurpleBoost, redBoost * 0.75);
        var midBell = Palettes.Smoothstep(5, 35, tone) * Palettes.Smoothstep(95, 65, tone);
        return Math.Min(6, TargetChroma * 22 * hueWeight * midBell);
    }

    private static double ApplySoftKnee(double chroma, double maxChroma)
    {
        if (maxChroma <= 0 || chroma <= 0) return 0;
        var knee = 0.8 * maxChroma;
        if (chroma <= knee) return chroma;
        var headroom = maxChroma - knee;
        var excess = chroma - knee;
        return knee + headroom * (excess / (excess + headroom));
    }

    private static double ClampTone(double tone)
    {
        if (!double.IsFinite(tone)) throw new ArgumentOutOfRangeException(nameof(tone));
        return Math.Clamp(tone, 0, 100);
    }

    private TValue GetOrCreate<TKey, TValue>(OrderedDictionary<TKey, TValue> cache, TKey key, Func<TValue> create)
        where TKey : notnull
    {
        if (MaxCacheSize == 0) return create();
        if (cache.TryGetValue(key, out var found))
        {
            cache.Remove(key);
            cache.Add(key, found);
            return found;
        }

        var value = create();
        if (cache.Count >= MaxCacheSize) cache.RemoveAt(0);
        cache.Add(key, value);
        return value;
    }
}
