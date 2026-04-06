namespace AstralVeil.Api.Data.Entities;

/// <summary>
/// 每日运势缓存：同一手机号 + 自然日仅生成一次 AI 结果。
/// </summary>
public sealed class HoroscopeDailyEntity
{
    public int Id { get; set; }

    public string Phone { get; set; } = "";

    /// <summary>YYYY-MM-DD（与请求 dateISO 一致）</summary>
    public string DateIso { get; set; } = "";

    /// <summary>HoroscopePayload 的 JSON</summary>
    public string PayloadJson { get; set; } = "";

    public DateTime CreatedAtUtc { get; set; }
}
