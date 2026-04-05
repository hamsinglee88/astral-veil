using System.Text.Json.Serialization;

namespace AstralVeil.Api.Models;

public sealed class HoroscopePayload
{
    [JsonPropertyName("moonNote")]
    public string MoonNote { get; init; } = "";

    [JsonPropertyName("insight")]
    public string Insight { get; init; } = "";

    [JsonPropertyName("luckyColorName")]
    public string LuckyColorName { get; init; } = "";

    [JsonPropertyName("luckyColorHex")]
    public string LuckyColorHex { get; init; } = "#888888";

    [JsonPropertyName("luckyNumber")]
    public string LuckyNumber { get; init; } = "00";

    [JsonPropertyName("luckyItem")]
    public string LuckyItem { get; init; } = "";

    [JsonPropertyName("dimensions")]
    public DimensionBlock Dimensions { get; init; } = new();
}

public sealed class DimensionBlock
{
    [JsonPropertyName("love")]
    public DimensionItem Love { get; init; } = new();

    [JsonPropertyName("career")]
    public DimensionItem Career { get; init; } = new();

    [JsonPropertyName("energy")]
    public DimensionItem Energy { get; init; } = new();
}

public sealed class DimensionItem
{
    [JsonPropertyName("rating")]
    public int Rating { get; init; }

    [JsonPropertyName("text")]
    public string Text { get; init; } = "";
}
