namespace AstralVeil.Api.Data.Entities;

/// <summary>
/// 用户档案（手机号主键，与前端 UserProfile 对齐）。
/// </summary>
public sealed class UserEntity
{
    public string Phone { get; set; } = "";

    public string Nickname { get; set; } = "";

    public int BirthYear { get; set; }
    public int BirthMonth { get; set; }
    public int BirthDay { get; set; }

    public string ZodiacId { get; set; } = "";

    /// <summary>首次建档时间 ISO8601</summary>
    public string? JoinedAt { get; set; }

    public DateTime UpdatedAtUtc { get; set; }
}
