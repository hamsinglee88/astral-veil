using AstralVeil.Api.Models;
using AstralVeil.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace AstralVeil.Api.Controllers;

[ApiController]
[Route("api")]
[EnableRateLimiting("horoscope")]
public sealed class HoroscopeController(HoroscopeAiService horoscopeAi) : ControllerBase
{
    /// <summary>
    /// 生成当日结构化运势（OpenAI 兼容上游）。
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

        var result = await horoscopeAi.GenerateAsync(body, cancellationToken);
        if (!result.Success)
        {
            if (result.StatusCode == 503)
                return StatusCode(503, new { error = result.ErrorCode });

            if (result.StatusCode == 502)
                return StatusCode(502, new { error = result.ErrorCode, detail = result.Detail });

            return StatusCode(result.StatusCode, new { error = result.ErrorCode, detail = result.Detail });
        }

        return Ok(new HoroscopeApiResponse { Horoscope = result.Payload! });
    }
}
