// Formatting helpers. Currency is USD throughout the app.

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const usdCompact = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

/** $1,234.50 */
export function money(value: number): string {
  return usd.format(value ?? 0);
}

/** $1.2K / $3.4M — for tight KPI spaces */
export function moneyCompact(value: number): string {
  return usdCompact.format(value ?? 0);
}

export function number(value: number): string {
  return new Intl.NumberFormat("en-US").format(value ?? 0);
}

export function percent(value: number, digits = 1): string {
  return `${value >= 0 ? "" : ""}${value.toFixed(digits)}%`;
}

/**
 * Dates are rendered with Latin digits in both languages so numeric data
 * stays scannable; only the month names localise.
 */
function dateLocale(locale?: string) {
  return locale === "ar" ? "ar-EG-u-nu-latn" : "en-US";
}

export function shortDate(date: Date | string, locale?: string): string {
  return new Date(date).toLocaleDateString(dateLocale(locale), {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function dayMonth(date: Date | string, locale?: string): string {
  return new Date(date).toLocaleDateString(dateLocale(locale), {
    month: "short",
    day: "numeric",
  });
}
