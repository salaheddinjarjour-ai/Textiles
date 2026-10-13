import Link from "next/link";
import type { Metadata } from "next";
import {
  ShoppingBag,
  LineChart,
  PieChart,
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ArrowRight,
  Plus,
  FileText,
  Boxes,
  UserPlus,
} from "lucide-react";
import { requireSession } from "@/lib/session";
import { can } from "@/lib/rbac";
import { getDashboardData } from "@/lib/dashboard-data";
import { money, moneyCompact, percent } from "@/lib/format";
import { SalesChart } from "@/components/dashboard/sales-chart";
import { StatusBadge } from "@/components/ui/status-badge";
import { getT, getLocale } from "@/lib/i18n/server";
import { qty } from "@/lib/i18n/translate";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: `${t("Dashboard")} · ${t("TextileHub")}` };
}

function StatCard({
  title,
  value,
  change,
  changeLabel,
  icon,
  iconClass,
  extra,
}: {
  title: string;
  value: string;
  change?: number;
  changeLabel?: string;
  icon: React.ReactNode;
  iconClass: string;
  extra?: React.ReactNode;
}) {
  const up = (change ?? 0) >= 0;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className={`rounded-xl p-2.5 ${iconClass}`}>{icon}</div>
        {extra}
      </div>
      <div className="mt-4 text-sm font-medium text-slate-500">{title}</div>
      <div className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
        {value}
      </div>
      {change !== undefined && (
        <div className="mt-2 flex items-center gap-1 text-xs font-medium">
          <span
            className={`inline-flex items-center gap-0.5 ${
              up ? "text-green-600" : "text-red-600"
            }`}
          >
            {up ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {percent(Math.abs(change))}
          </span>
          <span className="text-slate-400">{changeLabel}</span>
        </div>
      )}
    </div>
  );
}

const QUICK_ACTIONS = [
  {
    label: "New Sale",
    desc: "Create new sale order",
    href: "/sales",
    permission: "sales:manage" as const,
    icon: ShoppingBag,
    color: "bg-blue-50 text-blue-600",
  },
  {
    label: "Add Product",
    desc: "Add new fabric / item",
    href: "/inventory",
    permission: "inventory:manage" as const,
    icon: Boxes,
    color: "bg-green-50 text-green-600",
  },
  {
    label: "Create Invoice",
    desc: "Generate invoice",
    href: "/accounting",
    permission: "accounting:manage" as const,
    icon: FileText,
    color: "bg-purple-50 text-purple-600",
  },
  {
    label: "Receive Stock",
    desc: "GRN / stock in",
    href: "/purchases",
    permission: "purchases:manage" as const,
    icon: Package,
    color: "bg-amber-50 text-amber-600",
  },
  {
    label: "Add Customer",
    desc: "Create new customer",
    href: "/customers",
    permission: "customers:manage" as const,
    icon: UserPlus,
    color: "bg-sky-50 text-sky-600",
  },
  {
    label: "Record Payment",
    desc: "Payment in",
    href: "/accounting",
    permission: "accounting:manage" as const,
    icon: Plus,
    color: "bg-teal-50 text-teal-600",
  },
];

