namespace Sandlada.Okyct.Ports.Inbound;

public sealed record ResolvedCustomColor(
    string Id, string Name, string Label, string SourceHex, string HarmonizedHex, double HueShiftDeg,
    string Color, string OnColor, string ColorContainer, string OnColorContainer,
    double WcagRatioColor, double WcagRatioContainer, double ApcaLcColor, double ApcaLcContainer,
    IReadOnlyDictionary<string, string>? StateLayers = null);
