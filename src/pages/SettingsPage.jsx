import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Moon, Sun, Type, Check } from 'lucide-react';
import { Card } from '../components/UI';
import { useTelegram } from '../hooks/useTelegram';

const TEXT_SIZES = ['small', 'medium', 'large'];

function readDark() {
  return document.documentElement.classList.contains('dark');
}

function readNight() {
  return document.body.classList.contains('night-mode');
}

function readTextSize() {
  const fromDom = TEXT_SIZES.find((s) =>
    document.documentElement.classList.contains(`app-text-${s}`)
  );
  if (fromDom) return fromDom;
  try {
    const raw = localStorage.getItem('app-text-size');
    if (TEXT_SIZES.includes(raw)) return raw;
  } catch {
    /* ignore */
  }
  return 'medium';
}

function applyTextSizeClass(size) {
  TEXT_SIZES.forEach((s) =>
    document.documentElement.classList.remove(`app-text-${s}`)
  );
  document.documentElement.classList.add(`app-text-${size}`);
}

export const SettingsPage = () => {
  const { t } = useTranslation();
  const { webApp } = useTelegram();

  const [isDark, setIsDark] = useState(readDark);
  const [isNight, setIsNight] = useState(readNight);
  const [textSize, setTextSize] = useState(readTextSize);

  useEffect(() => {
    setIsDark(readDark());
    setIsNight(readNight());
    setTextSize(readTextSize());
  }, [webApp]);

  const toggleDark = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    try {
      localStorage.setItem('app-dark', newDark ? '1' : '0');
    } catch {
      /* ignore */
    }
    if (newDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      setIsNight(false);
      document.body.classList.remove('night-mode');
      try {
        localStorage.setItem('app-night', '0');
      } catch {
        /* ignore */
      }
    }
  };

  const toggleNight = () => {
    const newNight = !isNight;
    setIsNight(newNight);
    try {
      localStorage.setItem('app-night', newNight ? '1' : '0');
    } catch {
      /* ignore */
    }
    if (newNight) {
      document.body.classList.add('night-mode');
      document.documentElement.classList.add('dark');
      setIsDark(true);
      try {
        localStorage.setItem('app-dark', '1');
      } catch {
        /* ignore */
      }
    } else {
      document.body.classList.remove('night-mode');
    }
  };

  const changeTextSize = (size) => {
    applyTextSizeClass(size);
    setTextSize(size);
    try {
      localStorage.setItem('app-text-size', size);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-white ml-1 uppercase tracking-wider opacity-60">
          {t('settings.appearance')}
        </h3>

        <Card className="divide-y divide-zinc-100 dark:divide-zinc-800 p-0 overflow-hidden">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-500">
                {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </div>
              <div>
                <p className="text-sm font-bold dark:text-white">{t('settings.darkMode')}</p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                  Switch between light and dark themes
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={toggleDark}
              className={`w-12 h-6 rounded-full transition-colors relative ${isDark ? 'bg-blue-500' : 'bg-zinc-200 dark:bg-zinc-700'}`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isDark ? 'left-7' : 'left-1'}`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-500">
                <Moon className="w-5 h-5 fill-current" />
              </div>
              <div>
                <p className="text-sm font-bold dark:text-white">{t('settings.nightMode')}</p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                  Extra dark theme for night usage
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={toggleNight}
              disabled={!isDark}
              className={`w-12 h-6 rounded-full transition-colors relative ${isNight ? 'bg-indigo-500' : 'bg-zinc-200 dark:bg-zinc-700'} ${!isDark ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isNight ? 'left-7' : 'left-1'}`}
              />
            </button>
          </div>
        </Card>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-white ml-1 uppercase tracking-wider opacity-60">
          {t('settings.textSize')}
        </h3>

        <Card className="p-4 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500">
              <Type className="w-5 h-5" />
            </div>
            <p className="text-sm font-bold dark:text-white">Adjust text size</p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {TEXT_SIZES.map((size) => (
              <button
                type="button"
                key={size}
                onClick={() => changeTextSize(size)}
                className={`py-3 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                  textSize === size
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
                }`}
              >
                {t(`settings.${size}`)}
                {textSize === size && <Check className="w-3 h-3" />}
              </button>
            ))}
          </div>
        </Card>
      </div>

      <div className="p-4 text-center">
        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.2em]">Version 1.0.4 (Beta)</p>
      </div>
    </div>
  );
};
