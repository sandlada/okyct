using Sandlada.Okyct.Ports.Inbound;
using static Sandlada.Okyct.Domain.Services.ColorScience;

namespace Sandlada.Okyct.Adapters;

public sealed partial class DisplayPhysics
{
    public string ApplyEmissiveProfileToTokenHex(string key, string hex, EmissiveSchemeOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);
        ArgumentNullException.ThrowIfNull(hex);
        var spec = GetPanelSpec(options.Profile);
        if (!TokenOperators.HexPattern().IsMatch(TrimAsciiWhitespace(hex.AsSpan()))) return hex;

        var name = key.ToLowerInvariant();
        var color = HexToOkyct(hex);
        var tone = color.T;
        var floors = spec.DarkSurfaceTones;
        if (tone <= 28 && (name.Contains("surface") || name.Contains("background")))
        {
            tone = name.Contains("lowest") ? floors.Lowest : name.Contains("low") ? floors.Low :
                name.Contains("highest") ? floors.Highest : name.Contains("high") ? floors.High :
                name.Contains("bright") ? floors.Bright : name.Contains("container") ? floors.Container : floors.Surface;
        }
        else if (tone > spec.LightPeakToneCap)
        {
            tone = spec.LightPeakToneCap;
        }

        var output = tone == 0 ? "#000000" : OkyctToHex(color with { T = tone });
        if (options.BurnInGuard) output = ApplyBlueBurnInGuard(output);
        if (options.AntiFringing)
        {
            var role = name.Contains("on") ? SchemeRoleKind.Foreground :
                name.Contains("surface") ? SchemeRoleKind.Surface : SchemeRoleKind.Accent;
            output = ApplySubpixelEdgeCompensation(output, options.Profile, role);
        }
        return output;
    }
}
