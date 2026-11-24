namespace Sandlada.Okyct.Ports.Outbound;

public interface IImageQuantizerPort
{
    IReadOnlyList<ExtractedSeedColor> ExtractSeedsFromImageData(ImagePixelBuffer image, ExtractSeedsOptions? options = null);
}
