using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace AstralVeil.Api.Tests;

public class HoroscopeApiTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public HoroscopeApiTests(WebApplicationFactory<Program> factory) => _factory = factory;

    [Fact]
    public async Task PostHoroscope_WithoutApiKey_Returns503_WithNoApiKeyError()
    {
        var client = _factory.CreateClient();
        var body = new
        {
            birthYear = 1999,
            birthMonth = 11,
            birthDay = 8,
            zodiacLabel = "天蝎座",
            dateISO = "2026-04-04",
        };
        var res = await client.PostAsJsonAsync("/api/horoscope", body);
        Assert.Equal(HttpStatusCode.ServiceUnavailable, res.StatusCode);
        var doc = await res.Content.ReadFromJsonAsync<JsonDocument>();
        Assert.NotNull(doc);
        Assert.Equal("NO_API_KEY", doc!.RootElement.GetProperty("error").GetString());
    }

    [Fact]
    public async Task PostHoroscope_MissingZodiac_Returns400()
    {
        var client = _factory.CreateClient();
        var body = new { birthYear = 1999, birthMonth = 11, birthDay = 8 };
        var res = await client.PostAsJsonAsync("/api/horoscope", body);
        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
    }

    [Fact]
    public async Task OpenApiDocument_IsAvailable_InDevelopment()
    {
        var client = _factory.WithWebHostBuilder(b => b.UseEnvironment("Development")).CreateClient();
        var res = await client.GetAsync("/openapi/v1.json");
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        Assert.Contains("application/json", res.Content.Headers.ContentType?.MediaType ?? "", StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Health_Returns200()
    {
        var client = _factory.CreateClient();
        var res = await client.GetAsync("/health");
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        var doc = await res.Content.ReadFromJsonAsync<JsonDocument>();
        Assert.Equal("ok", doc!.RootElement.GetProperty("status").GetString());
    }

    [Fact]
    public async Task PostHoroscope_Returns429_WhenExceedingConfiguredLimit()
    {
        await using var factory = new WebApplicationFactory<Program>().WithWebHostBuilder(b =>
        {
            b.UseSetting("RateLimiting:Horoscope:PermitLimit", "2");
            b.UseSetting("RateLimiting:Horoscope:WindowSeconds", "3600");
        });
        var client = factory.CreateClient();
        var body = new
        {
            birthYear = 1999,
            birthMonth = 11,
            birthDay = 8,
            zodiacLabel = "天蝎座",
            dateISO = "2026-04-04",
        };
        Assert.Equal(HttpStatusCode.ServiceUnavailable, (await client.PostAsJsonAsync("/api/horoscope", body)).StatusCode);
        Assert.Equal(HttpStatusCode.ServiceUnavailable, (await client.PostAsJsonAsync("/api/horoscope", body)).StatusCode);
        var third = await client.PostAsJsonAsync("/api/horoscope", body);
        Assert.Equal(HttpStatusCode.TooManyRequests, third.StatusCode);
        var doc = await third.Content.ReadFromJsonAsync<JsonDocument>();
        Assert.Equal("RATE_LIMITED", doc!.RootElement.GetProperty("error").GetString());
    }
}
