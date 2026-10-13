"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Bell, ChevronDown, LogOut } from "lucide-react";
import { logout } from "@/lib/auth-actions";
import { ROLE_LABELS, type Role } from "@/lib/rbac";
import type { SessionUser } from "@/lib/auth";
import { useT } from "@/lib/i18n/context";
import { LanguageSwitcher } from "./language-switcher";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Topbar({ user }: { user: SessionUser }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-slate-200 bg-white/80 px-4 backdrop-blur sm:px-6">
      <div className="relative flex-1 max-w-xl">
        <Search
          size={18}
          className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="search"
          placeholder={t("Search across modules, customers, products…")}
          className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 ps-10 pe-4 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-500/15"
        />
      </div>

      <div className="ms-auto flex items-center gap-2">
        <LanguageSwitcher />
        <button
          type="button"
          className="relative rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
          aria-label={t("Notifications")}
        >
          <Bell size={20} />
          <span className="absolute end-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-2.5 rounded-lg px-1.5 py-1.5 transition hover:bg-slate-100"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
              {initials(user.name)}
            </div>
            <div className="hidden text-start leading-tight sm:block">
              <div className="text-sm font-semibold text-slate-800">
                {user.name}
              </div>
              <div className="text-xs text-slate-400">
                {t(ROLE_LABELS[user.role as Role] ?? user.role)}
              </div>
            </div>
            <ChevronDown size={16} className="hidden text-slate-400 sm:block" />
          </button>

          {open && (
            <div className="absolute end-0 mt-2 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
              <div className="border-b border-slate-100 px-4 py-3">
                <div className="text-sm font-semibold text-slate-800">
                  {user.name}
                </div>
                <div className="truncate text-xs text-slate-500">
                  {user.email}
                </div>
                <span className="mt-2 inline-block rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                  {t(ROLE_LABELS[user.role as Role] ?? user.role)}
                </span>
              </div>
              <form action={logout}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-2.5 px-4 py-3 text-start text-sm font-medium text-red-600 transition hover:bg-red-50"
                >
                  <LogOut size={16} />
                  {t("Sign out")}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
