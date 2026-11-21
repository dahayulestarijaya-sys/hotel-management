/**
 * Currency helpers.
 *
 * The app prices everything in Indonesian Rupiah (IDR), formatted the way it is
 * written locally: `Rp 350.000` (dot thousands separators, no decimals).
 *
 * If the property ever operates in another currency, change the constants (and
 * the locale) below — every price in the UI goes through `formatCurrency`.
 */
export const CURRENCY_CODE = 'IDR';
export const CURRENCY_SYMBOL = 'Rp';
export const CURRENCY_LOCALE = 'id-ID';

export const formatCurrency = (value, { withSymbol = true } = {}) => {
  if (value === null || value === undefined || value === '') return '—';

  const amount = Number(value);
  if (!Number.isFinite(amount)) return '—';

  const sign = amount < 0 ? '-' : '';
  const digits = Math.abs(amount).toLocaleString(CURRENCY_LOCALE, {
    maximumFractionDigits: 0,
  });

  return withSymbol ? `${sign}${CURRENCY_SYMBOL} ${digits}` : `${sign}${digits}`;
};

/**
 * Short Indonesian form used on chart axes and labels:
 * `1500000` → `Rp 1,5 jt`, `250000` → `Rp 250 rb`, `950000000` → `Rp 950 jt`.
 */
export const formatCompactCurrency = value => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '—';

  const sign = amount < 0 ? '-' : '';
  const absolute = Math.abs(amount);
  const trim = number => String(number).replace('.', ',').replace(/,0$/, '');

  if (absolute >= 1000000000) return `${sign}${CURRENCY_SYMBOL} ${trim((absolute / 1000000000).toFixed(1))} M`;
  if (absolute >= 1000000) return `${sign}${CURRENCY_SYMBOL} ${trim((absolute / 1000000).toFixed(1))} jt`;
  if (absolute >= 1000) return `${sign}${CURRENCY_SYMBOL} ${Math.round(absolute / 1000)} rb`;
  return formatCurrency(amount);
};

