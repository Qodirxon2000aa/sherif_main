import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Lottie from 'lottie-react';
import {
  Copy,
  Eye,
  ShoppingCart,
  Sparkles,
  CheckCircle2,
  Gift,
  Loader2,
  AlertCircle,
  RefreshCw,
  Wallet,
  X,
  User,
  Send,
  CheckCheck,
  EyeOff,
  Wand2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BodyPortal } from '../components/BodyPortal';
import { Card, CardContent, Button } from '../components/UI';
import { getTelegramInitData, useTezpremium } from '../context/TezpremiumContext';
import { parseJsonMaybeLeadingNoise } from '../utils/parseJsonResponse';

import heart from '../assets/heart.json';
import teddy_bear from '../assets/teddy_bear.json';
import gift_box from '../assets/gift_box.json';
import rose from '../assets/rose.json';
import cake from '../assets/cake.json';
import bouquet from '../assets/bouquet.json';
import rocket from '../assets/rocket.json';
import trophy from '../assets/trophy.json';
import ring from '../assets/ring.json';
import diamond from '../assets/diamond.json';
import champagne from '../assets/champagne.json';
import love_teddy from '../assets/love_teddy.json';
import love_heart from '../assets/love_heart.json';
import tree from '../assets/tree.json';
import new_bear from '../assets/new_bear.json';
import bear from '../assets/bear.json';
import bear2 from '../assets/bear2.json';
import bear3 from '../assets/bear3.json';
import bear4 from '../assets/bear4.json';
import egg_bear from '../assets/egg_bear.json';
import money_pot from '../assets/money_pot.json';
import march_bear from '../assets/march_bear.json';

/** info.php `name` → assets/*.json (bear3 = serverdagi april_bear bilan bir xil) */
const GIFT_ANIMATIONS = {
  heart,
  teddy_bear,
  gift_box,
  rose,
  cake,
  bouquet,
  rocket,
  trophy,
  ring,
  diamond,
  champagne,
  love_teddy,
  love_heart,
  tree,
  new_bear,
  bear,
  bear2,
  bear3,
  bear4,
  egg_bear,
  money_pot,
  march_bear,
  april_bear: bear3,
};

const GIFT_EMOJIS = {
  heart: '❤️',
  teddy_bear: '🐻',
  gift_box: '🎁',
  rose: '🌹',
  cake: '🎂',
  bouquet: '💐',
  rocket: '🚀',
  trophy: '🏆',
  ring: '💍',
  diamond: '💎',
  champagne: '🍾',
  love_teddy: '🧸',
  love_heart: '💝',
  tree: '🌳',
  new_bear: '🐻',
  march_bear: '🐻',
  april_bear: '🐻',
  bear3: '🐻',
  bear4: '🐻',
  egg_bear: '🐻',
  money_pot: '💰',
  bear: '🐻',
  bear2: '🐻',
};

