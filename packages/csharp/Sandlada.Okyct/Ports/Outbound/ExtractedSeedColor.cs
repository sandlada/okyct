using Sandlada.Okyct.Domain.Models;

namespace Sandlada.Okyct.Ports.Outbound;

public sealed record ExtractedSeedColor(
    string Hex, OkyctColor Okyct, double PopulationRatio, double SalienceScore, bool? IsFallback = null);
