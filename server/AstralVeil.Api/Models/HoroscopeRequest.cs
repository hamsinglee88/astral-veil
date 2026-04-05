using System.Text.Json.Serialization;

namespace AstralVeil.Api.Models;

/// <summary>
/// 与 PRD §14.3 及前端 <c>HoroscopeApiRequestBody</c> 对齐（camelCase JSON）。
/// </summary>
public sealed class HoroscopeRequest
{
    [JsonPropertyName("birthYear")]
    public int BirthYear { get; init; }

    [JsonPropertyName("birthMonth")]
    public int BirthMonth { get; init; }

    [JsonPropertyName("birthDay")]
    public int BirthDay { get; init; }

    [JsonPropertyName("zodiacLabel")]
    public string? ZodiacLabel { get; init; }

    [JsonPropertyName("dateISO")]
    public string? DateISO { get; init; }
}