function normalizeGiftNameKey(name) {
  return String(name ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');
}

function prepareLottieAnimationData(data) {
  if (!data || typeof data !== 'object') return data;
  try {
    const o = JSON.parse(JSON.stringify(data));
    delete o.tgs;
    return o;
  } catch {
    return data;
  }
}

const OPENROUTER_KEY = import.meta.env.VITE_OPENROUTER_API_KEY ?? '';
/** Market.jsx bilan bir xil: `giftlar.php` + `?type=` */
const NFT_API_BASE =
  import.meta.env.VITE_NFT_API_BASE ?? 'https://tezpremium.uz/uzbstar/giftlar.php';
const ODDIY_API_BASE = import.meta.env.VITE_ODDIY_API_BASE ?? 'https://tezpremium.uz/MilliyDokon/gifts/info.php';
const NFT_ORDER_API_BASE =
  import.meta.env.VITE_NFT_ORDER_API_BASE ??
  'https://tezpremium.uz/SherifZakaz/webapp/gifting.php';
const USER_CHECK_API = import.meta.env.VITE_USER_CHECK_API ?? 'https://tezpremium.uz/starsapi/user.php';

/** `VITE_NFT_ENABLED=false` bo‘lsa NFT tab kartalari va buyurtma o‘chadi */
const NFT_SERVICE_ENABLED = import.meta.env.VITE_NFT_ENABLED !== 'false';

const NFT_FILTERS = [
  { key: 'all', label: 'Barcha' },
  { key: 'cheap', label: 'Arzon ↑' },
  { key: 'expensive', label: 'Qimmat ↓' },
  { key: 'new', label: 'Yangi' },
  { key: 'old', label: 'Eski' },
];

const ODDIY_TYPE_FILTERS = [
  { key: 'all', label: 'Barcha' },
  { key: 'common', label: 'Common' },
  { key: 'unique', label: 'Unique' },
];

const ODDIY_TYPE_BADGE_STYLE = {
  common:
    'border-zinc-200/50 bg-white/75 text-zinc-600 shadow-sm shadow-black/5 dark:border-zinc-600 dark:bg-zinc-800/75 dark:text-zinc-400',
  unique:
    'border-violet-400/35 bg-gradient-to-br from-violet-600/92 via-fuchsia-600/88 to-purple-700/92 text-white shadow-md shadow-violet-500/25',
};

function oddiyGiftTypeBadge(typeRaw) {
  const label = String(typeRaw ?? '').trim();
  const key = label.toLowerCase();
  const className =
    ODDIY_TYPE_BADGE_STYLE[key] ??
    'border-zinc-200/50 bg-zinc-100/80 text-zinc-600 dark:border-zinc-600 dark:bg-zinc-800/80 dark:text-zinc-400';
  return { label: label || '—', className };
}

function formatFetchNetworkError(err) {
  const m = err?.message ?? String(err);
  if (/load failed|failed to fetch|networkerror|network request failed/i.test(m)) {
    return "Tarmoq xatosi: server javob bermadi. Internetni tekshiring; agar balans ochilsa — `gift_order.php` (PHP) xato yoki CORS sozlamasini tekshiring.";
  }
  return m;
}

/** Backend `gift_order.php` muvaffaqiyat: `{ ok: true, status: "success", order_id, api }` */
function isGiftOrderApiSuccess(data) {
  if (!data || typeof data !== 'object') return false;
  if (data.ok === true) return true;
  return String(data.status ?? '').toLowerCase() === 'success';
}

/** Telegram gift `id` — 64-bit, JS Number dan tashqari; faqat string/BigInt */
function oddiyGiftIdsEqual(a, b) {
  const sa = String(a ?? '').trim();
  const sb = String(b ?? '').trim();
  if (sa === sb) return true;
  if (!/^\d+$/.test(sa) || !/^\d+$/.test(sb)) return false;
  try {
    return BigInt(sa) === BigInt(sb);
  } catch {
    return false;
  }
}

function normalizeOddiyGiftFromApi(g) {
  if (!g || typeof g !== 'object') return null;
  const idStr = g.id != null ? String(g.id).trim() : '';
  if (!idStr || !/^\d+$/.test(idStr)) return null;
  const name = String(g.name ?? '').trim();
  if (!name) return null;
  const price = Number(g.price);
  const priceNum = Number.isFinite(price) && price >= 0 ? price : 0;
  return {
    ...g,
    id: idStr,
    name,
    price: priceNum,
    amount: g.amount != null ? String(g.amount) : '',
    type: String(g.type ?? '').trim(),
  };
}

/** Buyurtma: `gift_order.php` bilan bir xil manbadan — info.php dan `id` va `price` */
async function resolveOddiyGiftFromInfoApi(localGift) {
  try {
    const res = await fetch(ODDIY_API_BASE, {
      headers: { Accept: 'application/json, */*' },
      cache: 'no-store',
    });
    const rawText = await res.text();
    const data = parseJsonMaybeLeadingNoise(rawText);
    if (!data?.ok || !Array.isArray(data.gifts)) {
      return { ok: false, message: "info.php dan ro‘yxat olinmadi" };
    }
    const list = data.gifts.map(normalizeOddiyGiftFromApi).filter(Boolean);
    if (list.length === 0) {
      return { ok: false, message: 'Giftlar ro‘yxati bo‘sh' };
    }
    const sid = String(localGift?.id ?? '').trim();
    let found = list.find((g) => oddiyGiftIdsEqual(g.id, sid));
    if (!found && localGift?.name) {
      const key = normalizeGiftNameKey(localGift.name);
      found = list.find((g) => normalizeGiftNameKey(g.name) === key);
    }
    if (!found) {
      return {
        ok: false,
        message: "Bu gift hozirgi ro‘yxatda yo‘q. Sahifani yangilab qayta urinib ko‘ring.",
      };
    }
    if (found.price <= 0) {
      return { ok: false, message: 'Bu gift uchun narx info.php da yo‘q' };
    }
    return { ok: true, gift: found };
  } catch {
    return { ok: false, message: "info.php ga ulanib bo‘lmadi" };
  }
}

function GiftAnimation({ name }) {
  const nameKey = normalizeGiftNameKey(name);
  const rawAnim = useMemo(
    () =>
      GIFT_ANIMATIONS[nameKey] ??
      GIFT_ANIMATIONS[String(name ?? '').trim()] ??
      null,
    [name, nameKey]
  );
  const animData = useMemo(
    () => (rawAnim ? prepareLottieAnimationData(rawAnim) : null),
    [rawAnim]
  );

  const wrapRef = useRef(null);
  const lottieRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [played, setPlayed] = useState(false);

  useEffect(() => {
    setPlayed(false);
  }, [nameKey, animData]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (visible && !played && lottieRef.current && animData) {
      lottieRef.current.goToAndPlay(0, true);
      setPlayed(true);
    }
  }, [visible, played, animData]);

  return (
    <div ref={wrapRef} className="flex h-full w-full items-center justify-center">
      {animData ? (
        <Lottie
          key={nameKey}
          lottieRef={lottieRef}
          animationData={animData}
          loop={false}
          autoplay={false}
          style={{ width: '82%', height: '82%', display: 'block' }}
        />
      ) : (
        <span className="select-none text-5xl leading-none">
          {GIFT_EMOJIS[nameKey] || GIFT_EMOJIS[name] || '🎁'}
        </span>
      )}
    </div>
  );
}

function useUserSearch() {
  const [username, setUsername] = useState('');
  const [anonim, setAnonim] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [checkLoading, setCheckLoad] = useState(false);
  const [checkError, setCheckError] = useState(null);
  const debounceRef = useRef(null);

  const cleanUsername = username.replace(/^@/, '').trim();

  useEffect(() => {
    if (!cleanUsername) {
      setUserInfo(null);
      setCheckError(null);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setCheckLoad(true);
      setCheckError(null);
      setUserInfo(null);
      try {
        const res = await fetch(`${USER_CHECK_API}?username=${encodeURIComponent(cleanUsername)}`);
        const data = await res.json();
        if (data.username) setUserInfo(data);
        else setCheckError(data.message || data.error || "Foydalanuvchi topilmadi");
      } catch {
        setCheckError("Tekshirib bo'lmadi");
      } finally {
        setCheckLoad(false);
      }
    }, 600);
    return () => clearTimeout(debounceRef.current);
  }, [cleanUsername]);

  return { username, setUsername, cleanUsername, anonim, setAnonim, userInfo, checkLoading, checkError };
}

