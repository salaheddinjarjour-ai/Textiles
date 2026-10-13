import type { Locale } from "./config";
import { ar } from "./ar";

// English source text doubles as the translation key. Missing translations
// gracefully fall back to the English key, so the UI is never blank.
const DICTIONARIES: Record<Locale, Record<string, string>> = {
  en: {},
  ar,
};

export interface TranslateFn {
  (key: string, vars?: Record<string, string | number>): string;
  /** The locale this translator is bound to. */
  locale: Locale;
}

export function createTranslator(locale: Locale): TranslateFn {
  const dict = DICTIONARIES[locale] ?? {};
  const fn = ((key: string, vars?: Record<string, string | number>) => {
    let out = dict[key] ?? key;
    if (vars) {
      for (const [name, value] of Object.entries(vars)) {
        out = out.replaceAll(`{${name}}`, String(value));
      }
    }
    return out;
  }) as TranslateFn;
  fn.locale = locale;
  return fn;
}

/**
 * Formats a quantity with its unit. English pluralises ("150 Meters");
 * Arabic uses the singular noun ("150 متر").
 */
export function qty(count: number, unit: string, t: TranslateFn): string {
  const n = new Intl.NumberFormat("en-US").format(count ?? 0);
  if (t.locale === "ar") return `${n} ${t(unit)}`;
  return `${n} ${unit}${count === 1 ? "" : "s"}`;
}
