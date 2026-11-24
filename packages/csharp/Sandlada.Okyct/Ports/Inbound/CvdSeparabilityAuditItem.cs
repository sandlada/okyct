using Sandlada.Okyct.Domain.Models;

namespace Sandlada.Okyct.Ports.Inbound;

public sealed record CvdSeparabilityAuditItem(
    string RoleA, string RoleB, CvdType CvdType, double DeltaEOklab, double DeltaTone,
    bool Separable, string Recommendation);
