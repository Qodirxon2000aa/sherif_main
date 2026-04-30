import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Gift, Loader2, X } from 'lucide-react';
import { Card, CardContent } from '../components/UI';
import { useTelegram } from '../hooks/useTelegram';

const DEV_USER_ID = '7521806735';

export const EventsPage = () => {
  const { user } = useTelegram();
  const [eventData, setEventData] = useState(null);
  const [leaderboardData, setLeaderboardData] = useState({
    today: [],
    week: [],
    month: [],
  });
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('today');

  useEffect(() => {
    const uid = user?.id ? String(user.id) : DEV_USER_ID;
    const username = user?.username ? String(user.username).replace(/^@/, '') : '';

    let cancelled = false;
    (async () => {
      try {
        setLoadingEvents(true);
        const res = await fetch(
          `https://tezpremium.uz/SherifZakaz/webapp/events.php?user_id=${encodeURIComponent(uid)}&sent=${encodeURIComponent(username)}`
        );
        const data = await res.json();
        if (!cancelled && data?.ok && data?.data) {
          setEventData(data.data);
        }
      } catch {
        if (!cancelled) setEventData(null);
      } finally {
        if (!cancelled) setLoadingEvents(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.username]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingLeaderboard(true);
        const res = await fetch('https://tezpremium.uz/SherifZakaz/webapp/week.php');
        const data = await res.json();
        if (!cancelled && data?.ok && Array.isArray(data?.top10)) {
          const formattedData = data.top10.map((item) => ({
            rank: item.rank,
            username: item.name,
            amount: Number(item.summa || 0),
            trophy:
              item.rank === 1
                ? '🥇'
                : item.rank === 2
                  ? '🥈'
                  : item.rank === 3
                    ? '🥉'
                    : null,
          }));
          setLeaderboardData({
            today: formattedData,
            week: formattedData,
            month: formattedData,
          });
        }
      } catch {
        if (!cancelled) {
          setLeaderboardData({ today: [], week: [], month: [] });
        }
      } finally {
        if (!cancelled) setLoadingLeaderboard(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loading = loadingEvents || loadingLeaderboard;
  const target = useMemo(() => Number(eventData?.event || 0), [eventData]);
  const paid = useMemo(() => Number(eventData?.payments || 0), [eventData]);
  const left = useMemo(() => Number(eventData?.left || 0), [eventData]);
  const percent = target > 0 ? Math.min((paid / target) * 100, 100) : 0;

  if (loading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center text-zinc-500">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-2">
      <Card className="cursor-pointer p-0" onClick={() => eventData && setShowModal(true)}>
        <CardContent className="space-y-3 px-4 pb-4 pt-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10">
              <Gift className="h-5 w-5 text-amber-500" />
            </div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-white">
              Umumiy savdo maqsadi
            </h2>
          </div>
          {eventData ? (
            <>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                NFT olish uchun {target.toLocaleString('uz-UZ')} so&apos;m
              </p>
              <div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-zinc-500">
                  <span>{paid.toLocaleString('uz-UZ')} so&apos;m</span>
                  <span>{target.toLocaleString('uz-UZ')} so&apos;m</span>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-zinc-500">Ma&apos;lumot topilmadi</p>
          )}
        </CardContent>
      </Card>

      <Card className="p-0">
        <CardContent className="space-y-3 px-4 pb-4 pt-4">
          <div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-white">
              Savdo statistikasi
            </h2>
            <p className="text-xs text-zinc-500">Kunlik, haftalik va oylik reyting</p>
          </div>

          <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
            {[
              { key: 'today', label: 'Bugun' },
              { key: 'week', label: 'Bu hafta' },
              { key: 'month', label: 'Bu oy' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-lg px-2 py-1.5 text-xs font-semibold transition ${
                  activeTab === tab.key
                    ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white'
                    : 'text-zinc-500'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="space-y-1.5">
            {leaderboardData[activeTab].length === 0 ? (
              <p className="py-5 text-center text-sm text-zinc-500">Ma&apos;lumot yo&apos;q</p>
            ) : (
              leaderboardData[activeTab].map((item) => (
                <div
                  key={`${activeTab}-${item.rank}-${item.username}`}
                  className="flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 dark:border-zinc-700"
                >
                  <span className="w-8 text-center text-sm font-semibold">
                    {item.trophy || `${item.rank}.`}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-900 dark:text-white">
                    {item.username}
                  </span>
                  <span className="text-xs font-semibold text-zinc-500">
                    {item.amount.toLocaleString('uz-UZ')} so&apos;m
                  </span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {showModal && eventData && (
        <div
          className="fixed inset-0 z-[999] flex items-end justify-center bg-black/50 sm:items-center"
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-md rounded-t-3xl bg-white p-5 dark:bg-zinc-900 sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
                Savdo maqsadi haqida
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
              <p>
                <b>Maqsad:</b> {target.toLocaleString('uz-UZ')} so&apos;m umumiy savdo
              </p>
              <p>
                <b>Sovg&apos;a:</b> Eksklyuziv NFT (avtomatik yuboriladi)
              </p>
              <p>
                <b>Hozirgi holat:</b> {paid.toLocaleString('uz-UZ')} so&apos;m
              </p>
              <p>
                <b>Qolgan:</b> {left.toLocaleString('uz-UZ')} so&apos;m
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="mt-4 flex h-10 w-full items-center justify-center rounded-xl bg-blue-500 text-sm font-semibold text-white"
            >
              Tushundim
            </button>
          </div>
        </div>
      )}

      {!eventData && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2.5">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <p className="text-xs text-amber-800 dark:text-amber-200">
            Event ma&apos;lumoti topilmadi yoki server javob bermadi.
          </p>
        </div>
      )}
    </div>
  );
};
