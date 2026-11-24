namespace Sandlada.Okyct.Ports.Outbound;

public sealed class ImagePixelBuffer
{
    public ImagePixelBuffer(ReadOnlyMemory<byte> data, int? width = null, int? height = null)
    {
        Bytes = data;
        Width = width;
        Height = height;
    }

    public ImagePixelBuffer(ReadOnlyMemory<double> data, int? width = null, int? height = null)
    {
        Numbers = data;
        Width = width;
        Height = height;
    }

    public ReadOnlyMemory<byte>? Bytes { get; }
    public ReadOnlyMemory<double>? Numbers { get; }
    public int? Width { get; }
    public int? Height { get; }
}
