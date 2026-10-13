import type { Metadata } from "next";
import Link from "next/link";
import { ShoppingCart, Plus } from "lucide-react";
import { requirePermission, getSession } from "@/lib/session";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { money, number, shortDate } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { card, th, td, btnPrimary } from "@/lib/ui";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: `${t("Purchases")} · ${t("TextileHub")}` };
}

export default async function PurchasesPage() {
  await requirePermission("purchases:view");
  const session = await getSession();
  const manage = session ? can(session.role, "purchases:manage") : false;
  const t = await getT();

  const orders = await prisma.purchaseOrder.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { supplier: true, _count: { select: { items: true } } },
  });

  const pendingValue = orders
    .filter((o) => o.status === "PENDING")
    .reduce((s, o) => s + o.total, 0);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title={t("Purchase Orders")}
        subtitle={t("{count} orders · {amount} awaiting receipt", {
          count: orders.length,
          amount: money(pendingValue),
        })}
      >
        {manage && (
          <Link href="/purchases/new" className={btnPrimary}>
            <Plus size={17} /> {t("New Purchase Order")}
          </Link>
        )}
      </PageHeader>

      <div className={`${card} overflow-hidden`}>
        {orders.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title={t("No purchase orders yet")}
            description={t("Create a purchase order to buy stock from a supplier.")}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className={th}>PO</th>
                  <th className={th}>{t("Supplier")}</th>
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
                      <Link href={`/purchases/${o.id}`} className="font-medium text-slate-800 hover:text-blue-600">
                        {o.poNumber}
                      </Link>
                    </td>
                    <td className={td}>{o.supplier.company || o.supplier.name}</td>
                    <td className={td}>{shortDate(o.createdAt, t.locale)}</td>
                    <td className={`${td} text-end`}>{number(o._count.items)}</td>
                    <td className={td}><StatusBadge status={o.status} /></td>
                    <td className={`${td} text-end font-medium text-slate-900`}>{money(o.total)}</td>
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
