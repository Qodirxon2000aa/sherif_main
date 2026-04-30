import { createPortal } from 'react-dom';

/** motion/transform ostida qolmasin — fixed overlay butun ekran va BottomNav ustida bo‘lishi uchun */
export function BodyPortal({ children }) {
  if (typeof document === 'undefined') return null;
  return createPortal(children, document.body);
}
