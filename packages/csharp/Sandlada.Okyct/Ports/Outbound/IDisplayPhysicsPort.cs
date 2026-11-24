using Sandlada.Okyct.Ports.Inbound;

namespace Sandlada.Okyct.Ports.Outbound;

public interface IDisplayPhysicsPort
{
    EmissivePanelSpec GetPanelSpec(EmissivePanelType profile);
    string ApplyBlueBurnInGuard(string hex, double maxBlueAttenuation = 0.22, double hueShiftDeg = 3);
    string ApplySubpixelEdgeCompensation(string hex, EmissivePanelType profile, SchemeRoleKind roleKind);
    ColorEmissiveTelemetry ComputeColorEmissiveTelemetry(string hex);
    SchemeEmissiveReport AnalyzeEmissiveSchemeMetrics(DynamicSchemeColors scheme, EmissivePanelType profile);
}
