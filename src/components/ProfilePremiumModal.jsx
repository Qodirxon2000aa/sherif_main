import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';
import { BodyPortal } from './BodyPortal';
import { useTelegram } from '../hooks/useTelegram';
import { useTezpremium } from '../context/TezpremiumContext';
import { isPremiumOrder } from '../utils/orderType';

function formatUzNumber(n) {
  if (n == null || n === '') return '0';
  const s = String(n).replace(/\D/g, '') || String(n);
  const num = Number(s);
  if (Number.isNaN(num)) return String(n);
  return num.toLocaleString('ru-RU');
}

export function ProfilePremiumModal({ open, onClose }) {
  const { t } = useTranslation();
  const { user, webApp } = useTelegram();
  const { apiUser, orders, refreshHistorySilent } = useTezpremium();

  const [expandedRow, setExpandedRow] = useState(null);
  const [listLoading, setListLoading] = useState(false);

  const profilePhotoUrl =
    user?.photo_url || apiUser?.profile || apiUser?.photo_url || null;

  const displayUsername = useMemo(() => {
    const u = user?.username;
    if (!u) return t('history.noUsername');
    const s = String(u).replace(/^@/, '');
    return `@${s}`;
  }, [user?.username, t]);

  const premiumOrders = useMemo(
    () => (orders || []).filter(isPremiumOrder),
    [orders]
  );

  const ordersList = useMemo(
    () =>
      premiumOrders.map((o, index) => ({
        id: `premium-${o.order_id ?? o.id ?? index}`,
        months: o.months ?? o.amount ?? '—',
        summa:
          o.summa != null && o.summa !== ''
            ? `${formatUzNumber(o.summa)} UZS`
            : null,
        date: o.date || o.created_at || t('history.unknown'),
        sent: o.sent || o.recipient || '—',
        status: (o.status || 'completed').toLowerCase(),
        typeLabel: String(o.type || 'Premium').trim() || 'Premium',
      })),
    [premiumOrders, t]
  );

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setListLoading(true);
    refreshHistorySilent().finally(() => {
      if (!cancelled) setListLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [open, refreshHistorySilent]);

  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => {
      refreshHistorySilent();
    }, 10000);
    return () => clearInterval(id);
  }, [open, refreshHistorySilent]);

  const handleClose = () => {
    try {
      webApp?.HapticFeedback?.impactOccurred?.('medium');
    } catch {
      /* ignore */
    }
    setExpandedRow(null);
    onClose();
  };

  const toggleRow = (id) => {
    try {
      webApp?.HapticFeedback?.impactOccurred?.('light');
    } catch {
      /* ignore */
    }
    setExpandedRow((prev) => (prev === id ? null : id));
  };

  const statusClass = (status) => {
    const s = status?.toLowerCase();
    if (s === 'completed' || s === 'paid') return 'bg-emerald-500 text-white';
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
            <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                {t('history.premiumModalTitle')}
              </h2>
              <p className="text-[10px] text-zinc-400 mt-0.5">
                {t('history.premiumModalCount', { count: ordersList.length })}
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-6 min-h-0">
            {listLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-10 h-10 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
                <p className="text-sm text-zinc-500">{t('history.loading')}</p>
              </div>
            ) : ordersList.length === 0 ? (
              <p className="text-center text-sm text-zinc-500 py-12">
                {t('history.emptyPremiumOrders')}
              </p>
            ) : (
              <ul className="space-y-2">
                {ordersList.map((item) => {
                  const expanded = expandedRow === item.id;
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
                        <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-300 shrink-0 max-w-[30%] truncate">
                          {t('home.premium')}
                        </span>
                        <span className="text-xs font-bold text-purple-600 dark:text-purple-400 flex-1 min-w-0 truncate">
                          {item.months} {t('home.months')}
                        </span>
                        <span className="text-[10px] text-zinc-500 truncate max-w-[26%]">
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
                                {t('history.recipient')}:
                              </span>{' '}
                              {item.sent}
                            </p>
                            {item.summa && (
                              <p>
                                <span className="font-bold text-zinc-800 dark:text-zinc-200">
                                  {t('history.orderSum')}:
                                </span>{' '}
                                {item.summa}
                              </p>
                            )}
                            <p>
                              <span className="font-bold text-zinc-800 dark:text-zinc-200">
                                {t('history.orderType')}:
                              </span>{' '}
                              {item.typeLabel}
                            </p>
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
