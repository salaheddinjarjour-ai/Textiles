import { cookies } from "next/headers";
import {
  LOCALE_COOKIE,
  DEFAULT_LOCALE,
  isLocale,
  type Locale,
} from "./config";
import { createTranslator, type TranslateFn } from "./translate";

/** Reads the current locale from the cookie (server components only). */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value ?? "";
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/** Returns a translator bound to the current locale. */
export async function getT(): Promise<TranslateFn> {
  return createTranslator(await getLocale());
}
