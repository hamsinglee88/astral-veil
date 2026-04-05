/** 中国大陆手机号：11 位数字，以 1 开头（与登录页一致） */
export const CN_MOBILE_PHONE_RE = /^1\d{10}$/;

/** 6 位数字验证码 */
export const OTP_SIX_DIGITS_RE = /^\d{6}$/;

export function isValidCnMobilePhone(phone: string): boolean {
  return CN_MOBILE_PHONE_RE.test(phone.trim());
}

export function isValidOtpSixDigits(otp: string): boolean {
  return OTP_SIX_DIGITS_RE.test(otp.trim());
}
