namespace Sandlada.Okyct.Ports.Inbound;

public interface ILayerStackingPort
{
    Func<IReadOnlyList<ColorLayer>, Func<string, CompositedResult>> StackLayers(StackOptions? options = null);
    Func<StateLayerPair, CompositedResult> StackStateLayers(IReadOnlyList<StateLayer> states);
    Func<CompositedResult, StackedContrastReport> AuditStackedContrast(string foregroundHex);
    Func<IReadOnlyList<ColorLayer>, Func<string, string>> StackToCssColorMix(CssMixSpace space = CssMixSpace.Oklch);
}
