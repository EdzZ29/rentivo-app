// Currency + location helpers, kept in step with the web app's lib/currency.js
// and lib/location.js so prices and cities read the same on every client.

const SYMBOLS: Record<string, string> = {
  PHP: '₱',
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  AUD: 'A$',
  CAD: 'C$',
  SGD: 'S$',
};

export const DEFAULT_CURRENCY = 'PHP';

export function currencySymbol(code?: string | null): string {
  return SYMBOLS[code ?? ''] ?? code ?? SYMBOLS[DEFAULT_CURRENCY];
}

export function formatPrice(amount?: number | null, code?: string | null): string {
  const n = Number(amount) || 0;
  return `${currencySymbol(code)}${n.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  })}`;
}

// Owners type a location as free text ("Makati, Metro Manila", or just "Cebu
// City"). Cards show only the city — the first comma-separated segment.
export function cityOf(location?: string | null): string {
  if (!location) return '';
  return location.split(',')[0].trim();
}
