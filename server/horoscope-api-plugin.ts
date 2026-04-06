import express from 'express';
import type { Plugin, PreviewServer, ViteDevServer } from 'vite';
import { loadEnv } from 'vite';
import {
  getCachedHoroscope,
  normalizePhoneKey,
  setCachedHoroscope,
  upsertUserLocal,
} from './dev-local-store';

function setupApiRoutes(app: express.Application, env: Record<string, string>): void {
  /** 与 .NET PUT /api/users/profile 对齐：开发态写入 server/data/users.json */
  app.put('/api/users/profile', (req, res) => {
    const b = req.body as {
      phone?: string;
      nickname?: string;
      birthYear?: number;
      birthMonth?: number;
      birthDay?: number;
      zodiacId?: string;
      joinedAt?: string;
    };
    const phone = normalizePhoneKey(b.phone);
    if (!phone) {
      res.status(400).json({ error: 'BAD_REQUEST', message: '手机号无效' });
      return;
    }
    if (
      b.birthYear == null ||
      b.birthMonth == null ||
      b.birthDay == null ||
      !b.zodiacId?.trim()
    ) {
      res.status(400).json({ error: 'BAD_REQUEST', message: '档案字段不完整' });
      return;
    }
    upsertUserLocal({
      phone,
      nickname: (b.nickname?.trim() || '星际旅人') as string,
      birthYear: b.birthYear,
      birthMonth: b.birthMonth,
      birthDay: b.birthDay,
      zodiacId: b.zodiacId.trim(),
      joinedAt: b.joinedAt,
    });
    res.json({ ok: true, phone });
  });

  app.post('/api/horoscope', async (req, res) => {
    const apiKey = env.DEEPSEEK_API_KEY || env.OPENAI_API_KEY || env.AI_API_KEY;
    const base = env.OPENAI_BASE_URL?.replace(/\/$/, '') || 'https://api.deepseek.com/v1';
    const model = env.OPENAI_MODEL || 'deepseek-chat';

    const body = req.body as {
      birthYear?: number;
      birthMonth?: number;
      birthDay?: number;
      zodiacLabel?: string;
      dateISO?: string;
      phone?: string;
    };

    if (
      !body.zodiacLabel ||
      body.birthYear == null ||
      body.birthMonth == null ||
      body.birthDay == null
    ) {
      res.status(400).json({ error: '缺少生日或星座参数' });
      return;
    }

    const dateISO = body.dateISO?.trim() || new Date().toISOString().slice(0, 10);

    const cached = getCachedHoroscope(body.phone, dateISO);
    if (cached) {
      res.json({ horoscope: cached });
      return;
    }

    if (!apiKey) {
      res.status(503).json({ error: 'NO_API_KEY' });
      return;
    }

    const userPrompt = `用户出生日期：${body.birthYear}年${body.birthMonth}月${body.birthDay}日。星座：${body.zodiacLabel}。请为「今天」生成运势，今天的日期（ISO）：${dateISO}。

只输出一个 JSON 对象，不要 Markdown，不要代码块。字段要求：
- moonNote: string，一行短句，描述今日天象/月亮对用户的大致影响（中文）
- insight: string，今日启示正文 120-220 字（中文，文艺但可执行）
- luckyColorName: string，幸运色名称（中文）
- luckyColorHex: string，对应颜色的 #RRGGBB
- luckyNumber: string，两位幸运数字如 "07"
- luckyItem: string，幸运小物（中文）
- dimensions: { love: { rating: 1-5 整数, text: 一句中文 }, career: { rating, text }, energy: { rating, text } }

rating 为 1-5 的整数。JSON 键名必须完全一致。`;

    try {
      const r = await fetch(`${base}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature: 0.85,
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content:
                '你是资深占星文案编辑，输出严格 JSON，内容积极克制，避免医疗与投资建议。',
            },
            { role: 'user', content: userPrompt },
          ],
        }),
      });

      if (!r.ok) {
        const errText = await r.text();
        res.status(502).json({ error: 'AI_UPSTREAM', detail: errText.slice(0, 500) });
        return;
      }

      const data = (await r.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const raw = data.choices?.[0]?.message?.content;
      if (!raw) {
        res.status(502).json({ error: 'EMPTY_AI_RESPONSE' });
        return;
      }

      const parsed = JSON.parse(raw) as Record<string, unknown>;
      setCachedHoroscope(body.phone, dateISO, parsed);
      res.json({ horoscope: parsed });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      res.status(500).json({ error: 'HOROSCOPE_FAILED', detail: msg });
    }
  });
}

function mountApi(
  server: ViteDevServer | PreviewServer,
  getEnv: () => Record<string, string>,
): void {
  const app = express();
  app.use(express.json({ limit: '48kb' }));
  setupApiRoutes(app, getEnv());
  server.middlewares.use(app);
}

export function horoscopeApiPlugin(): Plugin {
  return {
    name: 'horoscope-api',
    configureServer(server) {
      mountApi(server, () => loadEnv(server.config.mode, process.cwd(), ''));
    },
    configurePreviewServer(server) {
      mountApi(server, () => loadEnv(server.config.mode, process.cwd(), ''));
    },
  };
}
