import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { parseBalanceUzs } from '../utils/balanceUzs';
import {
  parseJsonMaybeLeadingNoise,
  parseGiftOrderLooseResponse,
} from '../utils/parseJsonResponse';

const TezpremiumContext = createContext(null);

const API_BASE =
  import.meta.env.VITE_UZBSTAR_API_BASE ?? 'https://tezpremium.uz/SherifZakaz/webapp';
const DEV_USER_ID = '7521806735';

/** Telegram Mini App: `gift_order.php` va boshqa POST API lar uchun */
export function getTelegramInitData() {
  if (typeof window === 'undefined') return null;
  const raw = window.Telegram?.WebApp?.initData;
  if (raw == null) return null;
  const s = String(raw).trim();
  return s.length > 0 ? s : null;
}

export function TezpremiumProvider({ children }) {
  const [apiUser, setApiUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const fetchedRef = useRef(false);

  const apiFetch = useCallback(async (endpoint, params = {}) => {
    const initData = getTelegramInitData();
    const { initData: _dropInit, user_id: _dropUid, ...rest } = params;
    const body = {
      ...rest,
      ...(initData ? { initData } : { user_id: DEV_USER_ID }),
    };

    const res = await fetch(`${API_BASE}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, */*',
      },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    let parsed = parseJsonMaybeLeadingNoise(text);
    if (
      (!parsed || typeof parsed !== 'object') &&
      endpoint === 'gift_order.php' &&
      res.ok
    ) {
      parsed = parseGiftOrderLooseResponse(text);
    }
    if (!parsed || typeof parsed !== 'object') {
      const snippet = text.slice(0, 160).replace(/\s+/g, ' ').trim();
      throw new Error(
        res.ok
          ? `Javob JSON emas${snippet ? `: ${snippet}` : ''}`
          : `HTTP ${res.status}${snippet ? ` — ${snippet}` : ''}`
      );
    }
    return parsed;
  }, []);

  const fetchUserFromApi = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiFetch('get_user.php');
      const rawBal =
        data.data?.balance_uzs ??
        data.data?.balance ??
        data.balance ??
        '0';
      const userData = data.ok
        ? {
            ...data.data,
            balance: String(rawBal),
            balanceUzs: parseBalanceUzs(rawBal),
          }
        : { balance: '0', balanceUzs: 0 };
      setApiUser(userData);
      return userData;
    } catch {
      const fallback = { balance: '0', balanceUzs: 0 };
      setApiUser(fallback);
      return fallback;
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  const fetchOrders = useCallback(async () => {
    try {
      const data = await apiFetch('history.php');
      setOrders(data.ok && Array.isArray(data.orders) ? data.orders : []);
    } catch {
      setOrders([]);
    }
  }, [apiFetch]);

  const fetchPayments = useCallback(async () => {
    try {
      const data = await apiFetch('payments.php');
      setPayments(data.ok && Array.isArray(data.payments) ? data.payments : []);
    } catch {
      setPayments([]);
    }
  }, [apiFetch]);

  const createOrder = useCallback(
    async ({ amount, sent, type, overall }) => {
      try {
        const data = await apiFetch('order.php', {
          amount,
          sent: `@${String(sent ?? '').replace(/^@/, '')}`,
          type,
          overall,
        });
        if (data?.ok) {
          await fetchUserFromApi();
          await fetchOrders();
          return { ok: true, ...data };
        }
        return { ok: false, message: data?.message || 'Buyurtma bajarilmadi' };
      } catch (e) {
        return { ok: false, message: e?.message || 'Server xatosi' };
      }
    },
    [apiFetch, fetchUserFromApi, fetchOrders]
  );

  const createPremiumOrder = useCallback(
    async ({ months, sent, overall }) => {
      try {
        const data = await apiFetch('premium.php', {
          amount: months,
          sent: String(sent ?? '').replace(/^@/, ''),
          overall,
        });
        if (data?.ok) {
          await fetchUserFromApi();
          await fetchOrders();
          return { ok: true, ...data };
        }
        return { ok: false, message: data?.message || 'Premium yuborilmadi' };
      } catch (e) {
        return { ok: false, message: e?.message || 'Server xatosi' };
      }
    },
    [apiFetch, fetchUserFromApi, fetchOrders]
  );

  const refreshHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      await Promise.all([fetchOrders(), fetchPayments()]);
    } finally {
      setHistoryLoading(false);
    }
  }, [fetchOrders, fetchPayments]);

  /** Orqa fonda — historyLoading yo‘q, UI “refresh” bo‘lmaydi */
  const refreshHistorySilent = useCallback(async () => {
    await Promise.all([fetchOrders(), fetchPayments()]);
  }, [fetchOrders, fetchPayments]);

  const refreshUser = useCallback(async () => {
    await fetchUserFromApi();
    await refreshHistory();
  }, [fetchUserFromApi, refreshHistory]);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchUserFromApi();
    refreshHistory();
  }, [fetchUserFromApi, refreshHistory]);

  const value = {
    apiUser,
    orders,
    payments,
    loading,
    historyLoading,
    apiFetch,
    refreshUser,
    refreshHistory,
    refreshHistorySilent,
    createOrder,
    createPremiumOrder,
  };

  return (
    <TezpremiumContext.Provider value={value}>
      {children}
    </TezpremiumContext.Provider>
  );
}

export function useTezpremium() {
  const ctx = useContext(TezpremiumContext);
  if (!ctx) {
    throw new Error('useTezpremium must be used inside TezpremiumProvider');
  }
  return ctx;
}
