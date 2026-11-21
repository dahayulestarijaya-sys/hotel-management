import {
  CURRENCY_CODE,
  CURRENCY_LOCALE,
  CURRENCY_SYMBOL,
  formatCompactCurrency,
  formatCurrency,
} from '../currency';

describe('currency constants', () => {
  it('describes Indonesian Rupiah', () => {
    expect(CURRENCY_CODE).toBe('IDR');
    expect(CURRENCY_SYMBOL).toBe('Rp');
    expect(CURRENCY_LOCALE).toBe('id-ID');
  });
});

describe('formatCurrency', () => {
  it('formats amounts as Rp with dot thousands separators', () => {
    expect(formatCurrency(350000)).toBe('Rp 350.000');
    expect(formatCurrency(1750000)).toBe('Rp 1.750.000');
    expect(formatCurrency('550000')).toBe('Rp 550.000');
    expect(formatCurrency(0)).toBe('Rp 0');
  });

  it('omits the symbol when asked', () => {
    expect(formatCurrency(1250000, { withSymbol: false })).toBe('1.250.000');
  });

  it('puts the minus sign in front of the symbol', () => {
    expect(formatCurrency(-1500)).toBe('-Rp 1.500');
  });

  it('drops the decimals', () => {
    expect(formatCurrency(1500.75)).toBe('Rp 1.501');
  });

  it('returns a dash for empty or invalid values', () => {
    expect(formatCurrency(null)).toBe('—');
    expect(formatCurrency(undefined)).toBe('—');
    expect(formatCurrency('')).toBe('—');
    expect(formatCurrency('abc')).toBe('—');
    expect(formatCurrency(NaN)).toBe('—');
  });
});

describe('formatCompactCurrency', () => {
  it('shortens large amounts for chart axes', () => {
    expect(formatCompactCurrency(1500000)).toBe('Rp 1,5 jt');
    expect(formatCompactCurrency(250000)).toBe('Rp 250 rb');
    expect(formatCompactCurrency(950000000)).toBe('Rp 950 jt');
    expect(formatCompactCurrency(1250000000)).toBe('Rp 1,3 M');
    expect(formatCompactCurrency(950)).toBe('Rp 950');
    expect(formatCompactCurrency('abc')).toBe('—');
  });
});

