using Sandlada.Okyct.Domain.Models;

namespace Sandlada.Okyct.Ports.Inbound;

public sealed record CompositedResult(
    string BaseColor, int TotalLayers, string FinalHex, OkyctColor FinalOkyct,
    IReadOnlyList<LayerStepTrace> Traces, BlendSpace BlendSpace);
