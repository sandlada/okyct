namespace Sandlada.Okyct.Domain.Models;

public readonly record struct ColorToneInput
{
    internal string? Hex { get; }
    internal double Tone { get; }

    private ColorToneInput(double tone) => Tone = tone;
    private ColorToneInput(string hex) => Hex = hex ?? throw new ArgumentNullException(nameof(hex));

    public static implicit operator ColorToneInput(double tone) => new(tone);
    public static implicit operator ColorToneInput(string hex) => new(hex);
    public static implicit operator ColorToneInput(OkyctColor color) => new(color.T);
}
