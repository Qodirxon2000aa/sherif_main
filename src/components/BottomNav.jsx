import { useTranslation } from 'react-i18next';
import { Home, Users, Calendar, ShoppingBag, User } from 'lucide-react';
import { motion } from 'motion/react';

export const BottomNav = ({ activeTab, onTabChange }) => {
  const { t } = useTranslation();

  const tabs = [
    { id: 'referral', icon: Users, label: t('nav.referral') },
    { id: 'events', icon: Calendar, label: t('nav.events') },
    { id: 'home', icon: Home, label: t('nav.home') },
    { id: 'market', icon: ShoppingBag, label: t('nav.market') },
    { id: 'profile', icon: User, label: t('nav.profile') },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 safe-bottom">
      <div
        className="max-w-md mx-auto px-2 h-16 flex items-center justify-around"
        style={{ transform: 'translateY(-8px)' }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="flex flex-col items-center justify-center flex-1 min-w-0 relative"
            >
              <div className={`p-1 rounded-xl transition-all ${isActive ? 'text-blue-500' : 'text-zinc-400'}`}>
                <Icon className="w-6 h-6" />
              </div>
              <span className={`text-[10px] font-medium truncate w-full text-center ${isActive ? 'text-blue-500' : 'text-zinc-400'}`}>
                {tab.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -top-1 w-12 h-1 bg-blue-500 rounded-full"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};