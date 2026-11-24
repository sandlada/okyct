namespace Sandlada.Okyct.Ports.Inbound;

public sealed record StackedContrastReport(
    string ForegroundHex, string FinalBackgroundHex, double WcagRatio, bool WcagPassAA, bool WcagPassAAA,
    double ApcaLc, double DeltaToneFromBase, string? WarningMessage, double? RecommendedCompensationTone);
