using AstralVeil.Api.Data;
using AstralVeil.Api.Data.Entities;
using AstralVeil.Api.Models;
using AstralVeil.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AstralVeil.Api.Controllers;

[ApiController]
[Route("api/users")]
public sealed class UsersController(AppDbContext db) : ControllerBase
{
    /// <summary>创建或更新用户档案（SQLite）。</summary>
    [HttpPut("profile")]
    [Produces("application/json")]
    public async Task<IActionResult> PutProfile([FromBody] UserProfileUpsertDto? body, CancellationToken cancellationToken)
    {
        if (body is null)
            return BadRequest(new { error = "BAD_REQUEST", message = "请求体为空" });

        var phone = PhoneNormalizer.ToStorageKey(body.Phone);
        if (string.IsNullOrEmpty(phone))
            return BadRequest(new { error = "BAD_REQUEST", message = "手机号无效" });

        if (string.IsNullOrWhiteSpace(body.ZodiacId)
            || body.BirthYear <= 0
            || body.BirthMonth is < 1 or > 12
            || body.BirthDay is < 1 or > 31)
            return BadRequest(new { error = "BAD_REQUEST", message = "档案字段不完整" });

        var nickname = string.IsNullOrWhiteSpace(body.Nickname) ? "星际旅人" : body.Nickname.Trim();
        var now = DateTime.UtcNow;

        var existing = await db.Users.AsTracking().FirstOrDefaultAsync(u => u.Phone == phone, cancellationToken);
        if (existing is null)
        {
            db.Users.Add(new UserEntity
            {
                Phone = phone,
                Nickname = nickname,
                BirthYear = body.BirthYear,
                BirthMonth = body.BirthMonth,
                BirthDay = body.BirthDay,
                ZodiacId = body.ZodiacId.Trim(),
                JoinedAt = body.JoinedAt,
                UpdatedAtUtc = now,
            });
        }
        else
        {
            existing.Nickname = nickname;
            existing.BirthYear = body.BirthYear;
            existing.BirthMonth = body.BirthMonth;
            existing.BirthDay = body.BirthDay;
            existing.ZodiacId = body.ZodiacId.Trim();
            if (!string.IsNullOrWhiteSpace(body.JoinedAt))
                existing.JoinedAt = body.JoinedAt;
            existing.UpdatedAtUtc = now;
        }

        await db.SaveChangesAsync(cancellationToken);
        return Ok(new { ok = true, phone });
    }
}
