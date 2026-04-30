import { useEffect, useState } from 'react';

export const useTelegram = () => {
  const [webApp, setWebApp] = useState(null);

  useEffect(() => {
    // LOCAL MODE (Chrome)
    if (!window.Telegram?.WebApp) {
      const setHeight = () => {
        document.documentElement.style
          .setProperty('--tg-height', `${window.innerHeight}px`);
        document.documentElement.style
          .setProperty('--tg-safe-top', '0px');
        document.documentElement.style
          .setProperty('--tg-safe-bottom', '0px');
        document.documentElement.style
          .setProperty('--tg-header-top-offset', '40px');
      };
      setHeight();
      window.addEventListener('resize', setHeight);
      return () => window.removeEventListener('resize', setHeight);
    }

    // TELEGRAM MODE
    const tg = window.Telegram.WebApp;
    const isAndroid = String(tg.platform || '').toLowerCase().includes('android');

    tg.ready();
    tg.expand();
    tg.disableVerticalSwipes?.();
    tg.MainButton.hide();

    // ✅ Fullscreen so'rash
    if (typeof tg.requestFullscreen === 'function') {
      tg.requestFullscreen();
    }

    const updateSizes = () => {
      // ✅ safeAreaInset — status bar va bottom nav uchun
      const safeTop    = tg.safeAreaInset?.top    ?? 0;
      const safeBottom = tg.safeAreaInset?.bottom ?? 0;
      const contentTop = tg.contentSafeAreaInset?.top ?? 0;

      document.documentElement.style
        .setProperty('--tg-height',
          `${tg.viewportStableHeight || tg.viewportHeight || window.innerHeight}px`);
      document.documentElement.style
        .setProperty('--tg-safe-top', `${Math.max(safeTop, contentTop)}px`);
      document.documentElement.style
        .setProperty('--tg-safe-bottom', `${safeBottom}px`);
      document.documentElement.style
        .setProperty('--tg-header-top-offset', isAndroid ? '20px' : '40px');
    };

    updateSizes();
    tg.onEvent('viewportChanged', updateSizes);
    tg.onEvent('fullscreenChanged', updateSizes); // ✅ yangi event

    setWebApp(tg);

    return () => {
      tg.offEvent('viewportChanged', updateSizes);
      tg.offEvent('fullscreenChanged', updateSizes);
    };
  }, []);

  const user = webApp?.initDataUnsafe?.user || {
    id: 12345678,
    first_name: 'John', last_name: 'Doe',
    username: 'johndoe',
    photo_url: 'https://picsum.photos/seed/john/200'
  };

  return {
    webApp,
    user,
    isDark: webApp?.colorScheme === 'dark',
    isFullscreen: webApp?.isFullscreen ?? false, // ✅
  };
};