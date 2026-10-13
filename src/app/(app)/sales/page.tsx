import type { Metadata } from "next";
import Link from "next/link";
import { TrendingUp, Plus } from "lucide-react";
import { requirePermission, getSession } from "@/lib/session";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { money, number, shortDate } from "@/lib/format";
import { ORDER_STATUSES } from "@/lib/constants";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { card, th, td, btnPrimary } from "@/lib/ui";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: `${t("Sales")} · ${t("TextileHub")}` };
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  PROCESSING: "Processing",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requirePermission("sales:view");
  const session = await getSession();
  const manage = session ? can(session.role, "sales:manage") : false;
  const t = await getT();

  const { status } = await searchParams;
  const active = (ORDER_STATUSES as readonly string[]).includes(status ?? "")
    ? status!
    : "ALL";

  const where = active === "ALL" ? {} : { status: active };

  const [orders, grouped] = await Promise.all([
    prisma.salesOrder.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        customer: true,
        _count: { select: { items: true } },
      },
    }),
    prisma.salesOrder.groupBy({ by: ["status"], _count: true }),
  ]);

  const countFor = (s: string) =>
    grouped.filter((g) => (s === "ALL" ? true : g.status === s)).reduce((n, g) => n + g._count, 0);

  const tabs = [
    { key: "ALL", label: "All" },
    ...ORDER_STATUSES.map((s) => ({ key: s, label: STATUS_LABELS[s] })),
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title={t("Sales Orders")}
        subtitle={t("Create and track customer orders.")}
      >
        {manage && (
          <Link href="/sales/new" className={btnPrimary}>
            <Plus size={17} /> {t("New Order")}
          </Link>
        )}
      </PageHeader>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-1.5">
        {tabs.map((tab) => {
          const isActive = tab.key === active;
          const href =
            tab.key === "ALL" ? "/sales" : `/sales?status=${tab.key}`;
          return (
            <Link
              key={tab.key}
              href={href}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {t(tab.label)}
              <span className={`ms-1.5 text-xs ${isActive ? "text-blue-100" : "text-slate-400"}`}>
                {countFor(tab.key)}
              </span>
            </Link>
          );
        })}
      </div>

      <div className={`${card} overflow-hidden`}>
        {orders.length === 0 ? (
          <EmptyState
            icon={TrendingUp}
            title={t("No orders here")}
            description={t("Orders you create will show up in this list.")}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className={th}>{t("Order")}</th>
                  <th className={th}>{t("Customer")}</th>
                  <th className={th}>{t("Date")}</th>
                  <th className={`${th} text-end`}>{t("Items")}</th>
                  <th className={th}>{t("Status")}</th>
                  <th className={`${th} text-end`}>{t("Total")}</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                    <td className={td}>
                      <Link href={`/sales/${o.id}`} className="font-medium text-slate-800 hover:text-blue-600">
                        {o.orderNumber}
                      </Link>
                    </td>
                    <td className={td}><bdi>{o.customer.company || o.customer.name}</bdi></td>
                    <td className={td}>{shortDate(o.createdAt, t.locale)}</td>
                    <td className={`${td} text-end`}>{number(o._count.items)}</td>
                    <td className={td}><StatusBadge status={o.status} /></td>
                    <td className={`${td} text-end font-medium text-slate-900`}>
                      {money(o.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
