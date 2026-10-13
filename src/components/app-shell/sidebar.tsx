"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  TrendingUp,
  Boxes,
  Users,
  Truck,
  ShoppingCart,
  DollarSign,
  BarChart3,
  UserCog,
  Settings,
  Warehouse,
  type LucideIcon,
} from "lucide-react";
import { LogoFull } from "@/components/logo";
import type { NavItem } from "@/lib/nav";
import { useT } from "@/lib/i18n/context";

const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard,
  TrendingUp,
  Boxes,
  Users,
  Truck,
  ShoppingCart,
  DollarSign,
  BarChart3,
  UserCog,
  Settings,
};

interface SidebarProps {
  items: NavItem[];
  adminItems: NavItem[];
}

export function Sidebar({ items, adminItems }: SidebarProps) {
  const pathname = usePathname();
  const t = useT();

  const renderItem = (item: NavItem) => {
    const Icon = ICONS[item.icon] ?? LayoutDashboard;
    const active =
      pathname === item.href || pathname.startsWith(`${item.href}/`);
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
          active
            ? "bg-blue-50 text-blue-700"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        }`}
      >
        <Icon size={19} className={active ? "text-blue-600" : "text-slate-400"} />
        {t(item.label)}
      </Link>
    );
  };

  const sectionLabel =
    "px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400";

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col self-start border-e border-slate-200 bg-white lg:flex">
      <div className="flex h-16 items-center border-b border-slate-100 px-6">
        <LogoFull size={34} />
      </div>

      <nav className="flex flex-1 flex-col overflow-y-auto px-3 py-5">
        {/* Primary navigation — anchored to the top */}
        <p className={sectionLabel}>{t("Main")}</p>
        <div className="space-y-1">{items.map(renderItem)}</div>

        {/* Administration + workspace — anchored to the bottom */}
        <div className="mt-auto space-y-5 pt-8">
          {adminItems.length > 0 && (
            <div>
              <p className={sectionLabel}>{t("Administration")}</p>
              <div className="space-y-1">{adminItems.map(renderItem)}</div>
            </div>
          )}

          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
            <div className="rounded-lg bg-white p-1.5 shadow-sm ring-1 ring-slate-100">
              <Warehouse size={18} className="text-blue-600" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-slate-800">
                {t("Main Warehouse")}
              </div>
              <div className="text-xs text-slate-400">{t("New York, NY")}</div>
            </div>
          </div>
        </div>
      </nav>
    </aside>
  );
}
