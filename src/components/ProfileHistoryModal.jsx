import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, ChevronDown, ChevronUp, Copy, CreditCard } from 'lucide-react';
import { BodyPortal } from './BodyPortal';
import { useTelegram } from '../hooks/useTelegram';
import { useTezpremium } from '../context/TezpremiumContext';

const SETTINGS_URL = 'https://tezpremium.uz/uzbstar/settings.php';

function formatUzNumber(n) {
  if (n == null || n === '') return '0';
  const s = String(n).replace(/\D/g, '') || String(n);
  const num = Number(s);
  if (Number.isNaN(num)) return String(n);
  return num.toLocaleString('ru-RU');
}

/** "📆 04.01.2026 | ⏰ 15:47" yoki shunga o'xshash — 10 daqiqa muddat */
function calculateTimeRemaining(dateString) {
  if (!dateString) return null;
  try {
    const timeMatch = String(dateString).match(/⏰\s*(\d{2}):(\d{2})/);
    const dateMatch = String(dateString).match(/(\d{2})\.(\d{2})\.(\d{4})/);
    if (!timeMatch || !dateMatch) return null;
    const [, hours, minutes] = timeMatch;
    const [, day, month, year] = dateMatch;
    const paymentDate = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hours),
      Number(minutes)
    );
    const expiryDate = new Date(paymentDate.getTime() + 10 * 60 * 1000);
    const remaining = expiryDate - Date.now();
    if (remaining <= 0) return null;
    return {
      minutes: Math.floor(remaining / 60000),
      seconds: Math.floor((remaining % 60000) / 1000),
    };
  } catch {
    return null;
  }
}

function formatCardDisplay(raw) {
  if (!raw) return '';
  const digits = String(raw).replace(/\s/g, '');
  if (digits.length === 16) {
    return digits.replace(/(\d{4})(\d{4})(\d{4})(\d{4})/, '$1 $2 $3 $4');
  }
  return String(raw);
}

