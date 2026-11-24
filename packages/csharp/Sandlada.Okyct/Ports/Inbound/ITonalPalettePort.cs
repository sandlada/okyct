using Sandlada.Okyct.Domain.Models;

namespace Sandlada.Okyct.Ports.Inbound;

public interface ITonalPalettePort
{
    double Hue { get; }
    double TargetChroma { get; }
    GamutTarget Gamut { get; }
    OkyctColor ToneOkyct(double tone, GamutTarget? gamut = null);
    string Tone(double tone);
    string ToneCss(double tone, CssColorFormat format = CssColorFormat.Oklch);
    IReadOnlyDictionary<int, string> GetAllTones();
}
