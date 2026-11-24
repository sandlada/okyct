using Sandlada.Okyct.Domain.Models;
using Sandlada.Okyct.Ports.Inbound;

namespace Sandlada.Okyct.Ports.Outbound;

public sealed record SchemeEmissiveReport(EmissivePanelType Profile, EmissivePanelSpec Spec, double EstimatedTotalPowerMw,
    double PowerSavingsVsLcdPct, Rgb ChannelPowerBreakdownMw, double AplPercent, string AblTriggerRisk,
    double BlueSubpixelStressIndex, double SmearRiseTimeMs, string BlackSmearRisk, string PentileFringingRisk,
    double PixelOffRatioPct, double MinWcagContrastAfterOpt, ContrastRolePair MinWcagContrastPair);
