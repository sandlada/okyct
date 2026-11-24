namespace Sandlada.Okyct;

public static class ArchitectureGuard
{
    private const string Prefix = "Sandlada.Okyct";

    public static ArchitectureAuditResult VerifyHexagonalArchitectureBoundaries(
        IEnumerable<ArchitectureReference> references)
    {
        ArgumentNullException.ThrowIfNull(references);
        var violations = new List<ArchitectureViolation>();
        foreach (var reference in references.Distinct())
        {
            var sourceLayer = LayerOf(reference.Namespace);
            var targetLayer = LayerOf(reference.TargetNamespace);
            var rule = sourceLayer switch
            {
                "Domain" when targetLayer is "Ports" or "Application" or "Adapters" or "" =>
                    "forbidden-layer-dependency",
                "Ports" when targetLayer is "Application" or "Adapters" or "" =>
                    "forbidden-layer-dependency",
                "Ports" when targetLayer == "Domain" && !reference.TargetNamespace.StartsWith(Prefix + ".Domain.Models", StringComparison.Ordinal) =>
                    "ports-domain-services-reference",
                "Application" when targetLayer is "Adapters" or "" =>
                    "forbidden-layer-dependency",
                "Domain" when targetLayer is null && !IsPlatformAssembly(reference.TargetAssembly) =>
                    "external-dependency",
                _ => null
            };
            if (rule is not null) violations.Add(new ArchitectureViolation(reference, rule));
        }
        return new ArchitectureAuditResult(violations.AsReadOnly());
    }

    private static string? LayerOf(string name)
    {
        if (name == Prefix) return "";
        if (!name.StartsWith(Prefix + ".", StringComparison.Ordinal)) return null;
        var layer = name[(Prefix.Length + 1)..].Split('.')[0];
        return layer;
    }

    private static bool IsPlatformAssembly(string name) => name.StartsWith("System.", StringComparison.Ordinal) ||
        name is "System" or "mscorlib" or "netstandard";
}
