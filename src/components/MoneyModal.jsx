import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Wallet, X, Copy } from 'lucide-react';
import { BodyPortal } from './BodyPortal';
import { Button } from './UI';
import { getTelegramInitData, useTezpremium } from '../context/TezpremiumContext';
import { parseJsonMaybeLeadingNoise } from '../utils/parseJsonResponse';

const SETTINGS_URL = 'https://tezpremium.uz/uzbstar/settings.php';
const STATUS_URL = 'https://tezpremium.uz/uzbstar/payments/status.php';
const REVIEW_URL = 'https://tezpremium.uz/uzbstar/payments/review.php';
const UZCARD_SETTINGS_URL = 'https://tezpremium.uz/uzbstar/settings.php';
const UZCARD_STATUS_URL = 'https://tezpremium.uz/uzbstar/uzcard/status.php';
const UZCARD_REVIEW_URL = 'https://tezpremium.uz/uzbstar/uzcard/review.php';
const SYSTEM_STATUS_URL = 'https://tezpremium.uz/uzbstar/status.php';
const DEV_USER_ID = '7521806735';

function pickPaymentId(data) {
  const candidates = [
    data?.payment_id,
    data?.paymentId,
    data?.id,
    data?.order_id,
    data?.orderId,
    data?.result?.payment_id,
    data?.result?.id,
    data?.payment?.payment_id,
    data?.payment?.id,
    data?.data?.payment_id,
    data?.data?.id,
  ];
  for (const c of candidates) {
    if (c == null) continue;
    const s = String(c).trim();
    if (s) return s;
  }
  return null;
}

