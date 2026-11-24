using Sandlada.Okyct.Ports.Inbound;
using Sandlada.Okyct.Ports.Outbound;
using static Sandlada.Okyct.Domain.Services.ColorScience;

namespace Sandlada.Okyct.Adapters;

public sealed partial class DisplayPhysics : IDisplayPhysicsPort
{
    public EmissivePanelSpec GetPanelSpec(EmissivePanelType profile) =>
        EmissivePanelSpecs.Default.TryGetValue(profile, out var spec)
            ? spec : throw new ArgumentOutOfRangeException(nameof(profile));

    public string ApplyBlueBurnInGuard(string hex, double maxBlueAttenuation = 0.22, double hueShiftDeg = 3)
    {
        if (!double.IsFinite(maxBlueAttenuation) || maxBlueAttenuation is < 0 or > 1)
            throw new ArgumentOutOfRangeException(nameof(maxBlueAttenuation));
        if (!double.IsFinite(hueShiftDeg) || hueShiftDeg < 0)
            throw new ArgumentOutOfRangeException(nameof(hueShiftDeg));

        var color = HexToOkyct(hex);
        if (color.C < 0.025) return hex;
        var distance = ShortestHueDelta(color.H, 265);
        if (distance >= 42) return hex;

        var weight = 0.5 * (1 + Math.Cos(distance / 42 * Math.PI));
        return OkyctToHex(color with { H = (color.H - hueShiftDeg * weight + 360) % 360,
            C = color.C * (1 - maxBlueAttenuation * weight) });
    }

    public string ApplySubpixelEdgeCompensation(string hex, EmissivePanelType profile, SchemeRoleKind roleKind)
    {
        var color = HexToOkyct(hex);
        if (profile == EmissivePanelType.AmoledAntiSmear && roleKind is SchemeRoleKind.Foreground or SchemeRoleKind.Accent)
        {
            var chroma = color.C > 0.14 ? 0.14 + (color.C - 0.14) * 0.78 : color.C;
            var tone = roleKind == SchemeRoleKind.Foreground ? Math.Min(97, color.T) : color.T;
            return OkyctToHex(color with { C = chroma, T = tone });
        }

        if (profile == EmissivePanelType.MicroOledXr)
        {
            if (roleKind == SchemeRoleKind.Foreground && color.T > 92)
                return OkyctToHex(color with { C = color.C * 0.9, T = 92 });
            if (roleKind == SchemeRoleKind.Accent && color.C > 0.15)
                return OkyctToHex(color with { C = color.C * 0.85, T = Math.Min(90, color.T) });
        }

        return hex;
    }
}
