/**
 * 纯 Node 开发（未启用 .NET 代理）时：用本地 JSON 模拟 SQLite 用户表 + 每日运势缓存。
 */
import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'server', 'data');

function ensureDir(): void {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
}

export function normalizePhoneKey(raw: string | undefined): string | null {
  if (!raw) return null;
  const d = raw.replace(/\D/g, '');
  if (!d) return null;
  return d.length >= 11 ? d.slice(-11) : d;
}

type UsersFile = {
  v: 1;
  users: Record<
    string,
    {
      nickname: string;
      birthYear: number;
      birthMonth: number;
      birthDay: number;
      zodiacId: string;
      joinedAt?: string;
      updatedAt: string;
    }
  >;
};

type HoroscopeFile = { v: 1; entries: Record<string, Record<string, unknown>> };

const usersPath = () => path.join(dataDir, 'users.json');
const horoscopePath = () => path.join(dataDir, 'horoscope-cache.json');

function readUsers(): UsersFile {
  ensureDir();
  try {
    const raw = fs.readFileSync(usersPath(), 'utf-8');
    return JSON.parse(raw) as UsersFile;
  } catch {
    return { v: 1, users: {} };
  }
}

function writeUsers(f: UsersFile): void {
  ensureDir();
  fs.writeFileSync(usersPath(), JSON.stringify(f, null, 2), 'utf-8');
}

function readHoroscopeCache(): HoroscopeFile {
  ensureDir();
  try {
    const raw = fs.readFileSync(horoscopePath(), 'utf-8');
    return JSON.parse(raw) as HoroscopeFile;
  } catch {
    return { v: 1, entries: {} };
  }
}

function writeHoroscopeCache(f: HoroscopeFile): void {
  ensureDir();
  fs.writeFileSync(horoscopePath(), JSON.stringify(f, null, 2), 'utf-8');
}

export function upsertUserLocal(body: {
  phone: string;
  nickname: string;
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  zodiacId: string;
  joinedAt?: string;
}): void {
  const phone = normalizePhoneKey(body.phone);
  if (!phone) return;
  const f = readUsers();
  f.users[phone] = {
    nickname: body.nickname,
    birthYear: body.birthYear,
    birthMonth: body.birthMonth,
    birthDay: body.birthDay,
    zodiacId: body.zodiacId,
    joinedAt: body.joinedAt,
    updatedAt: new Date().toISOString(),
  };
  writeUsers(f);
}

export function getCachedHoroscope(phone: string | undefined, dateIso: string): Record<string, unknown> | null {
  const p = normalizePhoneKey(phone);
  if (!p) return null;
  const key = `${p}|${dateIso}`;
  const f = readHoroscopeCache();
  const h = f.entries[key];
  return h && typeof h === 'object' ? h : null;
}

export function setCachedHoroscope(
  phone: string | undefined,
  dateIso: string,
  horoscope: Record<string, unknown>,
): void {
  const p = normalizePhoneKey(phone);
  if (!p) return;
  const key = `${p}|${dateIso}`;
  const f = readHoroscopeCache();
  f.entries[key] = horoscope;
  writeHoroscopeCache(f);
}
