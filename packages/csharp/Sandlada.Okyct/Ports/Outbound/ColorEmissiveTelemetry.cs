using Sandlada.Okyct.Domain.Models;

namespace Sandlada.Okyct.Ports.Outbound;

public sealed record ColorEmissiveTelemetry(string Hex, double RLinear, double GLinear, double BLinear,
    double PowerMw, Rgb ChannelPowerMw, double AplPercent, double BlueStressIndex, bool IsPixelOff,
    EmitterState EmitterState);
