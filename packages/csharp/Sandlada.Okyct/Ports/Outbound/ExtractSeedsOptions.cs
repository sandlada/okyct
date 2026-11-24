namespace Sandlada.Okyct.Ports.Outbound;

public sealed record ExtractSeedsOptions(
    double MaxColors = 4,
    ImageQuantizerMode Mode = ImageQuantizerMode.HueToneGrid,
    double MinHueDistance = 28,
    double MinToneDistance = 22);
