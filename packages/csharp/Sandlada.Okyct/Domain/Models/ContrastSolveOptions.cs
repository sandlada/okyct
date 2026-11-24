namespace Sandlada.Okyct.Domain.Models;

public sealed record ContrastSolveOptions(ContrastMetric Metric = ContrastMetric.Wcag, double? TargetLc = null);
