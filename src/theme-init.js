const TEXT_KEYS = ['app-text-small', 'app-text-medium', 'app-text-large'];

export function initThemeFromStorage() {
  try {
    const dark = localStorage.getItem('app-dark');
    if (dark === '1') document.documentElement.classList.add('dark');
    else if (dark === '0') document.documentElement.classList.remove('dark');

    const night = localStorage.getItem('app-night');
    document.body.classList.toggle('night-mode', night === '1');

    const raw = localStorage.getItem('app-text-size') || 'medium';
    const size = ['small', 'medium', 'large'].includes(raw) ? raw : 'medium';
    TEXT_KEYS.forEach((k) => document.documentElement.classList.remove(k));
    document.documentElement.classList.add(`app-text-${size}`);
  } catch {
    document.documentElement.classList.add('app-text-medium');
  }
}
