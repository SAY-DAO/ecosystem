import moment from 'moment';

export function prepareUrl(imageUrl) {
  let url;
  if (imageUrl && imageUrl.startsWith('/')) {
    url = `https://api.sayapp.company/${imageUrl.slice(1)}`;
  } else {
    url = `https://api.sayapp.company/${imageUrl}`;
  }

  return url;
}

export const calcPercent = (done, total) =>
  total ? Math.round((done / total) * 100) : 0;

export const sanitizeId = (s) =>
  (s || 'cat')
    .toString()
    .slice(0, 60)
    .replace(/\s+/g, '-')
    .replace(/[^\w\u0600-\u06FF-]/g, '');

// tolerant number parser: strips commas, NBSP, trims, converts Persian/Arabic digits to Latin
export function parseNumberLoose(v) {
  if (v === null || v === undefined) return 0;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  let s = String(v).trim();
  if (!s) return 0;
  s = s.replace(/\u00A0/g, ' ').replace(/\s+/g, '');
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  const arabicDigits = '٠١٢٣٤٥٦٧٨٩';
  s = s
    .split('')
    .map((ch) => {
      const pIndex = persianDigits.indexOf(ch);
      if (pIndex !== -1) return String(pIndex);
      const aIndex = arabicDigits.indexOf(ch);
      if (aIndex !== -1) return String(aIndex);
      return ch;
    })
    .join('');
  if (s.indexOf(',') !== -1 && s.indexOf('.') !== -1) {
    s = s.replace(/,/g, '');
  } else {
    s = s.replace(/,/g, '');
  }
  s = s.replace(/[^0-9.-]/g, '');
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

export const daysDifference = (later, earlier) => {
  if (!later || !earlier) return null;
  const a = moment(later);
  const b = moment(earlier);
  if (!a.isValid() || !b.isValid()) return null;
  const d = a.diff(b, 'days');
  return Number.isFinite(d) ? d : null;
};
