using Sandlada.Okyct.Domain.Models;

namespace Sandlada.Okyct.Ports.Inbound;

public static class StandardTones
{
    public static IReadOnlyList<int> Values { get; } =
        Array.AsReadOnly<int>([0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99, 100]);
}
