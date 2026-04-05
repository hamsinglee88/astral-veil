using System.Text.Json.Serialization;

namespace AstralVeil.Api.Models;

public sealed class HoroscopeApiResponse
{
    [JsonPropertyName("horoscope")]
    public HoroscopePayload Horoscope { get; init; } = null!;
}
