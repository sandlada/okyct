namespace Sandlada.Okyct.Ports.Inbound;

public sealed record EmissiveSchemeOptions(
    EmissivePanelType Profile = EmissivePanelType.StandardLcd,
    bool BurnInGuard = false,
    bool AntiFringing = false,
    bool AblGuard = false);
