using System.Text.Json.Serialization;

namespace AstralVeil.Api.Models;

/// <summary>与前端 <c>UserProfile</c> 对齐的 upsert 请求体。</summary>
public sealed class UserProfileUpsertDto
{
    [JsonPropertyName("phone")]
    public string? Phone { get; init; }

    [JsonPropertyName("nickname")]
    public string? Nickname { get; init; }

    [JsonPropertyName("birthYear")]
    public int BirthYear { get; init; }

    [JsonPropertyName("birthMonth")]
    public int BirthMonth { get; init; }

    [JsonPropertyName("birthDay")]
    public int BirthDay { get; init; }

    [JsonPropertyName("zodiacId")]
    public string? ZodiacId { get; init; }

    [JsonPropertyName("joinedAt")]
    public string? JoinedAt { get; init; }
}
