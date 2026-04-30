import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Settings as SettingsIcon, Wallet, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Header = ({ title, balanceDisplay = '0', onTopupClick, onSettingsClick }) => {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);

  const languages = [
    { code: 'uz', label: 'O‘zbek' },
    { code: 'ru', label: 'Русский' },
    { code: 'en', label: 'English' },
  ];

  const changeLang = (lang) => {
    i18n.changeLanguage(lang);
    setOpen(false);
  };

  return (
    <header className="relative z-50 w-full shrink-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-100 dark:border-zinc-800 safe-top">
      <div className="relative max-w-md mx-auto px-4 h-14 flex items-center justify-between">

        <div className="flex items-center gap-1 rounded-xl border border-zinc-200 bg-zinc-100/80 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-800/80">
          <Wallet className="h-3.5 w-3.5 text-emerald-500" />
          <span className="max-w-[80px] truncate text-[11px] font-bold text-zinc-800 dark:text-zinc-100">
            {balanceDisplay}
          </span>
          <button
            type="button"
            onClick={onTopupClick}
            className="ml-0.5 inline-flex h-5 w-5 items-center justify-center rounded-md bg-emerald-500 text-white hover:bg-emerald-600"
            aria-label={t('profile.topup')}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* TITLE */}
        <motion.h1
          key={title}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm font-bold text-zinc-900 dark:text-white absolute left-1/2 -translate-x-1/2 uppercase"
        >
          {title}
        </motion.h1>

        {/* RIGHT SIDE */}
        <div className="relative flex items-center gap-1 sm:gap-2">

          {/* LANGUAGE BUTTON */}
          <button
            onClick={() => setOpen(!open)}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full flex items-center gap-1"
          >
            <Globe className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase">
              {i18n.language.split('-')[0]}
            </span>
          </button>

          {/* DROPDOWN */}
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="absolute right-0 top-12 w-32 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-lg overflow-hidden"
              >
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => changeLang(lang.code)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                      i18n.language.startsWith(lang.code)
                        ? 'font-bold text-blue-500'
                        : ''
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* SETTINGS */}
          <button
            onClick={onSettingsClick}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full"
          >
            <SettingsIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};