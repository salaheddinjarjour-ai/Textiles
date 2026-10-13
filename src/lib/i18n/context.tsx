"use client";

import { createContext, useContext } from "react";
import type { Locale } from "./config";
import { createTranslator, type TranslateFn } from "./translate";

const LocaleContext = createContext<Locale>("en");

export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  return (
    <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

/** Translator hook for client components. */
export function useT(): TranslateFn {
  return createTranslator(useContext(LocaleContext));
}
