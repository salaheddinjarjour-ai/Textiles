import type { Metadata } from "next";
import Link from "next/link";
import { Users, Plus } from "lucide-react";
import { requirePermission } from "@/lib/session";
import { getSession } from "@/lib/session";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { money, number } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { card, th, td, btnPrimary } from "@/lib/ui";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: `${t("Customers")} · ${t("TextileHub")}` };
}

export default async function CustomersPage() {
  await requirePermission("customers:view");
  const session = await getSession();
  const manage = session ? can(session.role, "customers:manage") : false;
  const t = await getT();

  const customers = await prisma.customer.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { salesOrders: true } },
      salesOrders: { select: { total: true } },
      invoices: { select: { amount: true, amountPaid: true } },
    },
  });

  const rows = customers.map((c) => {
    const totalSales = c.salesOrders.reduce((s, o) => s + o.total, 0);
    const outstanding = c.invoices.reduce(
      (s, i) => s + (i.amount - i.amountPaid),
      0,
    );
    return { ...c, totalSales, outstanding, orderCount: c._count.salesOrders };
  });

  const totalOutstanding = rows.reduce((s, r) => s + r.outstanding, 0);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title={t("Customers")}
        subtitle={t("{count} customers · {amount} outstanding", {
          count: customers.length,
          amount: money(totalOutstanding),
        })}
      >
        {manage && (
          <Link href="/customers/new" className={btnPrimary}>
            <Plus size={17} /> {t("Add Customer")}
          </Link>
        )}
      </PageHeader>

      <div className={`${card} overflow-hidden`}>
        {rows.length === 0 ? (
          <EmptyState
            icon={Users}
            title={t("No customers yet")}
            description={t(
              "Add your first customer to start creating sales orders.",
            )}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className={th}>{t("Customer")}</th>
                  <th className={th}>{t("Location")}</th>
                  <th className={`${th} text-end`}>{t("Orders")}</th>
                  <th className={`${th} text-end`}>{t("Total sales")}</th>
                  <th className={`${th} text-end`}>{t("Outstanding")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50"
                  >
                    <td className={td}>
                      <Link
                        href={`/customers/${c.id}`}
                        className="font-medium text-slate-800 hover:text-blue-600"
                      >
                        <bdi>{c.company || c.name}</bdi>
                      </Link>
                      <div className="text-xs text-slate-400"><bdi>{c.email}</bdi></div>
                    </td>
                    <td className={td}>
                      {c.city ? `${c.city}, ${c.country}` : c.country}
                    </td>
                    <td className={`${td} text-end`}>
                      {number(c.orderCount)}
                    </td>
                    <td className={`${td} text-end font-medium text-slate-900`}>
                      {money(c.totalSales)}
                    </td>
                    <td className={`${td} text-end`}>
                      <span
                        className={
                          c.outstanding > 0.005
                            ? "font-semibold text-red-600"
                            : "text-slate-400"
                        }
                      >
                        {money(c.outstanding)}
                      </span>
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
