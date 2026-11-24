namespace Sandlada.Okyct;

public sealed record ArchitectureAuditResult(IReadOnlyList<ArchitectureViolation> Violations)
{
    public bool Passed => Violations.Count == 0;
}
