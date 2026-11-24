using Sandlada.Okyct.Domain.Models;

namespace Sandlada.Okyct.Ports.Inbound;

public sealed record AuditSchemeCvdOptions(IReadOnlyList<CvdType>? CvdTypes = null,
    double Severity = 1, double MinDeltaE = 0.06, double MinDeltaTone = 12);
