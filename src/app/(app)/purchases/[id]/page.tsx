import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, PackageCheck } from "lucide-react";
import { requirePermission, getSession } from "@/lib/session";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { receivePurchaseOrder, cancelPurchaseOrder } from "@/lib/purchase-actions";
import { money, shortDate } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { card, th, td, input, btnPrimary, btnGhost } from "@/lib/ui";
import { getT } from "@/lib/i18n/server";
import { qty } from "@/lib/i18n/translate";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: `${t("Purchase Order")} · ${t("TextileHub")}` };
}

export default async function PurchaseOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("purchases:view");
  const session = await getSession();
  const manage = session ? can(session.role, "purchases:manage") : false;
  const t = await getT();
  const { id } = await params;

  const po = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      supplier: true,
      createdBy: true,
      items: { include: { product: true } },
    },
  });
  if (!po) notFound();

  const warehouses = await prisma.warehouse.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const receive = receivePurchaseOrder.bind(null, id);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/purchases"
        className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700"
      >
        <ChevronLeft size={16} /> {t("Purchase Orders")}
      </Link>

      <PageHeader
        title={po.poNumber}
        subtitle={
          po.createdBy
            ? t("Created {date} by {name}", {
                date: shortDate(po.createdAt, t.locale),
                name: po.createdBy.name,
              })
            : t("Created {date}", { date: shortDate(po.createdAt, t.locale) })
        }
      >
        <StatusBadge status={po.status} />
      </PageHeader>

      <div className={`${card} p-5`}>
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {t("Supplier")}
        </div>
        <Link href={`/suppliers/${po.supplier.id}`} className="mt-1 block text-lg font-semibold text-slate-900 hover:text-blue-600">
          <bdi>{po.supplier.company || po.supplier.name}</bdi>
        </Link>
        <div className="mt-0.5 text-sm text-slate-500">
          {[po.supplier.email, po.supplier.phone].filter(Boolean).join(" · ")}
        </div>
      </div>

      <div className={`${card} overflow-hidden`}>
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">{t("Items")}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className={th}>{t("Product")}</th>
                <th className={`${th} text-end`}>{t("Unit cost")}</th>
                <th className={`${th} text-end`}>{t("Qty")}</th>
                <th className={`${th} text-end`}>{t("Total")}</th>
              </tr>
            </thead>
            <tbody>
              {po.items.map((it) => (
                <tr key={it.id} className="border-b border-slate-50 last:border-0">
                  <td className={td}>
                    <span className="font-medium text-slate-800"><bdi>{it.product.name}</bdi></span>
                    <span className="ms-1 text-xs text-slate-400">{it.product.sku}</span>
                  </td>
                  <td className={`${td} text-end`}>{money(it.unitCost)}</td>
                  <td className={`${td} text-end`}>{qty(it.quantity, it.product.unit, t)}</td>
                  <td className={`${td} text-end font-medium text-slate-900`}>{money(it.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-100 px-5 py-4">
          <div className="ms-auto flex w-full max-w-xs justify-between text-base">
            <span className="font-semibold text-slate-900">{t("Order total")}</span>
            <span className="font-bold text-slate-900">{money(po.total)}</span>
          </div>
        </div>
      </div>

      {/* Receive / cancel */}
      {manage && po.status === "PENDING" && (
        <div className={`${card} p-5`}>
          <div className="flex items-center gap-2">
            <PackageCheck size={18} className="text-green-600" />
            <h2 className="font-semibold text-slate-900">{t("Receive stock")}</h2>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {t(
              "Receiving adds every item's quantity into the selected warehouse and marks this order as received.",
            )}
          </p>
          <form action={receive} className="mt-3 flex flex-wrap items-end gap-3">
            <div className="min-w-52">
              <label className="mb-1 block text-xs font-medium text-slate-500">
                {t("Receive into")}
              </label>
              <select name="warehouseId" className={input} defaultValue={warehouses[0]?.id ?? ""}>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>{t(w.name)}</option>
                ))}
              </select>
            </div>
            <button type="submit" className={btnPrimary}>
              <PackageCheck size={16} /> {t("Receive all items")}
            </button>
          </form>
          <form action={cancelPurchaseOrder} className="mt-3">
            <input type="hidden" name="poId" value={po.id} />
            <button type="submit" className={btnGhost}>{t("Cancel this order")}</button>
          </form>
        </div>
      )}

      {po.status === "RECEIVED" && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          {t("✓ This order has been received and added to inventory.")}
        </div>
      )}
    </div>
  );
}
