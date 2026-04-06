using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using AstralVeil.Api.Models;

namespace AstralVeil.Api.Services;

/// <summary>
/// 调用 OpenAI 兼容 Chat Completions（默认 DeepSeek），生成结构化运势 JSON。
/// </summary>
public sealed class HoroscopeAiService(
    IHttpClientFactory httpClientFactory,
    IConfiguration configuration,
    ILogger<HoroscopeAiService> logger)
{
    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

    public async Task<HoroscopeServiceResult> GenerateAsync(HoroscopeRequest req, CancellationToken cancellationToken)
    {
        var apiKey = configuration["DEEPSEEK_API_KEY"]
                     ?? configuration["OPENAI_API_KEY"]
                     ?? configuration["AI_API_KEY"];
        if (string.IsNullOrWhiteSpace(apiKey))
            return HoroscopeServiceResult.Fail(503, "NO_API_KEY", null);

        var baseUrl = (configuration["OPENAI_BASE_URL"] ?? "https://api.deepseek.com/v1").TrimEnd('/');
        var model = configuration["OPENAI_MODEL"] ?? "deepseek-chat";
        var dateIso = string.IsNullOrWhiteSpace(req.DateISO)
            ? DateOnly.FromDateTime(DateTime.UtcNow).ToString("yyyy-MM-dd")
            : req.DateISO!;

        var userPrompt =
            $"用户出生日期：{req.BirthYear}年{req.BirthMonth}月{req.BirthDay}日。星座：{req.ZodiacLabel}。请为「今天」生成运势，今天的日期（ISO）：{dateIso}。\n\n" +
            """
            只输出一个 JSON 对象，不要 Markdown，不要代码块。字段要求：
            - moonNote: string，一行短句，描述今日天象/月亮对用户的大致影响（中文）
            - insight: string，今日启示正文 120-220 字（中文，文艺但可执行）
            - luckyColorName: string，幸运色名称（中文）
            - luckyColorHex: string，对应颜色的 #RRGGBB
            - luckyNumber: string，两位幸运数字如 "07"
            - luckyItem: string，幸运小物（中文）
            - dimensions: { love: { rating: 1-5 整数, text: 一句中文 }, career: { rating, text }, energy: { rating, text } }

            rating 为 1-5 的整数。JSON 键名必须完全一致。
            """;

        var client = httpClientFactory.CreateClient("openai");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

        var requestBody = new
        {
            model,
            temperature = 0.85,
            response_format = new { type = "json_object" },
            messages = new object[]
            {
                new
                {
                    role = "system",
                    content = "你是资深占星文案编辑，输出严格 JSON，内容积极克制，避免医疗与投资建议。",
                },
                new { role = "user", content = userPrompt },
            },
        };

        var json = JsonSerializer.Serialize(requestBody, JsonOpts);
        using var content = new StringContent(json, Encoding.UTF8, "application/json");

        HttpResponseMessage response;
        try
        {
            response = await client.PostAsync($"{baseUrl}/chat/completions", content, cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "运势 AI（DeepSeek/兼容接口）请求失败");
            return HoroscopeServiceResult.Fail(500, "HOROSCOPE_FAILED", ex.Message);
        }

        if (!response.IsSuccessStatusCode)
        {
            var errText = await response.Content.ReadAsStringAsync(cancellationToken);
            logger.LogWarning("上游非 2xx: {Status} {Body}", response.StatusCode, errText[..Math.Min(500, errText.Length)]);
            return HoroscopeServiceResult.Fail(502, "AI_UPSTREAM", errText[..Math.Min(500, errText.Length)]);
        }

        var responseText = await response.Content.ReadAsStringAsync(cancellationToken);

        string? raw;
        try
        {
            using var doc = JsonDocument.Parse(responseText);
            var root = doc.RootElement;
            if (!root.TryGetProperty("choices", out var choicesEl)
                || choicesEl.ValueKind != JsonValueKind.Array
                || choicesEl.GetArrayLength() == 0)
            {
                logger.LogWarning("上游响应缺少 choices 或为空数组");
                return HoroscopeServiceResult.Fail(502, "EMPTY_AI_RESPONSE", null);
            }

            var first = choicesEl[0];
            if (!first.TryGetProperty("message", out var messageEl)
                || !messageEl.TryGetProperty("content", out var contentEl))
            {
                logger.LogWarning("上游响应缺少 message.content");
                return HoroscopeServiceResult.Fail(502, "EMPTY_AI_RESPONSE", null);
            }

            raw = contentEl.GetString();
        }
        catch (JsonException ex)
        {
            logger.LogWarning(ex, "解析上游 Chat Completions 外层 JSON 失败");
            return HoroscopeServiceResult.Fail(500, "HOROSCOPE_FAILED", ex.Message);
        }

        if (string.IsNullOrWhiteSpace(raw))
            return HoroscopeServiceResult.Fail(502, "EMPTY_AI_RESPONSE", null);

        HoroscopePayload payload;
        try
        {
            payload = JsonSerializer.Deserialize<HoroscopePayload>(raw, JsonOpts)
                      ?? throw new InvalidOperationException("deserialize null");
            payload = NormalizePayload(payload);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "解析模型 JSON 失败: {Snippet}", raw[..Math.Min(200, raw.Length)]);
            return HoroscopeServiceResult.Fail(500, "HOROSCOPE_FAILED", ex.Message);
        }

        return HoroscopeServiceResult.Ok(payload);
    }

    private static HoroscopePayload NormalizePayload(HoroscopePayload p)
    {
        static int ClampRating(int r) => Math.Clamp(r, 1, 5);

        return new HoroscopePayload
        {
            MoonNote = p.MoonNote ?? "",
            Insight = p.Insight ?? "",
            LuckyColorName = p.LuckyColorName ?? "",
            LuckyColorHex = string.IsNullOrWhiteSpace(p.LuckyColorHex) ? "#888888" : p.LuckyColorHex,
            LuckyNumber = string.IsNullOrWhiteSpace(p.LuckyNumber) ? "00" : p.LuckyNumber,
            LuckyItem = p.LuckyItem ?? "",
            Dimensions = new DimensionBlock
            {
                Love = new DimensionItem
                {
                    Rating = ClampRating(p.Dimensions?.Love?.Rating ?? 3),
                    Text = p.Dimensions?.Love?.Text ?? "",
                },
                Career = new DimensionItem
                {
                    Rating = ClampRating(p.Dimensions?.Career?.Rating ?? 3),
                    Text = p.Dimensions?.Career?.Text ?? "",
                },
                Energy = new DimensionItem
                {
                    Rating = ClampRating(p.Dimensions?.Energy?.Rating ?? 3),
                    Text = p.Dimensions?.Energy?.Text ?? "",
                },
            },
        };
    }
}

public readonly record struct HoroscopeServiceResult(bool Success, HoroscopePayload? Payload, int StatusCode, string? ErrorCode, string? Detail)
{
    public static HoroscopeServiceResult Ok(HoroscopePayload payload) =>
        new(true, payload, 200, null, null);

    public static HoroscopeServiceResult Fail(int status, string errorCode, string? detail) =>
        new(false, null, status, errorCode, detail);
}
