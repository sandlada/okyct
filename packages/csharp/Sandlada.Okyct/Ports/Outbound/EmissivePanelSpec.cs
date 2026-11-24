using Sandlada.Okyct.Ports.Inbound;

namespace Sandlada.Okyct.Ports.Outbound;

public sealed record EmissivePanelSpec(
    EmissivePanelType Id, string Name, string ShortName, string Badge,
    SubpixelGeometry SubpixelGeometry, string GeometryLabel, string Description,
    DarkSurfaceTones DarkSurfaceTones, double LightPeakToneCap, double SmearRiseTimeMs);
