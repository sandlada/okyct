using Sandlada.Okyct.Domain.Models;

namespace Sandlada.Okyct.Ports.Inbound;

public sealed record LayerStepTrace(
    int StepIndex, string Label, string LayerColor, double LayerOpacity, string AccumulatedHex,
    OkyctColor AccumulatedOkyct, double WcagContrastWithWhite, double WcagContrastWithBlack);
