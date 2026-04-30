/** API balansi UZS — raqam, bo‘shliq yoki vergul bilan kelishi mumkin */
export function parseBalanceUzs(value) {
  if (value == null || value === '') return 0;
  const normalized = String(value).replace(/\s/g, '').replace(/,/g, '');
  const n = Number(normalized);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export function formatBalanceUzs(value, locale = 'uz-UZ') {
  const n = typeof value === 'number' ? value : parseBalanceUzs(value);
  return n.toLocaleString(locale);
}
