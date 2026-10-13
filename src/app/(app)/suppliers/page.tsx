import type { Metadata } from "next";
import Link from "next/link";
import { Truck, Plus } from "lucide-react";
import { requirePermission, getSession } from "@/lib/session";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { money, number } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { card, th, td, btnPrimary } from "@/lib/ui";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: `${t("Suppliers")} · ${t("TextileHub")}` };
}

export default async function SuppliersPage() {
  await requirePermission("suppliers:view");
  const session = await getSession();
  const manage = session ? can(session.role, "suppliers:manage") : false;
  const t = await getT();

  const suppliers = await prisma.supplier.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { purchaseOrders: true } },
      purchaseOrders: { select: { total: true } },
    },
  });

  const rows = suppliers.map((s) => ({
    ...s,
    poCount: s._count.purchaseOrders,
    totalPurchased: s.purchaseOrders.reduce((sum, p) => sum + p.total, 0),
  }));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title={t("Suppliers")}
        subtitle={t("{count} suppliers", { count: suppliers.length })}
      >
        {manage && (
          <Link href="/suppliers/new" className={btnPrimary}>
            <Plus size={17} /> {t("Add Supplier")}
          </Link>
        )}
      </PageHeader>

      <div className={`${card} overflow-hidden`}>
        {rows.length === 0 ? (
          <EmptyState
            icon={Truck}
            title={t("No suppliers yet")}
            description={t(
              "Add suppliers to create purchase orders and receive stock.",
            )}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className={th}>{t("Supplier")}</th>
                  <th className={th}>{t("Contact")}</th>
                  <th className={`${th} text-end`}>{t("Purchase orders")}</th>
                  <th className={`${th} text-end`}>{t("Total purchased")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => (
                  <tr key={s.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                    <td className={td}>
                      <Link href={`/suppliers/${s.id}`} className="font-medium text-slate-800 hover:text-blue-600">
                        <bdi>{s.company || s.name}</bdi>
                      </Link>
                      <div className="text-xs text-slate-400"><bdi>{s.email}</bdi></div>
                    </td>
                    <td className={td}>{s.phone || "—"}</td>
                    <td className={`${td} text-end`}>{number(s.poCount)}</td>
                    <td className={`${td} text-end font-medium text-slate-900`}>
                      {money(s.totalPurchased)}
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
