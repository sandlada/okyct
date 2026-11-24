using Sandlada.Okyct.Domain.Models;
using Sandlada.Okyct.Ports.Outbound;
using static Sandlada.Okyct.Domain.Services.ColorScience;

namespace Sandlada.Okyct.Adapters;

public sealed class ImageQuantizer : IImageQuantizerPort
{
    private const int GridHueBins = 72;
    private const int GridToneBands = 5;
    private const double DegToRad = Math.PI / 180;
    private const double RadToDeg = 180 / Math.PI;
    private const string FallbackHex = "#1A73E8";

    public IReadOnlyList<ExtractedSeedColor> ExtractSeedsFromImageData(
        ImagePixelBuffer image, ExtractSeedsOptions? options = null)
    {
        ArgumentNullException.ThrowIfNull(image);
        var data = new PixelData(image);
        if (data.Length % 4 != 0)
            throw new ArgumentException("Expected four RGBA channels per pixel.", nameof(image));

        if (image.Width is not null || image.Height is not null)
        {
            if (image.Width is not int width || image.Height is not int height ||
                width < 0 || height < 0 || (long)width * height != data.Length / 4)
                throw new ArgumentException("The image dimensions must match the RGBA buffer.", nameof(image));
        }

        options ??= new();
        if (!Enum.IsDefined(options.Mode) ||
            !double.IsFinite(options.MaxColors) || options.MaxColors < 1 ||
            !double.IsFinite(options.MinHueDistance) || options.MinHueDistance < 0 ||
            !double.IsFinite(options.MinToneDistance) || options.MinToneDistance < 0)
            throw new ArgumentOutOfRangeException(nameof(options));

        var histogram = options.Mode == ImageQuantizerMode.HueHistogram;
        var cells = new Cell[histogram ? 360 : GridHueBins * GridToneBands];
        var opaque = 0;
        var valid = 0;
        for (var index = 0; index < data.Length; index += 4)
        {
            if (data[index + 3] < 128) continue;
            opaque++;

            var color = RgbToOkyct(new Rgb(data[index] / 255, data[index + 1] / 255, data[index + 2] / 255));
            if (color.T < 10 || color.T > 95 || color.C < 0.028) continue;

            var hueBin = histogram ? (int)Math.Floor(color.H) % 360 : (int)Math.Floor(color.H / 5) % GridHueBins;
            var cellIndex = histogram ? hueBin : hueBin * GridToneBands + Math.Min(GridToneBands - 1, (int)Math.Floor(color.T / 20));
            ref var cell = ref cells[cellIndex];
            cell.Population++;
            cell.Chroma += color.C;
            cell.Tone += color.T;
            if (!histogram)
            {
                cell.Cosine += Math.Cos(color.H * DegToRad);
                cell.Sine += Math.Sin(color.H * DegToRad);
            }
            valid++;
        }

        if (valid == 0)
            return [new ExtractedSeedColor(FallbackHex, HexToOkyct(FallbackHex), 0, 0, true)];

        var candidates = histogram ? HistogramCandidates(cells, opaque, valid) : GridCandidates(cells, opaque, valid);
        var selected = new List<ExtractedSeedColor>();
        // OrderByDescending preserves source order for candidates with the same score.
        foreach (var candidate in candidates.OrderByDescending(candidate => candidate.Score))
        {
            var tone = histogram ? Math.Clamp(candidate.Tone, 35, 72) : Math.Clamp(candidate.Tone, 20, 82);
            if (selected.Any(seed => ShortestHueDelta(seed.Okyct.H, candidate.Hue) < options.MinHueDistance &&
                    (histogram || Math.Abs(seed.Okyct.T - tone) < options.MinToneDistance)))
                continue;

            var hue = histogram ? candidate.Hue : RoundToInteger(candidate.Hue * 100) / 100;
            var color = new OkyctColor(hue, Math.Clamp(candidate.Chroma, 0.08, 0.24), tone);
            selected.Add(new ExtractedSeedColor(OkyctToHex(color), color, Math.Min(1, candidate.PopulationRatio),
                RoundToInteger(candidate.Score * 10) / 10));

            if (selected.Count >= options.MaxColors) break;
        }

        return selected.AsReadOnly();
    }

