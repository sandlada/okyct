using Sandlada.Okyct.Application;
using Sandlada.Okyct.Domain.Models;
using Sandlada.Okyct.Ports.Inbound;
using Sandlada.Okyct.Ports.Outbound;
using static Sandlada.Okyct.Domain.Services.ColorScience;

namespace Sandlada.Okyct.Adapters;

public sealed partial class DisplayPhysics
{
    private static readonly (string Role, double Weight)[] UiAreaWeights =
    [
        ("surface", 0.42), ("surfaceContainerLowest", 0.14), ("surfaceContainerLow", 0.12),
        ("surfaceContainer", 0.12), ("surfaceContainerHigh", 0.06), ("primary", 0.05),
        ("primaryContainer", 0.04), ("secondaryContainer", 0.02), ("onSurface", 0.02), ("onSurfaceVariant", 0.01)
    ];

    public ColorEmissiveTelemetry ComputeColorEmissiveTelemetry(string hex)
    {
        const double weightSum = 1.05 + 0.85 + 2.40;
        const double nearBlackLinearThreshold = 0.0005;
        var rgb = HexToRgb(hex);
        var r = SrgbToLinear(rgb.R);
        var g = SrgbToLinear(rgb.G);
        var b = SrgbToLinear(rgb.B);
        var off = rgb.R == 0 && rgb.G == 0 && rgb.B == 0;
        var nearBlack = !off && r < nearBlackLinearThreshold && g < nearBlackLinearThreshold && b < nearBlackLinearThreshold;
        var emitterState = off ? EmitterState.Off : nearBlack ? EmitterState.NearBlack : EmitterState.Active;
        static double Drive(double channel) => channel == 0 ? 0 : Math.Pow(channel, 1.08);
        var rd = Drive(r);
        var gd = Drive(g);
        var bd = Drive(b);
        var rp = rd * 1.05 / weightSum * 1000;
        var gp = gd * 0.85 / weightSum * 1000;
        var bp = bd * 2.40 / weightSum * 1000;
        var apl = (0.2126729 * r + 0.7151522 * g + 0.0721750 * b) * 100;
        var asymmetry = Math.Max(0, bd - (rd + gd) * 0.5 * 0.6);
        var blueStress = Math.Min(100, RoundToInteger((bd * 0.65 + asymmetry * 0.55) * 100));
        return new ColorEmissiveTelemetry(hex, r, g, b, RoundTenths(rp + gp + bp),
            new Rgb(RoundTenths(rp), RoundTenths(gp), RoundTenths(bp)), RoundTenths(apl), blueStress, off, emitterState);
    }

    public SchemeEmissiveReport AnalyzeEmissiveSchemeMetrics(DynamicSchemeColors scheme, EmissivePanelType profile)
    {
        const double lcdPower = 540;
        ArgumentNullException.ThrowIfNull(scheme);
        var spec = GetPanelSpec(profile);
        var lowest = DynamicSchemes.AuditSchemeContrast(scheme)
            .Where(item => item.FgRole != "outline").MinBy(item => item.WcagRatio)!;
        var minimumContrast = RoundToInteger(lowest.WcagRatio * 100) / 100;
        var pair = new ContrastRolePair(lowest.FgRole, lowest.BgRole);

        var r = 0.0;
        var g = 0.0;
        var b = 0.0;
        var apl = 0.0;
        var stress = 0.0;
        var off = 0.0;
        foreach (var (role, weight) in UiAreaWeights)
        {
            var telemetry = ComputeColorEmissiveTelemetry(scheme[role]);
            var factor = 1.0;
            if (profile == EmissivePanelType.WoledDesktop)
            {
                var peak = Math.Max(telemetry.RLinear, Math.Max(telemetry.GLinear, telemetry.BLinear));
                if (peak > 1e-6)
                {
                    var white = Math.Min(telemetry.RLinear, Math.Min(telemetry.GLinear, telemetry.BLinear));
                    factor -= 0.42 * (white / peak);
                }
            }
            r += telemetry.ChannelPowerMw.R * factor * weight;
            g += telemetry.ChannelPowerMw.G * factor * weight;
            b += telemetry.ChannelPowerMw.B * factor * weight;
            apl += telemetry.AplPercent * weight;
            stress += telemetry.BlueStressIndex * weight;
            if (telemetry.IsPixelOff) off += weight;
        }

        if (profile == EmissivePanelType.StandardLcd)
            return new SchemeEmissiveReport(profile, spec, lcdPower, 0, new Rgb(180, 180, 180), RoundTenths(apl),
                "Low", RoundToInteger(stress), spec.SmearRiseTimeMs, "None", "Low", 0, minimumContrast, pair);

        var primary = ComputeColorEmissiveTelemetry(scheme["primary"]);
        var effectiveStress = RoundToInteger(stress * 0.55 + primary.BlueStressIndex * 0.45);
        var total = RoundToInteger(95 + (r + g + b));
        var savings = RoundToInteger((lcdPower - total) / lcdPower * 100);
        var surface = scheme.Tones["surface"];
        var zeroCutoff = surface == 0 || scheme.Tones["surfaceContainerLowest"] == 0;
        var smear = zeroCutoff ? "Severe (T=0 Cutoff)" : surface <= 2 ? "Minimal" : "None";
        var abl = apl > 65 ? "High" : apl > 38 ? "Moderate" : "Low";
        var fringing = profile == EmissivePanelType.AmoledAntiSmear ? "Controlled" :
            HexToOkyct(scheme["primary"]).C > 0.17 ? "Elevated" : "Low";

        return new SchemeEmissiveReport(profile, spec, total, savings,
            new Rgb(RoundTenths(r), RoundTenths(g), RoundTenths(b)), RoundTenths(apl), abl,
            effectiveStress, zeroCutoff ? 18.5 : spec.SmearRiseTimeMs, smear, fringing, RoundToInteger(off * 100),
            minimumContrast, pair);
    }

    private static double RoundTenths(double value) => RoundToInteger(value * 10) / 10;
}
