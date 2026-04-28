/**
 * Formatting helpers (INR currency, dates, compact numbers).
 * Populated progressively in later steps.
 */

const INR = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
});

const INR_COMPACT = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    notation: 'compact',
    maximumFractionDigits: 1,
});

export const formatINR = (value: number | string | null | undefined) => {
    if (value === null || value === undefined || value === '') return '—';
    const n = typeof value === 'string' ? Number(value) : value;
    if (Number.isNaN(n)) return '—';
    return INR.format(n);
};

export const formatCompactINR = (value: number | string | null | undefined) => {
    if (value === null || value === undefined || value === '') return '—';
    const n = typeof value === 'string' ? Number(value) : value;
    if (Number.isNaN(n)) return '—';
    return INR_COMPACT.format(n);
};

export const formatNumber = (value: number | string | null | undefined) => {
    if (value === null || value === undefined || value === '') return '—';
    const n = typeof value === 'string' ? Number(value) : value;
    if (Number.isNaN(n)) return '—';
    return new Intl.NumberFormat('en-IN').format(n);
};

/**
 * Currency-aware money formatter. Falls back to INR when currency is missing.
 * Shown like "USD 1,234.56" for non-INR codes; INR keeps the ₹ glyph.
 */
export const formatMoney = (
    value: number | string | null | undefined,
    currency: string | null | undefined = 'INR',
) => {
    if (value === null || value === undefined || value === '') return '—';
    const n = typeof value === 'string' ? Number(value) : value;
    if (Number.isNaN(n)) return '—';
    const code = (currency ?? 'INR').toUpperCase();
    if (code === 'INR') return INR.format(n);
    try {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: code,
            maximumFractionDigits: 2,
        }).format(n);
    } catch {
        return `${code} ${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(n)}`;
    }
};

/**
 * Relative time formatter. Accepts `Date` or ISO string.
 * Uses `Intl.RelativeTimeFormat` to avoid pulling in date-fns for a single helper.
 */
export const formatRelative = (value: Date | string | number | null | undefined) => {
    if (value === null || value === undefined || value === '') return '—';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    const diffMs = date.getTime() - Date.now();
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    const abs = Math.abs(diffMs);
    const MIN = 60_000;
    const HOUR = 60 * MIN;
    const DAY = 24 * HOUR;
    const WEEK = 7 * DAY;
    if (abs < MIN) return rtf.format(Math.round(diffMs / 1000), 'second');
    if (abs < HOUR) return rtf.format(Math.round(diffMs / MIN), 'minute');
    if (abs < DAY) return rtf.format(Math.round(diffMs / HOUR), 'hour');
    if (abs < WEEK) return rtf.format(Math.round(diffMs / DAY), 'day');
    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};
