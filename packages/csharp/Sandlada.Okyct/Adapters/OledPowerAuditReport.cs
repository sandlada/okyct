namespace Sandlada.Okyct.Adapters;

public sealed record OledPowerAuditReport(bool Passed, double AveragePowerMw, double AverageAplPercent,
    string MaxBlueStressToken, double MaxBlueStressIndex, int TrueBlackTokenCount, int NearBlackTokenCount,
    int TotalTokensEvaluated);