function useAIComment() {
  const [commentOn, setCommentOn] = useState(false);
  const [comment, setComment] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [showAiInput, setShowAiInput] = useState(false);

  const generateAIGreeting = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);

    const FREE_MODELS = [
      'mistralai/mistral-7b-instruct:free',
      'huggingfaceh4/zephyr-7b-beta:free',
      'openchat/openchat-7b:free',
      'gryphe/mythomist-7b:free',
    ];

    if (OPENROUTER_KEY) {
      for (const model of FREE_MODELS) {
        try {
          const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${OPENROUTER_KEY}`,
              'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : '',
              'X-Title': 'Gift App',
            },
            body: JSON.stringify({
              model,
              max_tokens: 150,
              messages: [
                {
                  role: 'user',
                  content: `Write a short sincere greeting in Uzbek language for: "${aiPrompt}". Only return the greeting text, nothing else.`,
                },
              ],
            }),
          });
          const data = await response.json();
          if (data.error) continue;
          const text = data?.choices?.[0]?.message?.content?.trim() || '';
          if (text) {
            setComment(text);
            setShowAiInput(false);
            setAiLoading(false);
            return;
          }
        } catch {
          /* next model */
        }
      }
    }

    const fallbacks = [
      `💝 ${aiPrompt} munosabati bilan sizni qalbdan tabriklayman! Baxt, sog'lik va omad tilayman! 🎉`,
      `🌸 Aziz do'stim, ${aiPrompt} bilan tabriklayman! Hayotingiz doim baxtli bo'lsin! ✨`,
      `🎊 ${aiPrompt}! Sizga eng yaxshi tilaklar! Sog'lik baxt va farovonlik tilayman!💫`,
    ];
    setComment(fallbacks[Math.floor(Math.random() * fallbacks.length)]);
    setShowAiInput(false);
    setAiLoading(false);
  };

  return {
    commentOn,
    setCommentOn,
    comment,
    setComment,
    aiLoading,
    aiPrompt,
    setAiPrompt,
    showAiInput,
    setShowAiInput,
    generateAIGreeting,
  };
}

function ModalShell({ title, subtitle, thumbContent, onClose, children }) {
  return (
    <BodyPortal>
      <div className="fixed inset-0 z-[1000] flex items-end justify-center">
        <button
          type="button"
          aria-label="Close"
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
        <div
          className="relative z-10 max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white pb-12 shadow-2xl dark:bg-zinc-950"
          style={{ maxHeight: '92vh' }}
        >
          <div className="p-5 pb-8">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white">{title}</h2>
                <p className="mt-0.5 text-xs capitalize text-zinc-500 dark:text-zinc-400">{subtitle}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 transition-colors hover:text-zinc-900 dark:bg-zinc-800 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mx-auto mb-5 h-20 w-20 overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800">{thumbContent}</div>
            {children}
          </div>
        </div>
      </div>
    </BodyPortal>
  );
}

function UserInputSection({ username, setUsername, cleanUsername, userInfo, checkLoading, checkError }) {
  return (
    <div className="mb-3 space-y-2">
      <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Kimga yuborish?
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 select-none text-sm font-medium text-zinc-400">
          @
        </span>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="username"
          className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-3 pl-7 pr-10 text-sm font-medium text-zinc-900 transition-all focus:border-blue-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:bg-zinc-900"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {checkLoading && <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />}
          {!checkLoading && userInfo && <CheckCheck className="h-4 w-4 text-green-500" />}
          {!checkLoading && checkError && cleanUsername && <AlertCircle className="h-4 w-4 text-red-500" />}
        </div>
      </div>

      {userInfo && !checkLoading && (
        <div className="flex items-center gap-3 rounded-xl border border-green-500/20 bg-green-500/10 px-3 py-2.5">
          {userInfo.photo ? (
            <img src={userInfo.photo} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500/20">
              <User className="h-4 w-4 text-green-500" />
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-zinc-900 dark:text-white">
              {userInfo.name || userInfo.first_name || cleanUsername}
            </p>
            <p className="text-xs text-zinc-500">@{userInfo.username || cleanUsername}</p>
          </div>
          <CheckCheck className="ml-auto h-4 w-4 shrink-0 text-green-500" />
        </div>
      )}
    </div>
  );
}

function CommentSection({
  commentOn,
  setCommentOn,
  comment,
  setComment,
  aiLoading,
  aiPrompt,
  setAiPrompt,
  showAiInput,
  setShowAiInput,
  generateAIGreeting,
}) {
  return (
    <>
      <button
        type="button"
        onClick={() => setCommentOn((v) => !v)}
        className={`mb-2 flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
          commentOn
            ? 'border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400'
            : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800'
        }`}
      >
        <span className="shrink-0 text-base">💬</span>
        <div className="min-w-0">
          <p className="text-sm font-semibold">Izoh qo&apos;shish</p>
          <p className="text-[11px] opacity-70">Giftga xabar biriktirish</p>
        </div>
        <div
          className={`relative ml-auto h-5 w-9 shrink-0 rounded-full transition-all ${commentOn ? 'bg-blue-500' : 'bg-zinc-300 dark:bg-zinc-600'}`}
        >
          <div
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${commentOn ? 'left-4' : 'left-0.5'}`}
          />
        </div>
      </button>

      <AnimatePresence>
        {commentOn && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 overflow-hidden"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-zinc-500">Xabar matni</span>
              <button
                type="button"
                onClick={() => setShowAiInput(!showAiInput)}
                className="flex items-center gap-1 rounded-lg bg-blue-500/10 px-2 py-1 text-[10px] font-bold text-blue-600 hover:bg-blue-500/20 dark:text-blue-400"
              >
                <Wand2 className="h-3 w-3" />
                AI BILAN YOZISH
              </button>
            </div>

            {showAiInput && (
              <div className="mb-3 space-y-2 rounded-xl border border-blue-500/20 bg-blue-500/5 p-3">
                <p className="text-[11px] font-medium text-blue-600 dark:text-blue-400">Kimga va nima uchunligini ayting:</p>
                <div className="flex gap-2">
                  <input
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Masalan: Onamga tug'ilgan kun tabrigi"
                    className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-blue-500 dark:border-zinc-600 dark:bg-zinc-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={generateAIGreeting}
                    disabled={aiLoading || !aiPrompt}
                    className="rounded-lg bg-blue-500 p-2 text-white disabled:opacity-50"
                  >
                    {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tabrik yoki xabar yozing..."
              maxLength={200}
              rows={3}
              className="w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-900 placeholder:text-zinc-400/50 focus:border-blue-500 focus:bg-zinc-50 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:bg-zinc-900"
              style={{ WebkitAppearance: 'none', appearance: 'none' }}
            />
            <p className="mt-1 text-right text-[10px] text-zinc-400">{comment.length}/200</p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function AnonimToggle({ anonim, setAnonim }) {
  return (
    <button
      type="button"
      onClick={() => setAnonim((v) => !v)}
      className={`mb-4 flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
        anonim
          ? 'border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400'
          : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400'
      }`}
    >
      <EyeOff className="h-4 w-4 shrink-0" />
      <div className="min-w-0">
        <p className="text-sm font-semibold">Anonim yuborish</p>
        <p className="text-[11px] opacity-70">Kim yuborganini ko&apos;rsatmaydi</p>
      </div>
      <div className={`relative ml-auto h-5 w-9 shrink-0 rounded-full ${anonim ? 'bg-blue-500' : 'bg-zinc-300 dark:bg-zinc-600'}`}>
        <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${anonim ? 'left-4' : 'left-0.5'}`} />
      </div>
    </button>
  );
}