export function ProfileHistoryModal({ open, onClose }) {
  const { t } = useTranslation();
  const { user, webApp } = useTelegram();
  const {
    apiUser,
    payments,
    historyLoading,
    refreshHistory,
    refreshHistorySilent,
  } = useTezpremium();

  const [expandedRow, setExpandedRow] = useState(null);
  const [timers, setTimers] = useState({});
  const [toast, setToast] = useState('');
  const [globalCardNumber, setGlobalCardNumber] = useState(
    '9860 1766 1888 4538'
  );

  const profilePhotoUrl =
    user?.photo_url || apiUser?.profile || apiUser?.photo_url || null;

  const displayUsername = useMemo(() => {
    const u = user?.username;
    if (!u) return t('history.noUsername');
    const s = String(u).replace(/^@/, '');
    return `@${s}`;
  }, [user?.username, t]);

  const paymentsHistory = useMemo(() => {
    return (payments || []).map((p, index) => {
      const dateStr = p.date || p.created_at || '';
      const st = (p.status || 'completed').toLowerCase();
      const timeRemaining =
        st === 'pending' ? calculateTimeRemaining(dateStr) : null;
      return {
        id: `payment-${p.payment_id ?? p.id ?? index}`,
        typeLabel: t('history.paymentRow'),
        amount: `+${formatUzNumber(p.amount ?? 0)} UZS`,
        summa: p.summa != null ? `${formatUzNumber(p.summa)} UZS` : null,
        date: dateStr || t('history.unknown'),
        method: p.method || p.payment_method || '',
        status: st,
        rawType: p.type || t('history.cardMethod'),
        cardFromApi: p.card ? formatCardDisplay(p.card) : null,
        timeRemaining,
      };
    });
  }, [payments, t]);

  useEffect(() => {
    if (!open) return;
    refreshHistory();
  }, [open, refreshHistory]);

  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => {
      refreshHistorySilent();
    }, 10000);
    return () => clearInterval(id);
  }, [open, refreshHistorySilent]);

  useEffect(() => {
    if (!open) return;
    const loadCard = async () => {
      try {
        const res = await fetch(SETTINGS_URL);
        const data = await res.json();
        if (data.ok && data.settings?.card) {
          setGlobalCardNumber(formatCardDisplay(data.settings.card));
        }
      } catch {
        /* keep fallback */
      }
    };
    loadCard();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const interval = setInterval(() => {
      setTimers(() => {
        const next = {};
        paymentsHistory.forEach((payment) => {
          if (payment.status === 'pending') {
            const r = calculateTimeRemaining(payment.date);
            if (r) next[payment.id] = r;
          }
        });
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [open, payments, paymentsHistory]);

  const haptic = (type = 'light') => {
    try {
      webApp?.HapticFeedback?.impactOccurred?.(type);
    } catch {
      /* ignore */
    }
  };

  const toggleRow = (id) => {
    haptic('light');
    setExpandedRow((prev) => (prev === id ? null : id));
  };

  const handleClose = () => {
    try {
      webApp?.HapticFeedback?.impactOccurred?.('medium');
    } catch {
      /* ignore */
    }
    setExpandedRow(null);
    onClose();
  };

  const copyCard = useCallback(
    (cardNumber) => {
      navigator.clipboard.writeText(String(cardNumber).trim()).then(
        () => {
          try {
            webApp?.HapticFeedback?.notificationOccurred?.('success');
          } catch {
            /* ignore */
          }
          setToast(t('history.copied'));
          setTimeout(() => setToast(''), 2000);
        },
        () => setToast(t('money.copyFailed'))
      );
    },
    [webApp, t]
  );

  const statusClass = (status) => {
    const s = status?.toLowerCase();
    if (s === 'completed' || s === 'paid')
      return 'bg-emerald-500 text-white';
    if (s === 'pending') return 'bg-amber-500 text-white';
    if (s === 'cancelled' || s === 'failed' || s === 'canceled')
      return 'bg-red-500 text-white';
    return 'bg-zinc-500 text-white';
  };

  if (!open) return null;

  return (
    <BodyPortal>
      <div
        className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center bg-black/50 dark:bg-black/70 p-0 sm:p-4"
        onClick={handleClose}
        role="dialog"
        aria-modal="true"
      >
        {toast && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[220] px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-lg">
            {toast}
          </div>
        )}

        <div
          className="w-full max-w-md max-h-[92dvh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-full overflow-hidden ring-2 ring-blue-500 shrink-0 bg-zinc-200 dark:bg-zinc-700">
                {profilePhotoUrl ? (
                  <img
                    src={profilePhotoUrl}
                    alt=""
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm font-bold text-zinc-600">
                    {(user?.first_name?.[0] || '?').toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                  {user?.first_name} {user?.last_name || ''}
                </p>
                <p className="text-xs text-zinc-500 truncate">{displayUsername}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500"
              aria-label={t('money.close')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-4 pt-4 pb-2 shrink-0 flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center text-violet-600 dark:text-violet-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                {t('history.paymentsTitle')}
              </h2>
              <p className="text-[10px] text-zinc-400 mt-0.5">
                {t('history.paymentsCount', { count: paymentsHistory.length })}
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-6 min-h-0">
            {historyLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-10 h-10 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                <p className="text-sm text-zinc-500">{t('history.loading')}</p>
              </div>
            ) : paymentsHistory.length === 0 ? (
              <p className="text-center text-sm text-zinc-500 py-12">
                {t('history.emptyPayments')}
              </p>
            ) : (
              <ul className="space-y-2">
                {paymentsHistory.map((item) => {
                  const expanded = expandedRow === item.id;
                  const timerLeft = timers[item.id] ?? item.timeRemaining;
                  const pendingPayment = item.status === 'pending';
                  const cardToShow =
                    pendingPayment && (item.cardFromApi || globalCardNumber);

                  return (
                    <li
                      key={item.id}
                      className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-800/40 overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => toggleRow(item.id)}
                        className="w-full flex items-center gap-2 px-3 py-3 text-left hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 transition-colors"
                      >
                        <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-300 shrink-0 max-w-[28%] truncate">
                          {item.typeLabel}
                        </span>
                        <span className="text-xs font-bold text-zinc-900 dark:text-white flex-1 min-w-0 truncate">
                          {item.amount}
                        </span>
                        <span className="text-[10px] text-zinc-500 truncate max-w-[32%]">
                          {item.date}
                        </span>
                        {expanded ? (
                          <ChevronUp className="w-4 h-4 text-zinc-400 shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />
                        )}
                      </button>

                      {expanded && (
                        <div className="px-3 pb-3 pt-0 border-t border-zinc-200/60 dark:border-zinc-700/60 space-y-3">
                          <div className="text-xs text-zinc-600 dark:text-zinc-400 space-y-2 pt-2">
                            <p>
                              <span className="font-bold text-zinc-800 dark:text-zinc-200">
                                {t('history.method')}:
                              </span>{' '}
                              {item.rawType}
                            </p>
                            <p>
                              <span className="font-bold text-zinc-800 dark:text-zinc-200">
                                {t('history.amount')}:
                              </span>{' '}
                              {item.amount}
                            </p>
                            {item.summa && (
                              <p>
                                <span className="font-bold text-zinc-800 dark:text-zinc-200">
                                  {t('history.orderSum')}:
                                </span>{' '}
                                {item.summa}
                              </p>
                            )}

                            {pendingPayment && cardToShow && (
                              <div className="rounded-xl border border-amber-300/50 dark:border-amber-600/40 bg-amber-50 dark:bg-amber-950/30 p-3 space-y-2">
                                <p className="text-[11px] font-bold text-amber-800 dark:text-amber-200">
                                  {t('history.cardNumber')}
                                </p>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-mono text-[11px] font-bold text-zinc-900 dark:text-white tracking-wide">
                                    {cardToShow}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      copyCard(cardToShow);
                                    }}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-[10px] font-bold"
                                  >
                                    <Copy className="w-3 h-3" />
                                    {t('money.copy')}
                                  </button>
                                </div>
                                {timerLeft && (
                                  <p className="text-[11px] font-bold text-amber-700 dark:text-amber-300">
                                    ⏱ {t('history.timeLeft')}{' '}
                                    <span className="text-sm text-zinc-900 dark:text-white">
                                      {String(timerLeft.minutes).padStart(2, '0')}:
                                      {String(timerLeft.seconds).padStart(2, '0')}
                                    </span>
                                  </p>
                                )}
                                <p className="text-[10px] text-amber-800/80 dark:text-amber-200/80">
                                  {t('history.pendingHint')}
                                </p>
                              </div>
                            )}
                          </div>

                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${statusClass(item.status)}`}
                          >
                            {item.status}
                          </span>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </BodyPortal>
  );
}
