namespace Sandlada.Okyct.Ports.Inbound;

public interface IPaletteGenerationPort<T> where T : ITonalPalettePort
{
    PaletteSet<T> CreatePalettesFromSource(string sourceHex, CreatePalettesOptions? options = null);
    string HarmonizeHex(string designHex, string sourceHex, double maxShiftAngle = 18);
    bool IsWarmHue(double hue);
}
