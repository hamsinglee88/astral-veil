import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  Sparkles,
  Bell,
  Moon,
  MessageSquare,
  Wand2,
  User,
  ChevronRight,
  LogOut,
  Star,
  Droplets,
  Zap,
  Heart,
  Briefcase,
  Activity,
  Key,
  Hash,
  Palette,
  ArrowRight,
  Shield,
  Lock,
  Info,
  Settings,
  MessageCircle,
  Loader2,
  Users,
} from 'lucide-react';
import { useProfile } from './ProfileContext';
import type { UserProfile } from './lib/userProfile';
import { fetchHoroscope } from './lib/fetchHoroscope';
import type { HoroscopePayload } from './lib/horoscopeTypes';
import {
  getRulingPlanet,
  getZodiacFromMonthDay,
  getZodiacLabel,
  type ZodiacId,
} from './lib/zodiac';
import { isValidCnMobilePhone, isValidOtpSixDigits } from './lib/loginValidation';
import { MATCH_COUNT_STORAGE_KEY } from './lib/logoutClear';
import { maskCnMobilePhone } from './lib/phoneDisplay';
import {
  categoryForNewMessage,
  filterTreeHoleMessages,
  loadTreeHoleMessages,
  saveTreeHoleMessages,
  TREEHOLE_SEED_MESSAGES,
  type TreeHoleMessage,
  type TreeHoleTabIndex,
} from './lib/treeHole';
import {
  connectTreeHoleRealtime,
  isTreeHoleRealtimeEnabled,
  isoUtcToHHmm,
  type TreeHoleRealtimePayload,
} from './lib/treeHoleSignalR';
import {
  getOrCreateSessionId,
  joinMatchQueue,
  leaveMatchQueue,
  subscribeMatch,
  subscribeQueueBump,
  tryPairFromQueue,
  type MatchPairEvent,
} from './lib/matchQueue';
import { APP_BRAND_NAME } from './lib/appMeta';

export type Page = 'login' | 'onboarding' | 'horoscope' | 'treehole' | 'match' | 'profile';

export const Header = () => (
  <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-outline-variant/15 shadow-lg">
    <div className="flex items-center justify-between px-6 h-16 max-w-screen-xl mx-auto">
      <motion.button
        type="button"
        whileHover={{ opacity: 0.8 }}
        whileTap={{ scale: 0.95 }}
        className="text-primary"
        aria-label="品牌"
      >
        <Sparkles size={24} />
      </motion.button>
      <h1 className="text-xl font-headline font-bold text-primary tracking-widest uppercase drop-shadow-[0_0_10px_rgba(206,189,255,0.5)]">
        {APP_BRAND_NAME}
      </h1>
      <motion.button
        type="button"
        whileHover={{ opacity: 0.8 }}
        whileTap={{ scale: 0.95 }}
        className="text-primary"
        aria-label="通知"
      >
        <Bell size={24} />
      </motion.button>
    </div>
  </header>
);

