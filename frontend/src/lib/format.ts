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
