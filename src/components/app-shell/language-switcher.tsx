"use client";

import { useTransition } from "react";
import { setLocale } from "@/lib/i18n/actions";
import { useLocale } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/config";

const OPTIONS: { code: Locale; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "ar", label: "ع" },
];

export function LanguageSwitcher() {
  const locale = useLocale();
  const [pending, startTransition] = useTransition();

  return (
    <div
      className="flex items-center rounded-lg border border-slate-200 p-0.5"
      role="group"
      aria-label="Language"
      dir="ltr"
    >
      {OPTIONS.map(({ code, label }) => {
        const active = locale === code;
        return (
          <button
            key={code}
            type="button"
            disabled={pending || active}
            onClick={() => startTransition(() => setLocale(code))}
            className={`min-w-8 rounded-md px-2 py-1 text-xs font-semibold transition ${
              active
                ? "bg-blue-600 text-white"
                : "text-slate-500 hover:text-slate-800 disabled:opacity-60"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