export const BottomNav = ({
  currentPage,
  setPage,
}: {
  currentPage: Page;
  setPage: (p: Page) => void;
}) => {
  const navItems = [
    { id: 'horoscope' as const, label: '运势', icon: Moon },
    { id: 'treehole' as const, label: '树洞', icon: MessageSquare },
    { id: 'match' as const, label: '匹配', icon: Wand2 },
    { id: 'profile' as const, label: '我的', icon: User },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 w-full bg-background/90 backdrop-blur-2xl rounded-t-[2rem] z-50 shadow-[0_-8px_40px_rgba(206,189,255,0.05)]"
      aria-label="主导航"
    >
      <div className="flex justify-around items-center h-20 px-4 pb-safe">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              type="button"
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => setPage(item.id)}
              className={`flex flex-col items-center justify-center transition-all duration-300 ${
                isActive
                  ? 'text-secondary drop-shadow-[0_0_8px_rgba(233,195,73,0.4)]'
                  : 'text-primary/60 hover:text-primary'
              }`}
            >
              <motion.div
                animate={isActive ? { y: -2 } : { y: 0 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <Icon size={24} fill={isActive ? 'currentColor' : 'none'} />
              </motion.div>
              <span className="text-[10px] uppercase tracking-tighter mt-1 font-body">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export const GlassCard = ({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={`glass-panel rounded-xl p-6 border border-outline-variant/10 ${className}`}>{children}</div>
);

export const NebulaButton = ({
  children,
  onClick,
  className = '',
  icon: Icon,
  disabled,
  buttonType = 'button',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  disabled?: boolean;
  /** 表单内主按钮用 submit，便于 Enter 提交（NFR6 基线） */
  buttonType?: 'button' | 'submit';
}) => (
  <motion.button
    type={buttonType}
    whileHover={{ scale: disabled ? 1 : 1.02 }}
    whileTap={{ scale: disabled ? 1 : 0.95 }}
    onClick={onClick}
    disabled={disabled}
    className={`nebula-gradient py-4 px-8 rounded-full flex items-center justify-center gap-3 text-background font-bold tracking-[0.15em] uppercase shadow-[0_0_20px_rgba(206,189,255,0.2)] transition-all group disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
  >
    {children}
    {Icon && <Icon size={20} className="group-hover:translate-x-1 transition-transform" />}
  </motion.button>
);

export const LoginPage = ({ onLogin }: { onLogin: (phone: string) => void }) => {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [err, setErr] = useState('');

  const submit = () => {
    if (!isValidCnMobilePhone(phone)) {
      setErr('请输入有效的 11 位手机号');
      return;
    }
    if (!isValidOtpSixDigits(otp)) {
      setErr('请输入 6 位验证码');
      return;
    }
    setErr('');
    onLogin(phone.trim());
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-20 bg-[radial-gradient(circle_at_20%_30%,_rgba(206,189,255,0.15)_0%,_transparent_40%),_radial-gradient(circle_at_80%_70%,_rgba(233,195,73,0.1)_0%,_transparent_40%)]" />

      <main className="w-full max-w-md z-10 space-y-12">
        <header className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-surface-high border border-outline-variant/20 mb-2">
            <Sparkles className="text-primary" size={32} />
          </div>
          <h1 className="font-headline text-4xl tracking-widest text-primary uppercase font-bold drop-shadow-[0_0_15px_rgba(206,189,255,0.4)]">
            {APP_BRAND_NAME}
          </h1>
          <p className="font-body text-on-surface-variant tracking-wide font-light text-sm">
            开启星空指引下的宇宙宿命
          </p>
        </header>

        <GlassCard className="p-8 space-y-8">
          <form
            className="space-y-8"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <div className="space-y-2">
              <label
                htmlFor="login-phone"
                className="block font-label text-xs uppercase tracking-widest text-primary font-semibold ml-1"
              >
                手机号码
              </label>
              <div className="relative border-b border-outline-variant/40 focus-within:border-primary transition-all">
                <span className="absolute left-0 bottom-3 text-on-surface-variant font-body">+86</span>
                <input
                  id="login-phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="请输入手机号"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                  className="w-full bg-transparent border-none focus:ring-0 text-on-surface py-3 pl-10 text-lg"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <label
                  htmlFor="login-otp"
                  className="block font-label text-xs uppercase tracking-widest text-primary font-semibold ml-1"
                >
                  验证码
                </label>
                <button
                  type="button"
                  className="text-xs text-secondary uppercase tracking-tight hover:opacity-80 transition-opacity"
                >
                  重新发送
                </button>
              </div>
              <div className="relative border-b border-outline-variant/40 focus-within:border-primary transition-all">
                <input
                  id="login-otp"
                  type="text"
                  inputMode="numeric"
                  placeholder="输入6位验证码"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full bg-transparent border-none focus:ring-0 text-on-surface py-3 text-lg tracking-[0.5em] placeholder:tracking-normal"
                />
              </div>
            </div>

            {err ? <p className="text-error text-sm font-body">{err}</p> : null}

            <NebulaButton buttonType="submit" className="w-full h-14" icon={ArrowRight}>
              登录 / 注册
            </NebulaButton>
          </form>

          <div className="pt-6 border-t border-outline-variant/10 flex justify-center gap-6 grayscale opacity-40">
            <div className="flex items-center gap-1">
              <Shield size={14} />
              <span className="text-[10px] uppercase font-label">加密传输</span>
            </div>
            <div className="flex items-center gap-1">
              <Lock size={14} />
              <span className="text-[10px] uppercase font-label">匿名保护</span>
            </div>
          </div>
        </GlassCard>

        <footer className="text-center px-4">
          <p className="text-[10px] text-on-surface-variant font-body leading-relaxed max-w-xs mx-auto">
            继续操作即表示您同意我们的
            <a href="#" className="text-secondary hover:underline mx-1">
              服务协议
            </a>
            和
            <a href="#" className="text-secondary hover:underline mx-1">
              隐私政策
            </a>
            。您的星体数据神圣不可侵犯。
          </p>
        </footer>
      </main>
    </div>
  );
};

export const OnboardingPage = ({
  phone,
  onComplete,
}: {
  phone: string;
  onComplete: (p: UserProfile) => void;
}) => {
  const [nickname, setNickname] = useState('');
  const [y, setY] = useState<number | ''>('');
  const [m, setM] = useState<number | ''>('');
  const [d, setD] = useState<number | ''>('');
  const [err, setErr] = useState('');

  const zodiacId: ZodiacId | null = useMemo(() => {
    if (m === '' || d === '') return null;
    const mi = Number(m);
    const di = Number(d);
    if (mi < 1 || mi > 12 || di < 1 || di > 31) return null;
    return getZodiacFromMonthDay(mi, di);
  }, [m, d]);

  const finish = () => {
    const name = nickname.trim() || '星际旅人';
    const yi = Number(y);
    const mi = Number(m);
    const di = Number(d);
    if (!y || !m || d === '' || Number.isNaN(yi) || Number.isNaN(mi) || Number.isNaN(di)) {
      setErr('请填写完整出生日期');
      return;
    }
    if (yi < 1940 || yi > new Date().getFullYear()) {
      setErr('请输入合理年份');
      return;
    }
    if (!zodiacId) {
      setErr('出生日期无效');
      return;
    }
    if (!isValidCnMobilePhone(phone)) {
      setErr('手机号无效，请返回登录');
      return;
    }
    setErr('');
    onComplete({
      phone,
      nickname: name,
      birthYear: yi,
      birthMonth: mi,
      birthDay: di,
      zodiacId,
    });
  };

  return (
    <form
      className="min-h-screen pt-24 pb-12 px-6 max-w-md mx-auto flex flex-col gap-12 relative overflow-hidden"
      onSubmit={(e) => {
        e.preventDefault();
        finish();
      }}
    >
      <div className="absolute top-[-10%] right-[-20%] w-64 h-64 bg-primary/10 blur-[80px] rounded-full pointer-events-none" />

      <section className="flex flex-col gap-8">
        <header className="space-y-2">
          <p className="text-secondary font-label text-[10px] uppercase tracking-[0.2em] opacity-80">第一阶段：觉醒</p>
          <h2 className="font-headline text-4xl leading-tight italic">显化你的本质</h2>
          <p className="text-xs text-on-surface-variant font-body">已绑定手机 {maskCnMobilePhone(phone)}</p>
        </header>

        <div className="space-y-10">
          <div className="relative group">
            <label
              htmlFor="onboarding-nickname"
              className="block text-on-surface-variant font-label text-xs uppercase tracking-wider mb-2"
            >
              星际昵称
            </label>
            <input
              id="onboarding-nickname"
              type="text"
              placeholder="寂静探索者"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full bg-transparent border-none border-b border-outline-variant/30 focus:border-primary focus:ring-0 text-xl font-headline italic py-3 transition-all"
            />
          </div>

          <fieldset className="space-y-4 border-0 p-0 m-0 min-w-0">
            <legend className="block text-on-surface-variant font-label text-xs uppercase tracking-wider">
              出生日期（公历）
            </legend>
            <div className="grid grid-cols-3 gap-4">
              <input
                id="onboarding-birth-y"
                type="number"
                placeholder="年"
                aria-label="出生年"
                value={y}
                onChange={(e) => setY(e.target.value === '' ? '' : Number(e.target.value))}
                className="bg-surface-low border border-outline-variant/15 rounded-lg p-4 font-headline text-lg focus:border-primary focus:ring-0"
              />
              <input
                id="onboarding-birth-m"
                type="number"
                placeholder="月"
                aria-label="出生月"
                value={m}
                onChange={(e) => setM(e.target.value === '' ? '' : Number(e.target.value))}
                className="bg-surface-low border border-outline-variant/15 rounded-lg p-4 font-headline text-lg focus:border-primary focus:ring-0"
              />
              <input
                id="onboarding-birth-d"
                type="number"
                placeholder="日"
                aria-label="出生日"
                value={d}
                onChange={(e) => setD(e.target.value === '' ? '' : Number(e.target.value))}
                className="bg-surface-low border border-outline-variant/15 rounded-lg p-4 font-headline text-lg focus:border-primary focus:ring-0"
              />
            </div>
          </fieldset>
        </div>
      </section>

      {zodiacId ? (
        <GlassCard className="relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Moon size={80} fill="currentColor" />
          </div>
          <div className="flex items-start justify-between relative z-10">
            <div className="space-y-4 max-w-[70%]">
              <div className="flex items-center gap-3">
                <Wand2 className="text-secondary" size={24} />
                <span className="text-secondary font-headline text-2xl tracking-wide">{getZodiacLabel(zodiacId)}</span>
              </div>
              <p className="text-on-surface/80 leading-relaxed text-sm">
                根据出生日期推算的太阳星座。完成档案后即可生成专属运势。
              </p>
            </div>
            <div className="w-20 h-20 rounded-full nebula-gradient flex items-center justify-center shadow-lg">
              <Star className="text-background" size={32} fill="currentColor" />
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-outline-variant/15 flex items-center justify-between">
            <span className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant">守护星</span>
            <span className="text-xs font-headline italic text-primary">{getRulingPlanet(zodiacId)}</span>
          </div>
        </GlassCard>
      ) : null}

      {err ? <p className="text-error text-sm">{err}</p> : null}

      <div className="mt-4">
        <NebulaButton buttonType="submit" className="w-full py-5" icon={ArrowRight}>
          进入秘境
        </NebulaButton>
      </div>
    </form>
  );
};

export const HoroscopePage = () => {
  const profile = useProfile();
  const [data, setData] = useState<HoroscopePayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    setLoading(true);
    fetchHoroscope(profile)
      .then((h) => {
        if (!cancelled) setData(h);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [profile]);

  const todayLabel = useMemo(() => {
    const t = new Date();
    return `${t.getFullYear()}年${t.getMonth() + 1}月${t.getDate()}日`;
  }, []);

  if (!profile) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center text-on-surface-variant font-body">
        请先完成登录与档案
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="min-h-screen pt-24 flex flex-col items-center justify-center gap-4 text-primary">
        <Loader2 className="animate-spin" size={40} />
        <p className="font-body text-on-surface-variant text-sm">正在生成今日运势…</p>
      </div>
    );
  }

  const zLabel = getZodiacLabel(profile.zodiacId);

  return (
    <div className="min-h-screen pt-24 pb-32 px-6 max-w-screen-md mx-auto">
      <section className="mb-12 relative">
        <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
          <div className="relative w-32 h-32 flex items-center justify-center">
            <div className="absolute inset-0 nebula-gradient rounded-full opacity-20 blur-2xl" />
            <Moon size={72} className="text-secondary drop-shadow-lg" fill="currentColor" />
          </div>
          <div>
            <p className="font-label text-secondary uppercase tracking-[0.2em] text-xs mb-2">今日星象</p>
            <h1 className="font-headline text-5xl md:text-7xl font-bold text-primary leading-none tracking-tight italic">{zLabel}</h1>
            <p className="mt-2 text-on-surface-variant font-light">{todayLabel} — {data.moonNote}</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard className="md:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-6">
              <h2 className="font-headline text-2xl text-primary">今日启示</h2>
              <span className="text-xs font-label text-on-surface-variant uppercase tracking-widest">综合运势</span>
            </div>
            <p className="text-lg leading-relaxed text-on-surface/90 font-light italic">「{data.insight}」</p>
          </div>
          <div className="mt-8 pt-6 border-t border-outline-variant/10 flex gap-4 flex-wrap">
            <button
              type="button"
              className="nebula-gradient px-6 py-2 rounded-full text-background font-label text-sm font-bold tracking-wide shadow-lg"
              onClick={() => window.alert('详细解读即将上线')}
            >
              阅读详细见解
            </button>
            <button
              type="button"
              className="px-6 py-2 rounded-full border border-outline-variant/30 text-primary font-label text-sm"
              onClick={() => {
                if (navigator.share) {
                  void navigator.share({ title: `${APP_BRAND_NAME}运势`, text: data.insight });
                } else {
                  void navigator.clipboard.writeText(data.insight);
                  window.alert('已复制到剪贴板');
                }
              }}
            >
              分享运势
            </button>
          </div>
        </GlassCard>

        <div className="space-y-6">
          <div className="bg-surface-low p-6 rounded-lg flex items-center justify-between">
            <div>
              <p className="font-label text-xs text-on-surface-variant uppercase">幸运色</p>
              <h3 className="font-headline text-xl text-on-surface">{data.luckyColorName}</h3>
            </div>
            <div
              className="w-12 h-12 rounded-full border border-outline-variant/30 shadow-inner"
              style={{ backgroundColor: data.luckyColorHex }}
            />
          </div>
          <div className="bg-surface-low p-6 rounded-lg flex items-center justify-between">
            <div>
              <p className="font-label text-xs text-on-surface-variant uppercase">幸运数字</p>
              <h3 className="font-headline text-4xl text-secondary">{data.luckyNumber}</h3>
            </div>
            <Hash size={24} className="text-secondary/30" />
          </div>
          <div className="bg-surface-low p-6 rounded-lg flex items-center justify-between">
            <div>
              <p className="font-label text-xs text-on-surface-variant uppercase">幸运物品</p>
              <h3 className="font-headline text-xl text-on-surface">{data.luckyItem}</h3>
            </div>
            <Key size={24} className="text-primary/50" />
          </div>
        </div>

        <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-6 mt-2">
          {(
            [
              { key: 'love', icon: Heart, label: '恋爱与情绪', ...data.dimensions.love, color: 'text-error' },
              { key: 'career', icon: Briefcase, label: '事业与财富', ...data.dimensions.career, color: 'text-primary' },
              { key: 'energy', icon: Activity, label: '能量与身体', ...data.dimensions.energy, color: 'text-secondary' },
            ] as const
          ).map((item) => (
            <div
              key={item.key}
              className="bg-surface-high/40 backdrop-blur-md p-6 rounded-lg border border-outline-variant/10 group hover:bg-surface-high transition-colors"
            >
              <div className="flex items-center gap-3 mb-4">
                <item.icon size={18} className={item.color} fill="currentColor" />
                <h4 className="font-label text-sm uppercase tracking-tighter">{item.label}</h4>
              </div>
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className={i < item.rating ? 'text-secondary' : 'text-secondary/20'}
                    fill={i < item.rating ? 'currentColor' : 'none'}
                  />
                ))}
              </div>
              <p className="mt-3 text-xs text-on-surface-variant leading-tight">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const TREE_ROOMS = ['全部', '元素', '午夜', '梦境空间'];

export const TreeHolePage = () => {
  const [tab, setTab] = useState<TreeHoleTabIndex>(0);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<TreeHoleMessage[]>(() => {
    const saved = loadTreeHoleMessages();
    return saved && saved.length > 0 ? saved : TREEHOLE_SEED_MESSAGES;
  });
  /** Story 6.1：与 .NET Hub 同会话，卸载时 disconnect */
  const treeHoleRealtimeRef = useRef<Awaited<ReturnType<typeof connectTreeHoleRealtime>> | null>(null);
  const [treeHoleRealtimeReady, setTreeHoleRealtimeReady] = useState(false);

  useEffect(() => {
    saveTreeHoleMessages(messages);
  }, [messages]);

  // 启用 VITE_USE_DOTNET_API 时连接 TreeHoleHub，失败则仅本地树洞（不阻断 MVP）
  useEffect(() => {
    if (!isTreeHoleRealtimeEnabled()) return;
    let cancelled = false;
    void connectTreeHoleRealtime((payload: TreeHoleRealtimePayload) => {
      if (cancelled) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === payload.id)) return prev;
        return [
          ...prev,
          {
            id: payload.id,
            author: payload.author,
            text: payload.text,
            self: false,
            time: isoUtcToHHmm(payload.time),
            category: payload.category as 1 | 2 | 3,
          },
        ];
      });
    })
      .then((api) => {
        if (cancelled) {
          void api.disconnect();
          return;
        }
        treeHoleRealtimeRef.current = api;
        setTreeHoleRealtimeReady(true);
      })
      .catch((err) => {
        console.warn('树洞实时连接失败', err);
      });
    return () => {
      cancelled = true;
      setTreeHoleRealtimeReady(false);
      void treeHoleRealtimeRef.current?.disconnect();
      treeHoleRealtimeRef.current = null;
    };
  }, []);

  const send = () => {
    const t = input.trim();
    if (!t) return;
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const category = categoryForNewMessage(tab);
    setMessages((m) => [
      ...m,
      {
        id: crypto.randomUUID(),
        author: '我',
        text: t,
        self: true,
        time,
        category,
      },
    ]);
    setInput('');
    if (isTreeHoleRealtimeEnabled() && treeHoleRealtimeRef.current) {
      void treeHoleRealtimeRef.current.send(t, category).catch((err) => {
        console.warn('树洞广播发送失败', err);
      });
    }
  };

  const filtered = useMemo(
    () => filterTreeHoleMessages(messages, tab),
    [messages, tab],
  );

  return (
    <div className="pt-24 pb-32 px-6 max-w-2xl mx-auto flex flex-col min-h-[70vh]">
      <section className="mb-6 text-center relative overflow-hidden rounded-xl p-8 bg-surface-low">
        <div
          className="absolute inset-0 opacity-25 bg-cover bg-center"
          style={{ backgroundImage: "url('/assets/images/nebula-bg.jpg')" }}
        />
        <div className="relative z-10 flex flex-col items-center gap-2">
          <div className="inline-flex items-center gap-2 text-secondary font-label text-[10px] uppercase tracking-widest">
            <Users size={14} />
            群聊树洞
          </div>
          <h2 className="font-headline text-3xl text-on-surface">匿名树洞</h2>
          <p className="font-body text-on-surface-variant text-sm tracking-wide opacity-90">
            与陌生灵魂同处一室，向宇宙诉说你的秘密。
          </p>
        </div>
      </section>

      <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar shrink-0">
        {TREE_ROOMS.map((cat, i) => (
          <button
            key={cat}
            type="button"
            onClick={() => setTab(i as TreeHoleTabIndex)}
            className={`flex-shrink-0 px-5 py-2 rounded-full text-sm font-medium transition-all ${
              i === tab ? 'border border-secondary text-secondary' : 'bg-surface-high text-on-surface hover:bg-surface-highest'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="flex-1 flex flex-col gap-3 overflow-y-auto mb-4 min-h-[240px]">
        <div className="flex items-center gap-2 text-on-surface-variant text-xs font-label px-1 flex-wrap">
          <MessageCircle size={14} />
          当前房间：星河大厅（群聊）
          {isTreeHoleRealtimeEnabled() && treeHoleRealtimeReady && (
            <span className="text-secondary">· 实时已连接</span>
          )}
        </div>
        {filtered.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.self ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 border ${
                msg.self
                  ? 'bg-primary/15 border-primary/30 text-on-surface'
                  : 'bg-surface-high border-outline-variant/15'
              }`}
            >
              <div className="flex items-center justify-between gap-4 text-[10px] font-label uppercase tracking-wider text-on-surface-variant mb-1">
                <span className={msg.self ? 'text-secondary' : 'text-primary'}>{msg.author}</span>
                <span>{msg.time}</span>
              </div>
              <p className="text-sm leading-relaxed">{msg.text}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 items-end sticky bottom-20 bg-background/95 backdrop-blur py-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="在群聊中发送一条匿名消息…"
          className="flex-1 bg-surface-low border border-outline-variant/20 rounded-2xl px-4 py-3 text-sm text-on-surface focus:border-primary focus:ring-0"
        />
        <button
          type="button"
          onClick={send}
          className="nebula-gradient px-5 py-3 rounded-2xl text-background font-label text-xs font-bold uppercase"
        >
          发送
        </button>
      </div>
    </div>
  );
};

export const MatchPage = () => {
  const [sessionId] = useState(() => getOrCreateSessionId());
  const [phase, setPhase] = useState<'idle' | 'searching' | 'done'>('idle');
  const [pair, setPair] = useState<MatchPairEvent | null>(null);

  useEffect(() => {
    const unSubBump = subscribeQueueBump(() => tryPairFromQueue());
    const unSubMatch = subscribeMatch(sessionId, (ev) => {
      setPair(ev);
      setPhase('done');
      const n = Number(localStorage.getItem(MATCH_COUNT_STORAGE_KEY) || '0');
      localStorage.setItem(MATCH_COUNT_STORAGE_KEY, String(n + 1));
    });
    return () => {
      unSubBump();
      unSubMatch();
      leaveMatchQueue(sessionId);
    };
  }, [sessionId]);

  const start = useCallback(() => {
    setPhase('searching');
    setPair(null);
    joinMatchQueue(sessionId);
  }, [sessionId]);

  const reset = () => {
    setPhase('idle');
    setPair(null);
    leaveMatchQueue(sessionId);
  };

  return (
    <div className="pt-24 pb-32 px-6 max-w-lg mx-auto w-full flex flex-col items-center gap-10 relative">
      <section className="w-full text-center space-y-4">
        <h2 className="font-headline text-3xl font-bold text-on-surface">寻找你的轨道</h2>
        <p className="text-on-surface-variant font-body text-sm tracking-wide opacity-80">
          点击匹配进入队列；当另一人也同时匹配时，将随机配对（无需实名）。
        </p>
      </section>

      <div className="relative w-72 h-72 flex items-center justify-center">
        <div className="absolute inset-0 border border-outline-variant/20 rounded-full animate-[spin_20s_linear_infinite]" />
        <div className="absolute inset-4 border border-outline-variant/10 rounded-full animate-[spin_15s_linear_infinite_reverse]" />

        <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex flex-col items-center">
          <Star size={16} className="text-secondary/40" fill="currentColor" />
          <span className="font-headline text-[10px] text-secondary/60">
            {phase === 'searching' ? '队列中' : phase === 'done' ? '已配对' : '待命'}
          </span>
        </div>

        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={phase === 'searching' ? undefined : start}
          disabled={phase === 'searching'}
          className="relative z-10 w-48 h-48 rounded-full nebula-gradient shadow-2xl flex flex-col items-center justify-center gap-2 text-background disabled:opacity-70"
        >
          <Zap size={40} fill="currentColor" />
          <span className="font-headline font-bold tracking-widest text-lg uppercase">
            {phase === 'searching' ? '匹配中…' : '开始匹配'}
          </span>
          {phase === 'searching' ? (
            <div className="absolute inset-0 bg-primary/20 animate-ping rounded-full -z-10" />
          ) : null}
        </motion.button>
      </div>

      {phase === 'searching' ? (
        <p className="text-sm text-on-surface-variant font-body text-center">
          已加入匹配队列。可打开另一标签页同时点击「开始匹配」以演示随机配对。
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-4 w-full">
        <GlassCard className="flex items-center gap-4 p-4">
          <div className="w-12 h-12 rounded-full bg-surface-high flex items-center justify-center">
            <Palette size={20} className="text-secondary" />
          </div>
          <div>
            <p className="font-label text-[10px] text-on-surface-variant uppercase tracking-tighter">氛围指数</p>
            <p className="font-headline text-xl text-on-surface">{phase === 'done' ? '共振' : '待激活'}</p>
          </div>
        </GlassCard>
        <GlassCard className="flex items-center gap-4 p-4">
          <div className="w-12 h-12 rounded-full bg-surface-high flex items-center justify-center">
            <Zap size={20} className="text-primary" />
          </div>
          <div>
            <p className="font-label text-[10px] text-on-surface-variant uppercase tracking-tighter">洞察</p>
            <p className="font-headline text-xl text-on-surface">{phase === 'done' ? '罕见' : '—'}</p>
          </div>
        </GlassCard>
      </div>

      {phase === 'done' && pair ? (
        <section className="w-full space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-headline text-lg font-bold text-secondary">神圣连接</h3>
            <button type="button" onClick={reset} className="text-xs font-label text-primary underline">
              再次匹配
            </button>
          </div>
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-secondary to-primary rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-1000" />
            <div className="relative bg-surface-low p-6 rounded-xl flex items-center gap-6 border border-outline-variant/10">
              <div className="relative">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-surface-highest flex items-center justify-center border-2 border-secondary/20">
                  <img
                    src="/assets/images/avatar-match.jpg"
                    alt="Avatar"
                    className="w-full h-full object-cover grayscale brightness-75"
                  />
                  <div className="absolute inset-0 bg-primary/20 mix-blend-color" />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-secondary w-7 h-7 rounded-full flex items-center justify-center border-2 border-surface-low">
                  <Shield size={12} className="text-background" fill="currentColor" />
                </div>
              </div>
              <div className="flex-1">
                <h4 className="font-headline text-2xl text-on-surface font-bold">{pair.partnerNickname}</h4>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="px-3 py-0.5 bg-surface-highest rounded-full font-label text-[10px] text-secondary uppercase tracking-widest border border-secondary/20">
                    {pair.partnerZodiacLabel}
                  </span>
                  <span className="text-on-surface-variant/60 font-label text-[10px] uppercase">随机匹配</span>
                </div>
              </div>
              <button
                type="button"
                className="bg-primary/10 hover:bg-primary/20 transition-colors p-3 rounded-full text-primary"
                aria-label="发消息"
              >
                <MessageSquare size={20} />
              </button>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
};

export const ProfilePage = ({ onLogout }: { onLogout: () => void }) => {
  const profile = useProfile();
  const matchCount = Number(localStorage.getItem(MATCH_COUNT_STORAGE_KEY) || '0');

  const roamDays = useMemo(() => {
    if (!profile?.joinedAt) return 1;
    const diff = Date.now() - new Date(profile.joinedAt).getTime();
    return Math.max(1, Math.floor(diff / 86400000));
  }, [profile?.joinedAt]);

  if (!profile) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center text-on-surface-variant">
        未登录
      </div>
    );
  }

  return (
    <div className="pt-24 pb-32 px-6 max-w-screen-md mx-auto">
      <section className="relative mb-12 text-center">
        <div className="relative inline-block mb-6">
          <div className="w-32 h-32 rounded-full p-1 nebula-gradient shadow-2xl">
            <div className="w-full h-full rounded-full bg-surface overflow-hidden flex items-center justify-center">
              <img
                src="/assets/images/avatar-profile.jpg"
                alt="Avatar"
                className="w-full h-full object-cover mix-blend-lighten opacity-80"
              />
            </div>
          </div>
          <div className="absolute bottom-0 right-0 glass-panel border border-outline-variant/15 w-10 h-10 rounded-full flex items-center justify-center text-secondary">
            <Star size={20} fill="currentColor" />
          </div>
        </div>
        <h2 className="font-headline text-3xl mb-1 tracking-tight text-on-surface">{profile.nickname}</h2>
        <p className="text-xs text-on-surface-variant font-body mb-2">手机 {maskCnMobilePhone(profile.phone)}</p>
        <div className="flex items-center justify-center gap-2 mb-8">
          <span className="text-secondary font-headline italic">{getZodiacLabel(profile.zodiacId)}</span>
          <span className="w-1 h-1 rounded-full bg-outline-variant" />
          <Droplets size={18} className="text-primary" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-surface-low rounded-lg p-6 text-left border border-outline-variant/10">
            <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">星际漫游天数</p>
            <p className="font-headline text-2xl text-primary">{roamDays}</p>
          </div>
          <div className="bg-surface-low rounded-lg p-6 text-left border border-outline-variant/10">
            <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">累计匹配次数</p>
            <p className="font-headline text-2xl text-secondary">{matchCount}</p>
          </div>
        </div>
      </section>

      <div className="mb-12 relative overflow-hidden rounded-xl p-8 nebula-gradient group cursor-pointer transition-transform duration-300 active:scale-[0.98]">
        <div className="absolute top-0 right-0 p-4 opacity-20 transform translate-x-4 -translate-y-4 group-hover:translate-x-2 transition-transform">
          <Sparkles size={120} />
        </div>
        <div className="relative z-10">
          <h3 className="font-headline text-xl text-background mb-2">查看今日启示</h3>
          <p className="text-background/80 text-sm max-w-[200px]">运势由生日与星座驱动生成。</p>
        </div>
      </div>

      <nav className="space-y-4">
        <h4 className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant px-2 mb-2">基础设置</h4>
        {[
          { icon: Settings, label: '资料设置' },
          { icon: Shield, label: '隐私保护' },
          { icon: MessageSquare, label: '意见反馈' },
          { icon: Info, label: '关于我们' },
        ].map((item, i) => (
          <a key={i} href="#" className="flex items-center justify-between p-4 bg-surface-low hover:bg-surface-high rounded-lg transition-colors group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-high text-primary group-hover:text-secondary transition-colors">
                <item.icon size={20} />
              </div>
              <span className="font-body text-on-surface">{item.label}</span>
            </div>
            <ChevronRight size={20} className="text-outline-variant group-hover:text-primary transition-colors" />
          </a>
        ))}
      </nav>

      <div className="mt-12 text-center">
        <button
          type="button"
          onClick={() => {
            if (
              window.confirm(
                '确定要注销吗？将清除本设备上的登录档案与匹配演示数据，且无法恢复。',
              )
            ) {
              onLogout();
            }
          }}
          className="text-error font-label text-[11px] uppercase tracking-widest flex items-center gap-2 mx-auto py-3 px-6 hover:opacity-80 transition-opacity"
        >
          <LogOut size={16} />
          注销账号
        </button>
      </div>
    </div>
  );
};
