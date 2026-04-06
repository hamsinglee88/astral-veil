using System.Net;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using AstralVeil.Api.Data;
using AstralVeil.Api.Hubs;
using AstralVeil.Api.Services;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

// 反代后 Connection.RemoteIpAddress / 限流分区才能反映真实客户端；生产请在 ForwardedHeaders:KnownProxies 填写网关 IP
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    var proxies = builder.Configuration.GetSection("ForwardedHeaders:KnownProxies").Get<string[]>();
    if (proxies is { Length: > 0 })
    {
        foreach (var p in proxies)
        {
            if (IPAddress.TryParse(p.Trim(), out var ip))
                options.KnownProxies.Add(ip);
        }
    }
});

builder.Services.AddControllers().AddJsonOptions(o =>
{
    o.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    o.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
});

builder.Services.AddOpenApi();

builder.Services.AddDbContext<AppDbContext>((sp, o) =>
{
    var env = sp.GetRequiredService<IWebHostEnvironment>();
    var dir = Path.Combine(env.ContentRootPath, "Data");
    Directory.CreateDirectory(dir);
    var dbPath = Path.Combine(dir, "astral_veil.db");
    o.UseSqlite($"Data Source={dbPath}");
});

var permitLimit = builder.Configuration.GetValue("RateLimiting:Horoscope:PermitLimit", 60);
var windowSeconds = builder.Configuration.GetValue("RateLimiting:Horoscope:WindowSeconds", 60);

// 公开运势接口按 IP 固定窗口限流（PRD §14.5）；阈值见 appsettings RateLimiting:Horoscope
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.OnRejected = async (ctx, ct) =>
    {
        ctx.HttpContext.Response.ContentType = "application/json; charset=utf-8";
        await ctx.HttpContext.Response.WriteAsync(
            """{"error":"RATE_LIMITED","message":"请求过于频繁，请稍后再试"}""",
            ct);
    };
    options.AddPolicy("horoscope", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                AutoReplenishment = true,
                PermitLimit = permitLimit,
                Window = TimeSpan.FromSeconds(windowSeconds),
            }));
});

builder.Services.AddHttpClient("openai", client =>
{
    client.Timeout = TimeSpan.FromMinutes(2);
});

builder.Services.AddScoped<HoroscopeAiService>();

builder.Services.AddSignalR();

var app = builder.Build();

await using (var scope = app.Services.CreateAsyncScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.EnsureCreatedAsync();
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseForwardedHeaders();
app.UseHttpsRedirection();
app.UseRateLimiter();

app.MapGet("/health", () => Results.Json(new { status = "ok" }))
    .WithName("Health");

app.MapControllers();
app.MapHub<TreeHoleHub>("/hubs/treehole");

app.Run();

// 供集成测试使用 WebApplicationFactory
public partial class Program;