    private static IEnumerable<Candidate> HistogramCandidates(Cell[] cells, int opaque, int valid)
    {
        for (var hue = 0; hue < 360; hue++)
        {
            if (cells[hue].Population == 0) continue;
            var cluster = new Cluster();
            for (var offset = -7; offset <= 7; offset++)
                cluster.Add(cells[(hue + offset + 360) % 360], 1 - Math.Abs(offset) / 9.0);

            yield return cluster.ToCandidate(hue, opaque, valid, 20, 85, 0.65);
        }
    }

    private static IEnumerable<Candidate> GridCandidates(Cell[] cells, int opaque, int valid)
    {
        for (var hue = 0; hue < GridHueBins; hue++)
        {
            for (var tone = 0; tone < GridToneBands; tone++)
            {
                if (cells[hue * GridToneBands + tone].Population == 0) continue;
                var cluster = new Cluster();
                for (var dh = -1; dh <= 1; dh++)
                {
                    var neighborHue = (hue + dh + GridHueBins) % GridHueBins;
                    var hueWeight = dh == 0 ? 1.0 : 0.5;
                    for (var dt = -1; dt <= 1; dt++)
                    {
                        var neighborTone = tone + dt;
                        if (neighborTone < 0 || neighborTone >= GridToneBands) continue;
                        var toneWeight = dt == 0 ? 1.0 : 0.25;
                        cluster.Add(cells[neighborHue * GridToneBands + neighborTone], hueWeight * toneWeight);
                    }
                }

                yield return cluster.ToCandidate(cluster.MeanHue(), opaque, valid, 16, 88, 0.7);
            }
        }
    }

    private struct Cell
    {
        public int Population;
        public double Chroma;
        public double Tone;
        public double Cosine;
        public double Sine;
    }

    private struct Cluster
    {
        private double _population;
        private double _weightedPopulation;
        private double _chroma;
        private double _tone;
        private double _cosine;
        private double _sine;

        public void Add(Cell cell, double weight)
        {
            _population += cell.Population;
            _weightedPopulation += cell.Population * weight;
            _chroma += cell.Chroma * weight;
            _tone += cell.Tone * weight;
            _cosine += cell.Cosine * weight;
            _sine += cell.Sine * weight;
        }

        public readonly double MeanHue()
        {
            var hue = Math.Atan2(_sine, _cosine) * RadToDeg;
            return hue < 0 ? hue + 360 : hue;
        }

        public readonly Candidate ToCandidate(double hue, int opaque, int valid,
            double lowTone, double highTone, double tonePenalty)
        {
            var chroma = _chroma / _weightedPopulation;
            var tone = _tone / _weightedPopulation;
            var chromaFactor = Math.Pow(Math.Min(0.28, chroma) / 0.14, 1.15);
            var score = _weightedPopulation / valid * 100 * chromaFactor * (tone < lowTone || tone > highTone ? tonePenalty : 1);
            return new Candidate(hue, score, chroma, tone, _population / opaque);
        }
    }

    private readonly record struct Candidate(double Hue, double Score, double Chroma, double Tone, double PopulationRatio);

    private readonly ref struct PixelData(ImagePixelBuffer image)
    {
        private readonly ReadOnlySpan<byte> _bytes = image.Bytes.GetValueOrDefault().Span;
        private readonly ReadOnlySpan<double> _numbers = image.Numbers.GetValueOrDefault().Span;

        public int Length => _bytes.Length + _numbers.Length;
        public double this[int index] => _numbers.IsEmpty ? _bytes[index] : _numbers[index];
    }
}
