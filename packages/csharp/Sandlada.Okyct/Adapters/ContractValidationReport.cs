namespace Sandlada.Okyct.Adapters;

public sealed record ContractValidationReport(bool Valid, IReadOnlyList<string> MissingKeys,
    IReadOnlyList<string> ExtraKeys, int TotalChecked);