export default async function DashboardPage() {
  const user = await requireSession();
  const t = await getT();
  const locale = await getLocale();
  const data = await getDashboardData(locale);

  const firstName = user.name.split(" ")[0];
  const today = new Date().toLocaleDateString(
    locale === "ar" ? "ar-EG-u-nu-latn" : "en-US",
    { month: "long", day: "numeric", year: "numeric" },
  );
  const quickActions = QUICK_ACTIONS.filter((a) =>
    can(user.role, a.permission),
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {t("Dashboard")}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {t(
              "Welcome back, {name}. Here's what's happening with your business today.",
              { name: firstName },
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-3.5 py-2">
            <TrendingUp size={18} className="text-green-600" />
            <div className="leading-tight">
              <div className="text-sm font-semibold text-green-700">
                {t(
                  data.monthChange >= 0 ? "Sales up {value}" : "Sales down {value}",
                  { value: percent(Math.abs(data.monthChange)) },
                )}
              </div>
              <div className="text-[11px] text-green-600/80">
                {t("vs last month")}
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700">
            {today}
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title={t("Today's Sales")}
          value={money(data.todaySales)}
          change={data.todayChange}
          changeLabel={t("vs yesterday")}
          icon={<ShoppingBag size={22} className="text-blue-600" />}
          iconClass="bg-blue-50"
        />
        <StatCard
          title={t("Monthly Revenue")}
          value={money(data.monthRevenue)}
          change={data.monthChange}
          changeLabel={t("vs last month")}
          icon={<LineChart size={22} className="text-indigo-600" />}
          iconClass="bg-indigo-50"
        />
        <StatCard
          title={t("Gross Profit")}
          value={money(data.grossProfit)}
          change={data.grossProfitChange}
          changeLabel={t("vs last month")}
          icon={<PieChart size={22} className="text-green-600" />}
          iconClass="bg-green-50"
          extra={
            <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">
              {t("{value} margin", { value: percent(data.grossMargin) })}
            </span>
          }
        />
        <StatCard
          title={t("Inventory Value")}
          value={money(data.inventoryValue)}
          icon={<Package size={22} className="text-purple-600" />}
          iconClass="bg-purple-50"
        />
      </div>

      {/* Sales overview + top fabrics */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">
              {t("Sales Overview")}
            </h2>
            <span className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-500">
              {t("Last 30 Days")}
            </span>
          </div>
          <div className="mt-4">
            <SalesChart data={data.salesSeries} />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">
              {t("Top Selling Fabrics")}
            </h2>
            <Link
              href="/reports"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              {t("View All")}
            </Link>
          </div>
          <ul className="mt-4 space-y-4">
            {data.topFabrics.map((f, i) => (
              <li key={f.id} className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-slate-800">
                      {f.name}
                    </span>
                    <span className="shrink-0 text-sm font-semibold text-slate-900">
                      {moneyCompact(f.value)}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-blue-500"
                        style={{ width: `${Math.max(6, f.share)}%` }}
                      />
                    </div>
                    <span className="w-10 shrink-0 text-end text-xs text-slate-400">
                      {f.share.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </li>
            ))}
            {data.topFabrics.length === 0 && (
              <li className="text-sm text-slate-400">
                {t("No sales data yet.")}
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Low stock + recent orders + quick actions */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Low stock */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-500" />
              <h2 className="font-semibold text-slate-900">
                {t("Low Stock Alerts")}
              </h2>
            </div>
            <Link
              href="/inventory"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              {t("View All")}
            </Link>
          </div>
          <ul className="mt-4 space-y-3">
            {data.lowStock.map((s) => (
              <li key={s.id} className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-slate-800">
                    {s.name}
                  </div>
                  <div className="text-xs text-slate-400">
                    {t("Lot")}: {s.lotNumber} · {t(s.warehouse)}
                  </div>
                </div>
                <div className="text-end">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      s.severity === "very-low"
                        ? "bg-red-50 text-red-600"
                        : "bg-amber-50 text-amber-600"
                    }`}
                  >
                    {t(s.severity === "very-low" ? "Very Low" : "Low")}
                  </span>
                  <div className="mt-0.5 text-xs font-medium text-slate-500">
                    {qty(s.quantity, s.unit, t)}
                  </div>
                </div>
              </li>
            ))}
            {data.lowStock.length === 0 && (
              <li className="text-sm text-slate-400">
                {t("All stock levels are healthy.")}
              </li>
            )}
          </ul>
        </div>

        {/* Recent orders */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">
              {t("Recent Orders")}
            </h2>
            <Link
              href="/sales"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              {t("View All")}
            </Link>
          </div>
          <ul className="mt-4 space-y-1">
            {data.recentOrders.map((o) => (
              <li
                key={o.id}
                className="flex items-center justify-between gap-2 rounded-lg px-1 py-2"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-800">
                    {o.orderNumber}
                  </div>
                  <div className="truncate text-xs text-slate-400">
                    {o.customer}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-900">
                    {money(o.total)}
                  </span>
                  <StatusBadge status={o.status} />
                </div>
              </li>
            ))}
            {data.recentOrders.length === 0 && (
              <li className="text-sm text-slate-400">{t("No orders yet.")}</li>
            )}
          </ul>
          <Link
            href="/sales"
            className="mt-3 flex items-center justify-center gap-1 rounded-lg border border-slate-200 py-2 text-sm font-medium text-blue-600 hover:bg-slate-50"
          >
            {t("View All Orders")} <ArrowRight size={15} />
          </Link>
        </div>

        {/* Quick actions */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-900">{t("Quick Actions")}</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {quickActions.map((a) => {
              const Icon = a.icon;
              return (
                <Link
                  key={a.label}
                  href={a.href}
                  className="flex flex-col gap-2 rounded-xl border border-slate-200 p-3 transition hover:border-blue-300 hover:bg-blue-50/40"
                >
                  <div className={`w-fit rounded-lg p-2 ${a.color}`}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-800">
                      {t(a.label)}
                    </div>
                    <div className="text-[11px] text-slate-400">{t(a.desc)}</div>
                  </div>
                </Link>
              );
            })}
            {quickActions.length === 0 && (
              <p className="col-span-2 text-sm text-slate-400">
                {t("No quick actions available for your role.")}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
