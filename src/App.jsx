import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import './i18n/config';

import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';

import { ReferralPage } from './pages/ReferralPage';
import { EventsPage } from './pages/EventsPage';
import { HomePage } from './pages/HomePage';
import { MarketPage } from './pages/MarketPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { PaymentPage } from './pages/PaymentPage';
import { MoneyModal } from './components/MoneyModal';
import { useTezpremium } from './context/TezpremiumContext';

import { useTelegram } from './hooks/useTelegram';
import { formatBalanceUzs } from './utils/balanceUzs';

const START_PARAM_TO_TAB = {
  payment: 'payment',
  market: 'market',
  home: 'home',
  profile: 'profile',
  referral: 'referral',
  events: 'events',
  gifts: 'market',
  settings: 'settings',
};

import { AnimatePresence, motion } from 'motion/react';

function formatHeaderCompactBalance(value) {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return '0';
  if (Math.abs(n) < 100000) return formatBalanceUzs(n);
  const compact = n / 1000;
  const oneDecimal = compact >= 1000 ? Math.round(compact) : Math.round(compact * 10) / 10;
  const label = Number.isInteger(oneDecimal)
    ? oneDecimal.toLocaleString('uz-UZ')
    : oneDecimal.toLocaleString('uz-UZ', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return `${label}K`;
}

export default function App() {
  const { t } = useTranslation();
  const { webApp, user, startParam } = useTelegram();
  const { apiUser } = useTezpremium();

  const [activeTab, setActiveTab] = useState('home');
  const [moneyOpen, setMoneyOpen] = useState(false);
  const startParamAppliedRef = useRef(false);

  const headerBalance = formatHeaderCompactBalance(apiUser?.balanceUzs ?? apiUser?.balance ?? 0);

  useEffect(() => {
    if (!webApp) return;

    webApp.setHeaderColor(
      webApp.colorScheme === 'dark' ? '#18181b' : '#ffffff'
    );

    webApp.expand();
  }, [webApp]);

  useEffect(() => {
    if (!webApp) return;
    try {
      if (localStorage.getItem('app-dark') !== null) return;
    } catch {
      return;
    }
    if (webApp.colorScheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [webApp]);

  useEffect(() => {
    if (!webApp || !startParam || startParamAppliedRef.current) return;
    const tab = START_PARAM_TO_TAB[startParam.toLowerCase()];
    if (tab) {
      setActiveTab(tab);
      startParamAppliedRef.current = true;
    }
  }, [webApp, startParam]);

  const renderPage = () => {
    switch (activeTab) {
      case 'referral':
        return <ReferralPage />;
      case 'events':
        return <EventsPage />;
      case 'market':
        return <MarketPage onNavigateHome={() => setActiveTab('home')} />;
      case 'profile':
        return <ProfilePage />;
      case 'settings':
        return <SettingsPage />;
      case 'payment':
        return <PaymentPage onOpenStars={() => setActiveTab('home')} />;
      default:
        return <HomePage />;
    }
  };

  const getPageTitle = () => {
    if (activeTab === 'settings') return t('settings.title');
    if (activeTab === 'payment') return t('nav.payment');
    return t(`nav.${activeTab}`);
  };

  return (
    <div className="app">
      <Header
        title={getPageTitle()}
        balanceDisplay={`${headerBalance} UZS`}
        onTopupClick={() => setMoneyOpen(true)}
        onSettingsClick={() => setActiveTab('settings')}
      />

      <main className="content">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-md mx-auto px-4 pb-24 pt-4"
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </main>

      <MoneyModal open={moneyOpen} onClose={() => setMoneyOpen(false)} />

      <BottomNav
        activeTab={
          activeTab === 'settings'
            ? 'profile'
            : activeTab === 'payment'
              ? 'home'
              : activeTab
        }
        onTabChange={setActiveTab}
      />
    </div>
  );
}