namespace Sandlada.Okyct.Domain.Models;

public sealed record ColorConversionOptions(GamutTarget Gamut = GamutTarget.Srgb, GamutMappingMode GamutMapping = GamutMappingMode.PreserveTone);
