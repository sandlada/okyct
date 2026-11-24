namespace Sandlada.Okyct.Ports.Inbound;

public static class StateLayers
{
    public static IReadOnlyList<StateLayer> All { get; } =
        Array.AsReadOnly<StateLayer>([StateLayer.Hovered, StateLayer.Focused, StateLayer.Pressed, StateLayer.Dragged]);
}
