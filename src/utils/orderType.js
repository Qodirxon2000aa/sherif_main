/** API `orders[].type` (PHP: `turi`) — kichik harfga normalizatsiya */

function normType(o) {
  return String(o?.type ?? '').trim().toLowerCase();
}

export function isPremiumOrder(o) {
  const ty = normType(o);
  return ty === 'premium' || ty.includes('premium');
}

export function isGiftOrder(o) {
  const ty = normType(o);
  return (
    ty === 'gift' ||
    ty.includes('gift') ||
    ty.includes('sovg') ||
    ty.includes('sovga')
  );
}

/** Stars va boshqa (Premium/Gift dan tashqari) */
export function isStarsOrder(o) {
  return !isPremiumOrder(o) && !isGiftOrder(o);
}