function SuccessOverlay({ text = "Gift muvaffaqiyatli jo'natildi" }) {
  return (
    <BodyPortal>
      <div
        className="fixed inset-0 z-[1000] flex items-center justify-center"
        style={{
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          backgroundColor: 'rgba(0,0,0,0.55)',
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-6"
        >
          <div className="flex h-28 w-28 items-center justify-center rounded-full border border-green-500/30 bg-green-500/20 shadow-2xl shadow-green-500/20">
            <CheckCircle2 className="h-14 w-14 text-green-400" />
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white">🎉 Yuborildi!</p>
            <p className="mt-1 text-sm text-white/60">{text}</p>
          </div>
        </motion.div>
      </div>
    </BodyPortal>
  );
}

function BuyOddiyModal({ gift, onClose, onSuccess }) {
  const { apiFetch } = useTezpremium();
  const userSearch = useUserSearch();
  const aiComment = useAIComment();
  const [orderLoading, setOrderLoad] = useState(false);
  const [orderError, setOrderError] = useState(null);
  const [ordered, setOrdered] = useState(false);

  const { cleanUsername, anonim, userInfo } = userSearch;
  const { commentOn, comment } = aiComment;

  const initDataSnapshot = getTelegramInitData();
  const hasInitData = Boolean(initDataSnapshot);

  const handleOrder = async () => {
    if (!cleanUsername) return;
    const initData = getTelegramInitData();
    if (!initData) {
      setOrderError(
        "initData yo‘q — ilovani bot orqali qayta oching (Telegram Mini App)."
      );
      return;
    }

    setOrderLoad(true);
    setOrderError(null);
    try {
      const resolved = await resolveOddiyGiftFromInfoApi(gift);
      if (!resolved.ok) {
        setOrderError(resolved.message);
        return;
      }
      const fromInfo = resolved.gift;

      const recipient = cleanUsername.replace(/^@/, '').trim();
      const params = {
        gift_id: String(fromInfo.id),
        price: fromInfo.price,
        username: recipient,
        anonim: anonim ? 'true' : 'false',
      };
      if (fromInfo.amount) params.amount = fromInfo.amount;
      if (commentOn && comment.trim()) params.comment = comment.trim();

      const data = await apiFetch('gift_order.php', params);

      if (isGiftOrderApiSuccess(data)) {
        setOrdered(true);
        onSuccess?.();
        setTimeout(() => onClose(), 3000);
      } else {
        const msg = data.message || data.error || data.status || 'Xatolik yuz berdi';
        if (/initData is required/i.test(String(msg))) {
          setOrderError(
            "Sessiya topilmadi. Telegramda mini-appni yoping va botdan qayta oching."
          );
        } else {
          setOrderError(msg);
        }
      }
    } catch (err) {
      setOrderError(formatFetchNetworkError(err));
    } finally {
      setOrderLoad(false);
    }
  };

  const canOrder =
    hasInitData && !orderLoading && cleanUsername && (userInfo || anonim) && !ordered;

  return (
    <>
      <ModalShell
        title="Gift yuborish"
        subtitle={`${String(gift.name).replace(/_/g, ' ')} · ${gift.price.toLocaleString('uz-UZ')} UZS`}
        thumbContent={<GiftAnimation name={gift.name} />}
        onClose={onClose}
      >
        <UserInputSection {...userSearch} />
        <CommentSection {...aiComment} />
        <AnonimToggle anonim={anonim} setAnonim={userSearch.setAnonim} />

        {!hasInitData && (
          <div className="mb-3 flex items-center gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="text-xs text-amber-800 dark:text-amber-200">
              Gift yuborish faqat bot orqali ochilgan Mini Appda ishlaydi. Brauzerda ochilsa{' '}
              <code className="rounded bg-black/10 px-1 dark:bg-white/10">initData</code> bo‘lmaydi.
            </p>
          </div>
        )}

        {orderError && (
          <div className="mb-3 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
            <p className="text-xs text-red-500">{orderError}</p>
          </div>
        )}

        {!ordered && (
          <button
            type="button"
            onClick={handleOrder}
            disabled={!canOrder}
            className={`flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-bold transition-all ${
              canOrder
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20 hover:bg-blue-600 active:scale-95'
                : 'cursor-not-allowed bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500'
            }`}
          >
            {orderLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Yuborilmoqda...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Gift yuborish
              </>
            )}
          </button>
        )}
      </ModalShell>

      {ordered && <SuccessOverlay text="Gift muvaffaqiyatli jo'natildi" />}
    </>
  );
}

function BuyNftModal({ gift, onClose, onSuccess, nftServiceEnabled }) {
  const userSearch = useUserSearch();
  const [orderLoading, setOrderLoad] = useState(false);
  const [orderError, setOrderError] = useState(null);
  const [ordered, setOrdered] = useState(false);
  const [imgErr, setImgErr] = useState(false);

  const { cleanUsername } = userSearch;

  const formatName = (nftId) => {
    if (!nftId) return 'Gift';
    return nftId.split('-')[0].replace(/([A-Z])/g, ' $1').trim();
  };

  const handleOrder = async () => {
    if (!cleanUsername) return;
    if (!nftServiceEnabled) {
      setOrderError("Xizmat vaqtincha o'chirilgan");
      return;
    }

    const initData = getTelegramInitData();
    if (!initData) {
      setOrderError("Telegram initData topilmadi. Bot orqali qayta kiring.");
      return;
    }

    setOrderLoad(true);
    setOrderError(null);
    try {
      const giftIdStr = String(gift.id ?? '').trim();
      if (!giftIdStr) {
        setOrderError("Noto'g'ri gift ID");
        setOrderLoad(false);
        return;
      }

      const atUser = `@${cleanUsername.replace(/^@/, '').trim()}`;
      const body = {
        initData,
        init_data: initData,
        gift_id: giftIdStr,
        username: atUser,
        sent: atUser,
      };

      const res = await fetch(NFT_ORDER_API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, */*',
        },
        body: JSON.stringify(body),
      });
      const rawText = await res.text();
      const data = parseJsonMaybeLeadingNoise(rawText);
      if (!data || typeof data !== 'object') {
        setOrderError("Server javobi noto‘g‘ri");
        return;
      }

      if (data.ok === true || data.status === 'success') {
        setOrdered(true);
        onSuccess?.();
        setTimeout(() => onClose(), 3000);
      } else {
        const msg = data.message || data.error || 'Xatolik yuz berdi';
        if (/initData is required/i.test(String(msg))) {
          setOrderError('Sessiya topilmadi. Telegramda mini-appni yoping va botdan qayta oching.');
        } else {
          setOrderError(msg);
        }
      }
    } catch (err) {
      setOrderError("Serverga ulanib bo'lmadi: " + err.message);
    } finally {
      setOrderLoad(false);
    }
  };

  const canOrder =
    nftServiceEnabled && !orderLoading && cleanUsername.length > 2 && !ordered;

  return (
    <>
      <ModalShell
        title="NFT Gift yuborish"
        subtitle={`${formatName(gift.nft_id)} · ${gift.price.toLocaleString('uz-UZ')} UZS`}
        thumbContent={
          !imgErr && gift.photo ? (
            <img
              src={gift.photo}
              alt={formatName(gift.nft_id)}
              className="h-full w-full object-cover"
              onError={() => setImgErr(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-zinc-200 dark:bg-zinc-800">
              <Gift className="h-10 w-10 text-zinc-400" />
            </div>
          )
        }
        onClose={onClose}
      >
        <UserInputSection {...userSearch} />

        {!nftServiceEnabled && (
          <div className="mb-3 flex items-center gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="text-xs text-amber-800 dark:text-amber-200/90">
              Xizmat vaqtincha o&apos;chirilgan
            </p>
          </div>
        )}

        {orderError && (
          <div className="mb-3 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
            <p className="text-xs text-red-500">{orderError}</p>
          </div>
        )}

        {!ordered && (
          <button
            type="button"
            onClick={handleOrder}
            disabled={!canOrder}
            className={`flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-bold transition-all ${
              canOrder
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20 hover:bg-blue-600 active:scale-95'
                : 'cursor-not-allowed bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500'
            }`}
          >
            {orderLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Yuborilmoqda...
              </>
            ) : !nftServiceEnabled ? (
              <>
                <AlertCircle className="h-4 w-4" />
                Xizmat o&apos;chirilgan
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                NFT Gift yuborish
              </>
            )}
          </button>
        )}
      </ModalShell>

      {ordered && <SuccessOverlay text="NFT Gift muvaffaqiyatli jo'natildi" />}
    </>
  );
}

function formatNftName(nftId) {
  if (!nftId) return 'Gift';
  return nftId.split('-')[0].replace(/([A-Z])/g, ' $1').trim();
}

export function GiftsMarketView({ onNavigateHome }) {
  const { apiUser, refreshUser } = useTezpremium();
  const [mainTab, setMainTab] = useState('nft');
  const [oddiyFilter, setOddiyFilter] = useState('cheap');
  const [oddiyTypeFilter, setOddiyTypeFilter] = useState('all');
  const [activeFilter, setActiveFilter] = useState('all');
  const [copiedId, setCopiedId] = useState(null);
  const [gifts, setGifts] = useState([]);
  const [nftLoading, setNftLoading] = useState(true);
  const [nftError, setNftError] = useState(null);
  const [oddiyGifts, setOddiyGifts] = useState([]);
  const [oddiyLoading, setOddiyLoading] = useState(false);
  const [oddiyError, setOddiyError] = useState(null);
  const [buyGift, setBuyGift] = useState(null);
  const [buyNftGift, setBuyNftGift] = useState(null);

  const userBalance = apiUser?.balanceUzs ?? 0;

  const fetchNftGifts = useCallback(async (type = 'all', opts = {}) => {
    const silent = opts.silent === true;
    if (!silent) {
      setNftLoading(true);
      setNftError(null);
    }
    try {
      const url = type === 'all' ? NFT_API_BASE : `${NFT_API_BASE}?type=${encodeURIComponent(type)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.ok && Array.isArray(data.gifts)) {
        const next = data.gifts;
        setGifts((prev) => {
          if (silent && JSON.stringify(prev) === JSON.stringify(next)) return prev;
          return next;
        });
        if (!silent) setNftError(null);
      } else {
        if (!silent) {
          setGifts([]);
          setNftError("Ma'lumot olishda xatolik");
        }
      }
    } catch {
      if (!silent) {
        setGifts([]);
        setNftError("Serverga ulanib bo'lmadi");
      }
    } finally {
      if (!silent) setNftLoading(false);
    }
  }, []);

  const fetchOddiyGifts = useCallback(async () => {
    setOddiyLoading(true);
    setOddiyError(null);
    try {
      const res = await fetch(ODDIY_API_BASE, {
        headers: { Accept: 'application/json, */*' },
        cache: 'no-store',
      });
      const rawText = await res.text();
      const data = parseJsonMaybeLeadingNoise(rawText);
      if (!data) {
        setOddiyGifts([]);
        setOddiyError("Javobni o'qib bo'lmadi");
        return;
      }
      if (!res.ok) {
        setOddiyGifts([]);
        setOddiyError(`HTTP ${res.status}`);
        return;
      }
      if (data.ok && Array.isArray(data.gifts)) {
        const normalized = data.gifts.map(normalizeOddiyGiftFromApi).filter(Boolean);
        setOddiyGifts(normalized);
        if (normalized.length === 0 && data.gifts.length > 0) {
          setOddiyError("Noto'g'ri gift ma'lumoti");
        }
      } else {
        setOddiyGifts([]);
        setOddiyError(data.message || data.error || "Ma'lumot olishda xatolik");
      }
    } catch {
      setOddiyGifts([]);
      setOddiyError("Serverga ulanib bo'lmadi");
    } finally {
      setOddiyLoading(false);
    }
  }, []);

  const handleOddiyOrderSuccess = useCallback(() => {
    void refreshUser();
    void fetchOddiyGifts();
  }, [refreshUser, fetchOddiyGifts]);

  const handleNftOrderSuccess = useCallback(() => {
    void refreshUser();
    void fetchNftGifts(activeFilter, { silent: true });
  }, [refreshUser, fetchNftGifts, activeFilter]);

  useEffect(() => {
    if (mainTab !== 'nft') return;
    void fetchNftGifts(activeFilter, { silent: false });
    const id = window.setInterval(() => {
      void fetchNftGifts(activeFilter, { silent: true });
    }, 5000);
    return () => window.clearInterval(id);
  }, [mainTab, activeFilter, fetchNftGifts]);

  useEffect(() => {
    if (mainTab === 'oddiy' && oddiyGifts.length === 0) void fetchOddiyGifts();
  }, [mainTab, oddiyGifts.length, fetchOddiyGifts]);

  const handleFilterChange = (key) => {
    if (key === activeFilter) return;
    setActiveFilter(key);
    setGifts([]);
  };

  const handleMainTab = (tab) => {
    if (tab === mainTab) return;
    setMainTab(tab);
    if (tab === 'nft') {
      setGifts([]);
      setNftError(null);
      setNftLoading(true);
    }
  };

  const handleCopy = (gift) => {
    if (gift?.link) navigator.clipboard.writeText(gift.link).catch(() => {});
    setCopiedId(gift.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const canBuy = (price) => userBalance >= price;

  const oddiyList = useMemo(() => {
    let list = [...oddiyGifts];
    if (oddiyTypeFilter !== 'all') {
      list = list.filter(
        (g) => String(g.type ?? '').trim().toLowerCase() === oddiyTypeFilter
      );
    }
    list.sort((a, b) => (oddiyFilter === 'cheap' ? a.price - b.price : b.price - a.price));
    return list;
  }, [oddiyGifts, oddiyFilter, oddiyTypeFilter]);

  const minOddiyPrice = useMemo(
    () => (oddiyGifts.length > 0 ? Math.min(...oddiyGifts.map((g) => g.price)) : 0),
    [oddiyGifts]
  );

  const minVisibleOddiyPrice = useMemo(
    () => (oddiyList.length > 0 ? Math.min(...oddiyList.map((g) => g.price)) : 0),
    [oddiyList]
  );

  const minNftPrice = useMemo(
    () => (gifts.length > 0 ? Math.min(...gifts.map((g) => g.price)) : 0),
    [gifts]
  );

  const canAffordAny = gifts.length > 0 && userBalance >= minNftPrice;
  const canAffordAnyOddiy = oddiyGifts.length > 0 && userBalance >= minOddiyPrice;

  return (
    <div className="min-h-0 space-y-4 pb-2">
      <Card className="overflow-hidden border-none bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 p-0 text-white shadow-lg">
        <CardContent className="px-4 pb-5 pt-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-1 text-xs text-white/70">Sizning balansingiz</p>
              <h2 className="text-2xl font-bold leading-none">
                {userBalance.toLocaleString('uz-UZ')}
                <span className="ml-1 text-base font-normal">UZS</span>
              </h2>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
              <Wallet className="h-6 w-6" />
            </div>
          </div>
          {((mainTab === 'nft' && !nftLoading && gifts.length > 0 && !canAffordAny) ||
            (mainTab === 'oddiy' && !oddiyLoading && oddiyGifts.length > 0 && !canAffordAnyOddiy)) && (
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-white/80" />
              <p className="text-xs text-white/80">Giftlar sotib olish uchun balansingizni to&apos;ldiring</p>
              <button
                type="button"
                onClick={() => onNavigateHome?.()}
                className="ml-auto shrink-0 rounded-lg bg-white/20 px-2.5 py-1 text-xs font-semibold transition-all hover:bg-white/30"
              >
                To&apos;ldirish
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-2">
        {[
          { key: 'nft', icon: <Sparkles className="h-4 w-4" />, label: 'NFT Giftlar' },
          { key: 'oddiy', icon: <span className="text-base leading-none">🎁</span>, label: 'Oddiy Giftlar' },
        ].map(({ key, icon, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => handleMainTab(key)}
            className={`flex items-center justify-center gap-2 rounded-2xl border py-3 text-sm font-semibold transition-all ${
              mainTab === key
                ? 'border-blue-500 bg-blue-500 text-white shadow-md'
                : 'border-zinc-200 bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
            }`}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      {mainTab === 'nft' && (
        <>
          <div className="scrollbar-hide flex gap-1.5 overflow-x-auto pb-0.5">
            {NFT_FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => handleFilterChange(f.key)}
                className={`shrink-0 whitespace-nowrap rounded-xl border px-3.5 py-2 text-sm font-medium transition-all ${
                  activeFilter === f.key
                    ? 'border-blue-500 bg-blue-500 text-white'
                    : 'border-zinc-200 bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {!NFT_SERVICE_ENABLED && (
            <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              <p className="text-xs leading-snug text-red-600/90 dark:text-red-400/90">
                NFT gift yuborish hozircha mumkin emas.{' '}
                <strong className="font-semibold">Xizmat vaqtincha o&apos;chirilgan</strong> — keyinroq urinib
                ko&apos;ring.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Card className="p-0">
              <CardContent className="px-4 pb-4 pt-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-pink-500/10">
                    <Gift className="h-4 w-4 text-pink-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">Jami giftlar</p>
                    <p className="mt-0.5 text-xl font-bold leading-none text-zinc-900 dark:text-white">
                      {nftLoading ? '—' : gifts.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="p-0">
              <CardContent className="px-4 pb-4 pt-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">Eng arzon</p>
                    <p className="mt-0.5 text-xl font-bold leading-none text-zinc-900 dark:text-white">
                      {nftLoading || gifts.length === 0 ? '—' : minNftPrice.toLocaleString('uz-UZ')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="p-0">
            <CardContent className="px-3 pb-4 pt-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
                  {NFT_FILTERS.find((f) => f.key === activeFilter)?.label ?? 'Giftlar'}
                </h3>
                <div className="flex items-center gap-2">
                  {!nftLoading && <span className="text-xs text-zinc-500">{gifts.length} ta</span>}
                  <button
                    type="button"
                    onClick={() => fetchNftGifts(activeFilter)}
                    className="flex h-6 w-6 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:text-zinc-900 dark:hover:text-white"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${nftLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {nftLoading && (
                <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                  <Loader2 className="mb-3 h-8 w-8 animate-spin" />
                  <p className="text-sm">Yuklanmoqda...</p>
                </div>
              )}
              {!nftLoading && nftError && (
                <div className="flex flex-col items-center justify-center py-10 text-zinc-500">
                  <AlertCircle className="mb-3 h-8 w-8 text-red-500/60" />
                  <p className="mb-3 text-sm">{nftError}</p>
                  <button
                    type="button"
                    onClick={() => fetchNftGifts(activeFilter)}
                    className="flex items-center gap-1.5 rounded-xl bg-blue-500 px-4 py-2 text-xs font-medium text-white"
                  >
                    <RefreshCw className="h-3 w-3" /> Qayta urinish
                  </button>
                </div>
              )}
              {!nftLoading && !nftError && gifts.length === 0 && (
                <div className="py-10 text-center text-zinc-500">
                  <Gift className="mx-auto mb-3 h-10 w-10 opacity-40" />
                  <p className="text-sm">Bu kategoriyada giftlar yo&apos;q</p>
                </div>
              )}
              {!nftLoading && !nftError && gifts.length > 0 && (
                <div className="grid grid-cols-2 gap-2.5">
                  {gifts.map((gift) => {
                    const affordable = canBuy(gift.price);
                    const canPurchase = affordable && NFT_SERVICE_ENABLED;
                    return (
                      <NftGiftCard
                        key={gift.id}
                        gift={gift}
                        affordable={affordable}
                        nftServiceEnabled={NFT_SERVICE_ENABLED}
                        canPurchase={canPurchase}
                        copiedId={copiedId}
                        onCopy={handleCopy}
                        onBuy={() => canPurchase && setBuyNftGift(gift)}
                      />
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {mainTab === 'oddiy' && (
        <>
          <div className="flex gap-1.5">
            {[
              { key: 'cheap', label: 'Arzon ↑' },
              { key: 'expensive', label: 'Qimmat ↓' },
            ].map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setOddiyFilter(f.key)}
                className={`shrink-0 whitespace-nowrap rounded-xl border px-3.5 py-2 text-sm font-medium transition-all ${
                  oddiyFilter === f.key
                    ? 'border-blue-500 bg-blue-500 text-white'
                    : 'border-zinc-200 bg-zinc-100 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="scrollbar-hide flex gap-1.5 overflow-x-auto pb-0.5">
            {ODDIY_TYPE_FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setOddiyTypeFilter(f.key)}
                className={`shrink-0 whitespace-nowrap rounded-xl border px-3.5 py-2 text-sm font-medium transition-all ${
                  oddiyTypeFilter === f.key
                    ? 'border-blue-500 bg-blue-500 text-white'
                    : 'border-zinc-200 bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Card className="p-0">
              <CardContent className="px-4 pb-4 pt-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-pink-500/10">
                    <span className="text-lg">🎁</span>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs text-zinc-500">Jami giftlar</p>
                    <p className="mt-0.5 text-xl font-bold leading-none">{oddiyLoading ? '—' : oddiyList.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="p-0">
              <CardContent className="px-4 pb-4 pt-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs text-zinc-500">Eng arzon</p>
                    <p className="mt-0.5 text-xl font-bold leading-none">
                      {oddiyLoading || oddiyList.length === 0
                        ? '—'
                        : minVisibleOddiyPrice.toLocaleString('uz-UZ')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="p-0">
            <CardContent className="px-3 pb-4 pt-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-semibold">Oddiy Giftlar</h3>
                <div className="flex items-center gap-2">
                  {!oddiyLoading && <span className="text-xs text-zinc-500">{oddiyList.length} ta</span>}
                  <button
                    type="button"
                    onClick={fetchOddiyGifts}
                    className="flex h-6 w-6 items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${oddiyLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {oddiyLoading && (
                <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                  <Loader2 className="mb-3 h-8 w-8 animate-spin" />
                  <p className="text-sm">Yuklanmoqda...</p>
                </div>
              )}
              {!oddiyLoading && oddiyError && oddiyList.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-zinc-500">
                  <AlertCircle className="mb-3 h-8 w-8 text-red-500/60" />
                  <p className="mb-3 text-sm">{oddiyError}</p>
                  <button
                    type="button"
                    onClick={fetchOddiyGifts}
                    className="flex items-center gap-1.5 rounded-xl bg-blue-500 px-4 py-2 text-xs font-medium text-white"
                  >
                    <RefreshCw className="h-3 w-3" /> Qayta urinish
                  </button>
                </div>
              )}
              {!oddiyLoading && !oddiyError && oddiyList.length === 0 && (
                <div className="py-10 text-center text-zinc-500">
                  <Gift className="mx-auto mb-3 h-10 w-10 opacity-40" />
                  <p className="text-sm">Giftlar topilmadi</p>
                </div>
              )}
              {!oddiyLoading && oddiyList.length > 0 && (
                <div className="grid grid-cols-2 gap-2.5">
                  {oddiyList.map((gift) => {
                    const affordable = canBuy(gift.price);
                    const typeBadge = oddiyGiftTypeBadge(gift.type);
                    return (
                      <div
                        key={gift.id}
                        className={`overflow-hidden rounded-xl border transition-all ${
                          affordable ? 'border-zinc-200 dark:border-zinc-700' : 'border-zinc-200 dark:border-zinc-700'
                        }`}
                      >
                        <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden bg-gradient-to-br from-zinc-100 to-zinc-50 dark:from-zinc-800 dark:to-zinc-900">
                          <span
                            className={`pointer-events-none absolute right-2 top-2 z-30 max-w-[calc(100%-1rem)] truncate rounded-lg border px-2 py-0.5 text-[10px] font-semibold leading-tight backdrop-blur-md ${typeBadge.className}`}
                          >
                            {typeBadge.label}
                          </span>
                          <GiftAnimation name={gift.name} />
                        </div>
                        <div className="h-px bg-zinc-200/80 dark:bg-zinc-800" />
                        <div className="space-y-1.5 p-2.5">
                          <p className="truncate text-xs font-semibold capitalize leading-tight text-zinc-900 dark:text-white">
                            {String(gift.name).replace(/_/g, ' ')}
                          </p>
                          <p className={`text-sm font-bold ${affordable ? 'text-zinc-900 dark:text-white' : 'text-red-500/80'}`}>
                            {gift.price.toLocaleString('uz-UZ')}
                            <span className="ml-0.5 text-xs font-normal text-zinc-500">UZS</span>
                          </p>
                          <button
                            type="button"
                            onClick={() => affordable && setBuyGift(gift)}
                            disabled={!affordable}
                            className={`mt-1 flex h-8 w-full items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition-all ${
                              affordable
                                ? 'bg-blue-500 text-white hover:bg-blue-600 active:scale-95'
                                : 'cursor-not-allowed bg-zinc-200 text-zinc-500 dark:bg-zinc-800'
                            }`}
                          >
                            {affordable ? (
                              <>
                                <ShoppingCart className="h-3.5 w-3.5 shrink-0" />
                                Sotib olish
                              </>
                            ) : (
                              <>
                                <Wallet className="h-3.5 w-3.5 shrink-0" />
                                Balans yetmaydi
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {buyGift && (
        <BuyOddiyModal gift={buyGift} onClose={() => setBuyGift(null)} onSuccess={handleOddiyOrderSuccess} />
      )}
      {buyNftGift && (
        <BuyNftModal
          gift={buyNftGift}
          nftServiceEnabled={NFT_SERVICE_ENABLED}
          onClose={() => setBuyNftGift(null)}
          onSuccess={handleNftOrderSuccess}
        />
      )}
    </div>
  );
}

function NftGiftCard({
  gift,
  affordable,
  nftServiceEnabled,
  canPurchase,
  copiedId,
  onCopy,
  onBuy,
}) {
  const [imgErr, setImgErr] = useState(false);

  return (
    <div
      className={`overflow-hidden rounded-xl border transition-all ${
        'border-zinc-200 dark:border-zinc-700'
      }`}
    >
      <div className="relative aspect-square w-full bg-zinc-100 dark:bg-zinc-800">
        {!imgErr && gift.photo ? (
          <img
            src={gift.photo}
            alt={formatNftName(gift.nft_id)}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Gift className="h-10 w-10 text-zinc-400/40" />
          </div>
        )}
        {!nftServiceEnabled && (
          <div className="absolute inset-0 z-[5] flex items-center justify-center bg-black/60 p-1">
            <div className="flex items-center gap-1 rounded-lg bg-white/90 px-2 py-1 dark:bg-zinc-900/90">
              <AlertCircle className="h-3 w-3 shrink-0 text-amber-600" />
              <span className="text-center text-[10px] font-medium leading-tight text-zinc-600 dark:text-zinc-400">
                Xizmat o&apos;chirilgan
              </span>
            </div>
          </div>
        )}
      </div>
      <div className="h-px bg-zinc-200/80 dark:bg-zinc-800" />
      <div className="space-y-1.5 p-2.5">
        <p className="truncate text-xs font-semibold leading-tight text-zinc-900 dark:text-white">{formatNftName(gift.nft_id)}</p>
        <p className="truncate text-[10px] text-zinc-500">
          {gift.model} · {gift.backdrop}
        </p>
        <p className={`text-sm font-bold ${affordable ? 'text-zinc-900 dark:text-white' : 'text-red-500/70'}`}>
          {gift.price.toLocaleString('uz-UZ')}
          <span className="ml-0.5 text-xs font-normal text-zinc-500">UZS</span>
        </p>
        <p className="text-[10px] text-zinc-400">{gift.created_at}</p>
        <div className="flex gap-1.5 pt-0.5">
          <button
            type="button"
            onClick={() => onCopy(gift)}
            className={`flex h-7 flex-1 items-center justify-center gap-1 rounded-lg border text-[11px] font-medium transition-all ${
              copiedId === gift.id
                ? 'border-green-500/30 bg-green-500/10 text-green-600'
                : 'border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:text-zinc-400'
            }`}
          >
            {copiedId === gift.id ? (
              <>
                <CheckCircle2 className="h-3 w-3 shrink-0" />
                <span>OK</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3 shrink-0" />
                <span>Copy</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => gift.link && window.open(gift.link, '_blank')}
            className="flex h-7 flex-1 items-center justify-center gap-1 rounded-lg border border-zinc-200 text-[11px] font-medium text-zinc-600 transition-all hover:border-zinc-300 dark:border-zinc-700 dark:text-zinc-400"
          >
            <Eye className="h-3 w-3 shrink-0" />
            <span>View</span>
          </button>
        </div>
        <button
          type="button"
          onClick={onBuy}
          disabled={!canPurchase}
          className={`flex h-8 w-full items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition-all ${
            canPurchase
              ? 'bg-blue-500 text-white hover:bg-blue-600 active:scale-95'
              : 'cursor-not-allowed bg-zinc-200 text-zinc-500 dark:bg-zinc-800'
          }`}
        >
          {!nftServiceEnabled ? (
            <>
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              O&apos;chirilgan
            </>
          ) : affordable ? (
            <>
              <ShoppingCart className="h-3.5 w-3.5 shrink-0" />
              Yuborish
            </>
          ) : (
            <>
              <Wallet className="h-3.5 w-3.5 shrink-0" />
              Balans yetmaydi
            </>
          )}
        </button>
      </div>
    </div>
  );
}
