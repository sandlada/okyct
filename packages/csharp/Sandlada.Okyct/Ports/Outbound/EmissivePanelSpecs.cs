using System.Collections.ObjectModel;
using Sandlada.Okyct.Ports.Inbound;

namespace Sandlada.Okyct.Ports.Outbound;

public static class EmissivePanelSpecs
{
    public static IReadOnlyDictionary<EmissivePanelType, EmissivePanelSpec> Default { get; } =
        new ReadOnlyDictionary<EmissivePanelType, EmissivePanelSpec>(new Dictionary<EmissivePanelType, EmissivePanelSpec>
        {
            [EmissivePanelType.StandardLcd] = new(
                EmissivePanelType.StandardLcd, "Standard IPS / Mini-LED LCD", "Standard LCD", "Global Backlight",
                SubpixelGeometry.RgbStripe, "RGB Stripe (Standard Vertical Subpixels)",
                "Relies on a constant backlight modulated by liquid crystals; power draw is largely independent of pixel tone with zero subpixel cutoff or burn-in.",
                new DarkSurfaceTones(4, 6, 10, 12, 17, 22, 24), 100, 4.5),
            [EmissivePanelType.OledTrueBlack] = new(
                EmissivePanelType.OledTrueBlack, "OLED True-Black (Zero-Power Cutoff)", "OLED True-Black", "T=0 Pixel Cutoff",
                SubpixelGeometry.RgbStripe, "RGB OLED (Self-Emissive Pixels)",
                "Anchors base dark surfaces to #000000 (T=0) to fully power down organic emitters for maximum static battery savings, trading off ~18.5 ms turn-on black smearing.",
                new DarkSurfaceTones(0, 0, 4, 8, 13, 18, 22), 100, 18.5),
            [EmissivePanelType.AmoledAntiSmear] = new(
                EmissivePanelType.AmoledAntiSmear, "AMOLED 120Hz Anti-Smear (Pre-Biased)", "AMOLED Anti-Smear", "T=4 Sub-Threshold Bias",
                SubpixelGeometry.DiamondPentile, "Diamond PenTile (Subpixel-Shared Matrix)",
                "Tuned for 120Hz mobile AMOLED panels: holds lowest dark surfaces above sub-threshold turn-on (T=3..4) to eliminate scroll black smearing and tame PenTile fringing.",
                new DarkSurfaceTones(3, 4, 8, 12, 16, 21, 24), 98, 1.6),
            [EmissivePanelType.MicroOledXr] = new(
                EmissivePanelType.MicroOledXr, "MicroOLED Silicon XR (Low-Halation)", "MicroOLED XR", "Anti-Halation + Anti-ABL",
                SubpixelGeometry.MicroOledHex, "Silicon Tandem Micro-Cavity",
                "Engineered for XR headsets: raises dark velvet floor to T=8 and caps peak highlights at T=92 to suppress Pancake lens internal halation and backplane ABL dimming.",
                new DarkSurfaceTones(6, 8, 12, 16, 20, 25, 28), 92, 0.4),
            [EmissivePanelType.WoledDesktop] = new(
                EmissivePanelType.WoledDesktop, "WRGB Tandem OLED (Desktop / TV)", "WOLED Desktop", "WRGB White Subpixel",
                SubpixelGeometry.WrgbStripe, "WRGB Stripe (White Subpixel Assisted)",
                "Models desktop/TV WRGB Tandem OLED panels where a dedicated high-efficiency white subpixel carries achromatic luminance, reducing RGB emitter stress on bright surfaces.",
                new DarkSurfaceTones(2, 4, 8, 12, 16, 21, 24), 98, 0.3)
        });
}
