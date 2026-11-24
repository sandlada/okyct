namespace Sandlada.Okyct.Ports.Inbound;

public sealed record ContrastAuditItem(string FgRole, string BgRole, double FgTone, double BgTone,
    double WcagRatio, bool WcagPassAA, bool WcagPassAAA, double ApcaLc, bool ApcaPass);
