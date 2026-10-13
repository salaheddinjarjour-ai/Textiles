import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Package, DollarSign, Percent } from "lucide-react";
import { requirePermission, getSession } from "@/lib/session";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { adjustStock } from "@/lib/inventory-actions";
import { money, percent, shortDate } from "@/lib/format";
import { stockLevel, STOCK_LEVEL_META } from "@/lib/stock";
import { PageHeader } from "@/components/ui/page-header";
import { StatTile } from "@/components/ui/stat-tile";
import { Field } from "@/components/ui/field";
import { card, th, td, input, btnPrimary } from "@/lib/ui";
import { getT } from "@/lib/i18n/server";
import { qty } from "@/lib/i18n/translate";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: `${t("Product")} · ${t("TextileHub")}` };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("inventory:view");
  const session = await getSession();
  const manage = session ? can(session.role, "inventory:manage") : false;
  const t = await getT();
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: { stock: { include: { warehouse: true }, orderBy: { lotNumber: "asc" } } },
  });
  if (!product) notFound();

  const warehouses = await prisma.warehouse.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const totalQty = product.stock.reduce((s, st) => s + st.quantity, 0);
  const value = totalQty * product.costPrice;
  const margin =
    product.sellPrice > 0
      ? ((product.sellPrice - product.costPrice) / product.sellPrice) * 100
      : 0;
  const level = stockLevel(totalQty, product.reorderLevel);
  const meta = STOCK_LEVEL_META[level];

  const adjust = adjustStock.bind(null, id);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        href="/inventory"
        className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700"
      >
        <ChevronLeft size={16} /> {t("Inventory")}
      </Link>

      <PageHeader
        title={product.name}
        subtitle={`${product.sku} · ${t(product.category)}${product.color ? ` · ${product.color}` : ""}`}
      >
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${meta.cls}`}>
          {t(meta.label)}
        </span>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatTile label={t("In stock")} value={qty(totalQty, product.unit, t)} icon={Package} />
        <StatTile label={t("Sell price")} value={money(product.sellPrice)} icon={DollarSign} iconClass="bg-indigo-50 text-indigo-600" />
        <StatTile label={t("Margin")} value={percent(margin)} icon={Percent} iconClass="bg-green-50 text-green-600" />
        <StatTile label={t("Stock value (cost)")} value={money(value)} icon={DollarSign} iconClass="bg-purple-50 text-purple-600" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Stock lots */}
        <div className={`${card} overflow-hidden lg:col-span-2`}>
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-900">{t("Stock by lot")}</h2>
          </div>
          {product.stock.length === 0 ? (
            <p className="px-5 py-6 text-sm text-slate-400">
              {t("No stock recorded for this product.")}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className={th}>{t("Lot")}</th>
                    <th className={th}>{t("Warehouse")}</th>
                    <th className={`${th} text-end`}>{t("Quantity")}</th>
                    <th className={th}>{t("Updated")}</th>
                  </tr>
                </thead>
                <tbody>
                  {product.stock.map((s) => (
                    <tr key={s.id} className="border-b border-slate-50 last:border-0">
                      <td className={`${td} font-medium text-slate-800`}><bdi>{s.lotNumber}</bdi></td>
                      <td className={td}>{t(s.warehouse.name)}</td>
                      <td className={`${td} text-end font-medium text-slate-900`}>
                        {qty(s.quantity, product.unit, t)}
                      </td>
                      <td className={td}>{shortDate(s.updatedAt, t.locale)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Adjust stock */}
        {manage && (
          <div className={`${card} p-5`}>
            <h2 className="font-semibold text-slate-900">{t("Adjust stock")}</h2>
            <p className="mt-1 text-xs text-slate-400">
              {t("Use a positive number to receive stock, negative to remove.")}
            </p>
            <form action={adjust} className="mt-4 space-y-3">
              <Field label={t("Warehouse")}>
                <select name="warehouseId" className={input} defaultValue={warehouses[0]?.id ?? ""}>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>{t(w.name)}</option>
                  ))}
                </select>
              </Field>
              <Field label={t("Lot number")}>
                <input name="lotNumber" required className={input} placeholder="e.g. CP-2607-12" />
              </Field>
              <Field label={t("Quantity change")}>
                <input name="delta" type="number" step={1} required className={input} placeholder="+100 or -20" />
              </Field>
              <button type="submit" className={`${btnPrimary} w-full`}>
                {t("Apply adjustment")}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
