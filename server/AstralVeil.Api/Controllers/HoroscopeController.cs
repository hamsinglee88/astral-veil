using System.Text.Json;
using System.Text.Json.Serialization;
using AstralVeil.Api.Data;
using AstralVeil.Api.Data.Entities;
using AstralVeil.Api.Models;
using AstralVeil.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace AstralVeil.Api.Controllers;

[ApiController]
[Route("api")]
[EnableRateLimiting("horoscope")]
public sealed class HoroscopeController(
    HoroscopeAiService horoscopeAi,
    AppDbContext db) : ControllerBase
{
    private static readonly JsonSerializerOptions CacheJsonOpts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

    /// <summary>
    /// 生成当日结构化运势；同一手机号 + 自然日仅调用一次上游 AI，结果缓存在 SQLite。
    /// </summary>
    [HttpPost("horoscope")]
    [Produces("application/json")]
    public async Task<IActionResult> Post([FromBody] HoroscopeRequest? body, CancellationToken cancellationToken)
    {
        if (body is null)
            return BadRequest(new { error = "BAD_REQUEST", message = "请求体为空" });

        if (string.IsNullOrWhiteSpace(body.ZodiacLabel)
            || body.BirthYear <= 0
            || body.BirthMonth is < 1 or > 12
            || body.BirthDay is < 1 or > 31)
            return BadRequest(new { error = "BAD_REQUEST", message = "缺少生日或星座参数" });

        var phone = PhoneNormalizer.ToStorageKey(body.Phone);
        var dateIso = string.IsNullOrWhiteSpace(body.DateISO)
            ? DateOnly.FromDateTime(DateTime.UtcNow).ToString("yyyy-MM-dd")
            : body.DateISO!.Trim();

        if (!string.IsNullOrEmpty(phone))
        {
            var cached = await db.HoroscopeDailies
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.Phone == phone && x.DateIso == dateIso, cancellationToken);
            if (cached is not null)
            {
                var payload = JsonSerializer.Deserialize<HoroscopePayload>(cached.PayloadJson, CacheJsonOpts);
                if (payload is not null)
                    return Ok(new HoroscopeApiResponse { Horoscope = payload });
            }
        }

        var result = await horoscopeAi.GenerateAsync(body, cancellationToken);
        if (!result.Success)
        {
            if (result.StatusCode == 503)
                return StatusCode(503, new { error = result.ErrorCode });

            if (result.StatusCode == 502)
                return StatusCode(502, new { error = result.ErrorCode, detail = result.Detail });

            return StatusCode(result.StatusCode, new { error = result.ErrorCode, detail = result.Detail });
        }

        if (!string.IsNullOrEmpty(phone) && result.Payload is not null)
        {
            var json = JsonSerializer.Serialize(result.Payload, CacheJsonOpts);
            var row = await db.HoroscopeDailies
                .FirstOrDefaultAsync(x => x.Phone == phone && x.DateIso == dateIso, cancellationToken);
            if (row is not null)
            {
                row.PayloadJson = json;
                row.CreatedAtUtc = DateTime.UtcNow;
            }
            else
            {
                db.HoroscopeDailies.Add(new HoroscopeDailyEntity
                {
                    Phone = phone,
                    DateIso = dateIso,
                    PayloadJson = json,
                    CreatedAtUtc = DateTime.UtcNow,
                });
            }

            await db.SaveChangesAsync(cancellationToken);
        }

        return Ok(new HoroscopeApiResponse { Horoscope = result.Payload! });
    }
}
