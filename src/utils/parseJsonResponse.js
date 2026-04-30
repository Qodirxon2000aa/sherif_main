/** PHP oldi/oxirida chiqindi bo‘lsa ham JSON objectni ajratib parse qiladi */

function stripBomAndTrim(text) {
  return String(text).replace(/^\uFEFF/, '').trim();
}

function tryParseBalancedObject(text, start) {
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i += 1) {
    const ch = text[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === '{') depth += 1;
    else if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        const chunk = text.slice(start, i + 1);
        try {
          return JSON.parse(chunk);
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

/**
 * Har bir `{` dan boshlab sinab, barcha muvaffaqiyatli objectlarni yig‘adi.
 * Oldinda log/JSON chiqindi bo‘lsa, birinchi parse noto‘g‘ri object bo‘lishi mumkin —
 * shuning uchun `ok` kaliti borlaridan oxirgisini tanlaymiz (asosan API javobi).
 */
function collectJsonObjectsFromText(normalized) {
  const candidates = [];
  let searchFrom = 0;
  while (searchFrom < normalized.length) {
    const start = normalized.indexOf('{', searchFrom);
    if (start < 0) break;

    try {
      const o = JSON.parse(normalized.slice(start));
      if (isPlainObject(o)) candidates.push(o);
    } catch {
      /* trailing noise yoki yaroqsiz — balanced sinaymiz */
    }

    const fromBraces = tryParseBalancedObject(normalized, start);
    if (isPlainObject(fromBraces)) {
      candidates.push(fromBraces);
    }

    searchFrom = start + 1;
  }
  return candidates;
}

function dedupeObjects(objects) {
  const seen = new Set();
  const unique = [];
  for (const o of objects) {
    let key;
    try {
      key = JSON.stringify(o);
    } catch {
      continue;
    }
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(o);
    }
  }
  return unique;
}

/**
 * Matndan JSON object (yoki noise keyin/asosiy javob).
 */
export function parseJsonMaybeLeadingNoise(text) {
  if (text == null || typeof text !== 'string') return null;
  const normalized = stripBomAndTrim(text);
  if (!normalized) return null;

  try {
    const direct = JSON.parse(normalized);
    if (isPlainObject(direct) || Array.isArray(direct)) return direct;
    return null;
  } catch {
    /* noise yoki faqat qismi JSON */
  }

  const collected = collectJsonObjectsFromText(normalized);
  const unique = dedupeObjects(collected);
  if (unique.length === 0) {
    const bracket = normalized.indexOf('[');
    if (bracket >= 0) {
      try {
        return JSON.parse(normalized.slice(bracket));
      } catch {
        return null;
      }
    }
    return null;
  }

  const withOk = unique.filter((o) => Object.prototype.hasOwnProperty.call(o, 'ok'));
  if (withOk.length > 0) {
    return withOk[withOk.length - 1];
  }

  return unique[unique.length - 1];
}

/**
 * JSON.parse butunlay yiqilganda ham, server muvaffaqiyat javobini matndan aniqlash.
 */
export function parseGiftOrderLooseResponse(text) {
  if (text == null || typeof text !== 'string') return null;
  const s = stripBomAndTrim(text);
  if (!s) return null;
  const okTrue = /"ok"\s*:\s*true/.test(s);
  const statusOk = /"status"\s*:\s*"success"/i.test(s);
  const orderM = s.match(/"order_id"\s*:\s*(\d+)/);
  const order_id = orderM ? Number(orderM[1]) : undefined;
  if (!okTrue) return null;
  if (!statusOk && order_id == null) return null;
  return {
    ok: true,
    status: 'success',
    ...(order_id != null && !Number.isNaN(order_id) ? { order_id } : {}),
  };
}
