namespace AstralVeil.Api.Services;

public static class PhoneNormalizer
{
    /// <summary>提取数字；若长度≥11 则取末 11 位作为大陆手机号键。</summary>
    public static string? ToStorageKey(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return null;
        var digits = string.Concat(raw.Where(char.IsDigit));
        if (digits.Length == 0) return null;
        return digits.Length >= 11 ? digits[^11..] : digits;
    }
}
