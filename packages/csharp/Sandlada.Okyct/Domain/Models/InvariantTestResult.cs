namespace Sandlada.Okyct.Domain.Models;

public sealed record InvariantTestResult(
    string Id,
    string Name,
    string Formula,
    bool Passed,
    string MeasuredValue,
    string Threshold,
    int SamplesChecked,
    string Details);
