import { useEffect, useState } from 'react';

export const useTelegram = () => {
  const [webApp, setWebApp] = useState(null);

  useEffect(() => {
    if (!window.Telegram?.WebApp) return;

    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();

    // Full-height Mini App: avoid the webview shrinking when the keyboard or chrome changes.
    const ensureExpanded = () => {
      tg.expand();
    };
    tg.onEvent('viewportChanged', ensureExpanded);

    if (typeof tg.disableVerticalSwipes === 'function') {
      tg.disableVerticalSwipes();
    }

    setWebApp(tg);

    return () => {
      tg.offEvent('viewportChanged', ensureExpanded);
    };
  }, []);

  const user = webApp?.initDataUnsafe?.user || {
    id: 12345678,
    first_name: 'John',
    last_name: 'Doe',
    username: 'johndoe',
    photo_url: 'https://picsum.photos/seed/john/200'
  };

  return {
    webApp,
    user,
    isDark: webApp?.colorScheme === 'dark'
  };
};