export function MoneyModal({ open, onClose }) {
  const { t } = useTranslation();
  const { refreshUser } = useTezpremium();
  const [paymentType, setPaymentType] = useState('humo');

  const [amount, setAmount] = useState('');
  const [rawAmount, setRawAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [paymentId, setPaymentId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [toast, setToast] = useState('');
  const [timeLeft, setTimeLeft] = useState(600);
  const [cardInfo, setCardInfo] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [resultType, setResultType] = useState('');
  const [payStatus, setPayStatus] = useState('off');
  const [payStatusLoading, setPayStatusLoading] = useState(false);
  const [showPaymentDisabled, setShowPaymentDisabled] = useState(false);
  const [systemStatus, setSystemStatus] = useState({
    humo: 'on',
    uzcard: 'on',
  });
  const [prettyAlert, setPrettyAlert] = useState({
    open: false,
    message: '',
  });

  const [paymentCards, setPaymentCards] = useState({
    humo: { number: '9860 1766 1888 4538', owner: 'M/U' },
    uzcard: { number: '5614 6865 0435 6364', owner: 'M/A' },
  });

  const statusIntervalRef = useRef(null);
  const statusTimeoutRef = useRef(null);

  const endpoints =
    paymentType === 'uzcard'
      ? {
          settings: UZCARD_SETTINGS_URL,
          status: UZCARD_STATUS_URL,
          review: UZCARD_REVIEW_URL,
        }
      : {
          settings: SETTINGS_URL,
          status: STATUS_URL,
          review: REVIEW_URL,
        };
  const paymentOptions = [
    { value: 'humo', label: 'Humo', on: systemStatus.humo === 'on' },
    { value: 'uzcard', label: 'Uzcard', on: systemStatus.uzcard === 'on' },
  ].filter((x) => x.on);

  const postReviewRequest = async (amountValue) => {
    const initData = getTelegramInitData();
    const body = {
      amount: amountValue,
      ...(initData ? { initData } : { user_id: DEV_USER_ID }),
    };
    const res = await fetch(endpoints.review, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, */*',
      },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    const parsed = parseJsonMaybeLeadingNoise(text);
    if (!parsed || typeof parsed !== 'object') {
      throw new Error(res.ok ? t('money.requestError') : `HTTP ${res.status}`);
    }
    return parsed;
  };

  const clearStatusPolling = () => {
    if (statusIntervalRef.current) {
      clearInterval(statusIntervalRef.current);
      statusIntervalRef.current = null;
    }
    if (statusTimeoutRef.current) {
      clearTimeout(statusTimeoutRef.current);
      statusTimeoutRef.current = null;
    }
  };

  const showPrettyAlert = (message) => {
    setPrettyAlert({ open: true, message });
  };

  useEffect(() => {
    if (!open) {
      clearStatusPolling();
      setAmount('');
      setRawAmount('');
      setWaiting(false);
      setPaymentId(null);
      setErrorMsg('');
      setTimeLeft(600);
      setCardInfo(null);
      setShowResult(false);
      setResultType('');
      setIsSubmitting(false);
      setPaymentType('humo');
      setPayStatusLoading(false);
      return;
    }

    const fetchSettings = async (silent = false) => {
      if (!silent) setPayStatusLoading(true);
      try {
        const res = await fetch(endpoints.settings);
        const data = await res.json();
        if (data.ok && data.settings) {
          setPayStatus(data.settings.pay_status || 'off');
          // Hozirgi payment endpointidan karta ma'lumotlarini yangilab olamiz.
          setPaymentCards((prev) => {
            const next = { ...prev };
            const cardRaw = String(data.settings.card || '').replace(/\s/g, '');
            if (cardRaw.length === 16) {
              next.humo = {
                number: cardRaw.replace(/(\d{4})(\d{4})(\d{4})(\d{4})/, '$1 $2 $3 $4'),
                owner: String(data.settings.humo_name || prev.humo.owner || 'M/U'),
              };
            }
            const uzcardRaw = String(data.settings.uzcard || '').replace(/\s/g, '');
            if (uzcardRaw.length === 16) {
              next.uzcard = {
                number: uzcardRaw.replace(/(\d{4})(\d{4})(\d{4})(\d{4})/, '$1 $2 $3 $4'),
                owner: String(data.settings.uzcard_name || prev.uzcard.owner || 'M/A'),
              };
            }
            return next;
          });
        } else {
          setPayStatus('off');
        }
      } catch {
        setPayStatus('off');
      } finally {
        if (!silent) setPayStatusLoading(false);
      }
    };

    const fetchSystemStatus = async (silent = false) => {
      try {
        const res = await fetch(SYSTEM_STATUS_URL);
        const data = await res.json();
        if (data?.ok && data?.status) {
          setSystemStatus({
            humo: String(data.status.humo || 'off').toLowerCase(),
            uzcard: String(data.status.uzcard || 'off').toLowerCase(),
          });
        }
      } catch {
        if (!silent) {
          setSystemStatus({ humo: 'off', uzcard: 'off' });
        }
      }
    };

    fetchSettings(false);
    fetchSystemStatus(false);
    const interval = setInterval(() => {
      fetchSettings(true);
      fetchSystemStatus(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [open, endpoints.settings]);

  useEffect(() => {
    if (!open) return;
    if (paymentType === 'humo' && systemStatus.humo !== 'on' && systemStatus.uzcard === 'on') {
      setPaymentType('uzcard');
      return;
    }
    if (paymentType === 'uzcard' && systemStatus.uzcard !== 'on' && systemStatus.humo === 'on') {
      setPaymentType('humo');
    }
  }, [open, paymentType, systemStatus]);

  useEffect(() => {
    return () => clearStatusPolling();
  }, []);

  useEffect(() => {
    if (!waiting || timeLeft <= 0) return;
    const timer = setTimeout(() => {
      setTimeLeft((s) => {
        if (s <= 1) {
          queueMicrotask(() => {
            clearStatusPolling();
            setResultType('error');
            setShowResult(true);
            setToast(t('money.errorTimeout'));
            setTimeout(() => {
              setShowResult(false);
              setWaiting(false);
              setPaymentId(null);
              setCardInfo(null);
              setToast('');
            }, 2200);
          });
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [waiting, timeLeft, t]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleClose = () => {
    clearStatusPolling();
    onClose();
  };

  const handlePaymentSuccess = async () => {
    clearStatusPolling();
    setResultType('success');
    setShowResult(true);
    await refreshUser();
    setTimeout(() => {
      setShowResult(false);
      setWaiting(false);
      setPaymentId(null);
      setCardInfo(null);
      onClose();
    }, 2000);
  };

  const handlePaymentError = (msg) => {
    clearStatusPolling();
    setResultType('error');
    setShowResult(true);
    setToast(msg);
    setTimeout(() => {
      setShowResult(false);
      setWaiting(false);
      setPaymentId(null);
      setCardInfo(null);
      setToast('');
    }, 2200);
  };

  const checkPaymentStatus = (pid) => {
    clearStatusPolling();
    statusIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${endpoints.status}?payment_id=${pid}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.ok && data.status === 'paid') {
          clearStatusPolling();
          handlePaymentSuccess();
        } else if (['failed', 'canceled', 'expired'].includes(data.status)) {
          clearStatusPolling();
          handlePaymentError(t('money.errorFailed'));
        }
      } catch {
        /* keep polling */
      }
    }, 5000);

    statusTimeoutRef.current = setTimeout(() => {
      clearStatusPolling();
    }, 600000);
  };

  const handleSubmit = async () => {
    setErrorMsg('');

    if (payStatus === 'off') {
      showPrettyAlert("To'lov tizimi vaqtincha o'chirilgan. Adminga murojaat qiling.");
      return;
    }

    if (paymentOptions.length === 0) {
      setErrorMsg("Hozircha mavjud to'lov turi yo'q.");
      return;
    }

    const numAmount = parseInt(rawAmount, 10);
    if (!numAmount || numAmount < 1000 || numAmount > 10000000) {
      setErrorMsg(t('money.amountError'));
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await postReviewRequest(numAmount);
      const pid = pickPaymentId(data);
      const ok = data?.ok === true || String(data?.status || '').toLowerCase() === 'success';
      if (ok && pid) {
        setPaymentId(pid);
        setWaiting(true);
        setTimeLeft(600);
        const selectedCard = paymentCards[paymentType] || paymentCards.humo;
        const fromApiRaw = data.card ? String(data.card).replace(/\s/g, '') : '';
        const cardNumber =
          fromApiRaw.length === 16
            ? fromApiRaw.replace(/(\d{4})(\d{4})(\d{4})(\d{4})/, '$1 $2 $3 $4')
            : selectedCard.number;
        setCardInfo({
          number: cardNumber,
          owner: selectedCard.owner || 'M/U',
        });
        checkPaymentStatus(pid);
      } else {
        setErrorMsg(data?.message || data?.error || t('money.createError'));
      }
    } catch (err) {
      setErrorMsg(err?.message || t('money.requestError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text, labelKey) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setToast(t('money.copied', { label: t(labelKey) }));
        setTimeout(() => setToast(''), 2500);
      })
      .catch(() => {
        setToast(t('money.copyFailed'));
        setTimeout(() => setToast(''), 2500);
      });
  };

  if (!open) return null;

  return (
    <BodyPortal>
    <div
      className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 dark:bg-black/70"
      role="dialog"
      aria-modal="true"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-md max-h-[92dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white dark:bg-zinc-900 shadow-xl border border-zinc-200 dark:border-zinc-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Wallet className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wide">
              {t('money.title')}
            </h2>
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

        <div className="p-4 pb-8 space-y-4">
          {errorMsg && (
            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-3 py-2 rounded-xl">
              {errorMsg}
            </div>
          )}

          {payStatusLoading ? (
            <div className="flex min-h-[180px] flex-col items-center justify-center gap-3 text-zinc-500">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
              <p className="text-sm">Tekshirilmoqda...</p>
            </div>
          ) : payStatus === 'off' ? (
            <div className="mx-auto max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
              <p className="mb-2 text-3xl">⚠️</p>
              <h3 className="mb-2 text-3xl font-bold text-zinc-900 dark:text-white">Ogohlantirish</h3>
              <p className="text-lg text-zinc-500 dark:text-zinc-400">
                To&apos;lov tizimi vaqtincha o&apos;chirilgan. Adminga murojaat qiling.
              </p>
              <button
                type="button"
                onClick={handleClose}
                className="mt-5 h-12 w-full rounded-xl bg-blue-500 text-xl font-semibold text-white hover:bg-blue-600"
              >
                Tushunarli
              </button>
            </div>
          ) : !waiting ? (
            <>
              <div>
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-2">
                  {t('money.method')}
                </label>
                <select
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {paymentOptions.length === 0 ? (
                    <option value="" disabled>
                      Adminga murojaat qiling
                    </option>
                  ) : (
                    paymentOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))
                  )}
                </select>
                {paymentOptions.length > 0 && (
                  <p className="mt-2 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                    {t('money.methodHint')}
                  </p>
                )}
                {paymentOptions.length === 0 && (
                  <p className="mt-2 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                    To&apos;lov turlari vaqtincha yopilgan. Adminga murojaat qiling.
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-2">
                  {t('money.amountLabel')}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder={t('money.placeholder')}
                  value={amount}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setRawAmount(val);
                    setAmount(
                      val ? parseInt(val, 10).toLocaleString('ru-RU') : ''
                    );
                  }}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[11px] text-zinc-500 mt-2">{t('money.limits')}</p>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="font-bold"
              >
                {isSubmitting ? t('money.submitting') : t('money.submit')}
              </Button>
            </>
          ) : (
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 mx-auto rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                  {t('money.waitingTitle')}
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  {t('money.waitingHint')}
                </p>
                <p className="mt-2 text-sm font-semibold text-red-500 dark:text-red-400">
                  {t('money.exactHint')}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-100 dark:border-zinc-700">
                <div className="text-left">
                  <p className="text-[10px] font-bold uppercase text-zinc-500">
                    {t('money.amountDisplay')}
                  </p>
                  <p className="text-lg font-bold text-zinc-900 dark:text-white">
                    {amount} UZS
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(rawAmount, 'money.amountDisplay')}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-blue-500 text-white hover:bg-blue-600"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {t('money.copy')}
                </button>
              </div>

              {cardInfo && (
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-100 dark:border-zinc-700 text-left space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[10px] font-bold uppercase text-zinc-500">
                        {t('money.cardNumber')}
                      </p>
                      <p className="text-base font-mono font-bold text-zinc-900 dark:text-white tracking-wide">
                        {cardInfo.number}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(cardInfo.number, 'money.cardNumber')
                      }
                      className="shrink-0 inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-bold bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100"
                    >
                      <Copy className="w-3 h-3" />
                      {t('money.copy')}
                    </button>
                  </div>
                  <div className="flex justify-between text-xs text-zinc-600 dark:text-zinc-400">
                    <span>{t('money.cardOwner')}</span>
                    <span className="font-medium">{cardInfo.owner}</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                <span>⏰</span>
                <span>
                  {t('money.timeLeft')}{' '}
                  <strong className="text-zinc-900 dark:text-white">
                    {formatTime(timeLeft)}
                  </strong>
                </span>
              </div>
              <p className="text-[11px] text-zinc-500">{t('money.autoCheck')}</p>
            </div>
          )}
        </div>
      </div>

      {showResult && (
        <div
          className={`fixed inset-0 z-[210] flex items-center justify-center p-6 bg-black/40 ${
            resultType === 'success' ? '' : ''
          }`}
        >
          <div
            className={`max-w-xs w-full rounded-2xl p-6 text-center shadow-xl ${
              resultType === 'success'
                ? 'bg-emerald-600 text-white'
                : 'bg-red-600 text-white'
            }`}
          >
            <div className="text-3xl mb-2">
              {resultType === 'success' ? '✓' : '✖'}
            </div>
            <p className="text-sm font-bold">
              {resultType === 'success'
                ? t('money.success')
                : t('money.failed')}
            </p>
          </div>
        </div>
      )}

      {toast && !showResult && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[220] px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-medium shadow-lg max-w-[90vw] text-center">
          {toast}
        </div>
      )}

      {showPaymentDisabled && null}

      {prettyAlert.open && (
        <div className="fixed inset-0 z-[225] flex items-center justify-center p-6 bg-black/50">
          <div className="max-w-sm w-full rounded-2xl bg-white dark:bg-zinc-900 p-6 text-center border border-zinc-200 dark:border-zinc-700 shadow-xl">
            <p className="text-2xl mb-2">⚠️</p>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-2">
              Ogohlantirish
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {prettyAlert.message}
            </p>
            <button
              type="button"
              onClick={() => setPrettyAlert({ open: false, message: '' })}
              className="mt-4 h-10 w-full rounded-xl bg-blue-500 text-sm font-semibold text-white hover:bg-blue-600"
            >
              Tushunarli
            </button>
          </div>
        </div>
      )}
    </div>
    </BodyPortal>
  );
}
