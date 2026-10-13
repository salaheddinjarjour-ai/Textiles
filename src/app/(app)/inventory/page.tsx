import type { Metadata } from "next";
import Link from "next/link";
import { Boxes, Plus, AlertTriangle, DollarSign, Package } from "lucide-react";
import { requirePermission, getSession } from "@/lib/session";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { money, number } from "@/lib/format";
import { stockLevel, STOCK_LEVEL_META } from "@/lib/stock";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { StatTile } from "@/components/ui/stat-tile";
import { card, th, td, btnPrimary } from "@/lib/ui";
import { getT } from "@/lib/i18n/server";
import { qty } from "@/lib/i18n/translate";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: `${t("Inventory")} · ${t("TextileHub")}` };
}

export default async function InventoryPage() {
  await requirePermission("inventory:view");
  const session = await getSession();
  const manage = session ? can(session.role, "inventory:manage") : false;
  const t = await getT();

  const products = await prisma.product.findMany({
    orderBy: { name: "asc" },
    include: { stock: { select: { quantity: true } } },
  });

  const rows = products.map((p) => {
    const qty = p.stock.reduce((s, st) => s + st.quantity, 0);
    return {
      ...p,
      qty,
      value: qty * p.costPrice,
      level: stockLevel(qty, p.reorderLevel),
    };
  });

  const totalValue = rows.reduce((s, r) => s + r.value, 0);
  const lowCount = rows.filter(
    (r) => r.level === "LOW" || r.level === "VERY_LOW" || r.level === "OUT",
  ).length;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title={t("Inventory")}
        subtitle={t("{count} products across your warehouses", {
          count: products.length,
        })}
      >
        {manage && (
          <Link href="/inventory/new" className={btnPrimary}>
            <Plus size={17} /> {t("Add Product")}
          </Link>
        )}
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile label={t("Products")} value={number(products.length)} icon={Package} />
        <StatTile
          label={t("Inventory value (cost)")}
          value={money(totalValue)}
          icon={DollarSign}
          iconClass="bg-green-50 text-green-600"
        />
        <StatTile
          label={t("Need attention")}
          value={t("{count} low / out", { count: lowCount })}
          icon={AlertTriangle}
          iconClass="bg-amber-50 text-amber-600"
        />
      </div>

      <div className={`${card} overflow-hidden`}>
        {rows.length === 0 ? (
          <EmptyState
            icon={Boxes}
            title={t("No products yet")}
            description={t("Add fabrics and items to start tracking stock.")}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className={th}>{t("Product")}</th>
                  <th className={th}>{t("Category")}</th>
                  <th className={`${th} text-end`}>{t("Sell price")}</th>
                  <th className={`${th} text-end`}>{t("In stock")}</th>
                  <th className={`${th} text-end`}>{t("Value")}</th>
                  <th className={th}>{t("Status")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => {
                  const meta = STOCK_LEVEL_META[p.level];
                  return (
                    <tr key={p.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                      <td className={td}>
                        <Link href={`/inventory/${p.id}`} className="font-medium text-slate-800 hover:text-blue-600">
                          <bdi>{p.name}</bdi>
                        </Link>
                        <div className="text-xs text-slate-400">
                          {p.sku}{p.color ? ` · ${p.color}` : ""}
                        </div>
                      </td>
                      <td className={td}>{t(p.category)}</td>
                      <td className={`${td} text-end`}>{money(p.sellPrice)}</td>
                      <td className={`${td} text-end font-medium text-slate-900`}>
                        {qty(p.qty, p.unit, t)}
                      </td>
                      <td className={`${td} text-end`}>{money(p.value)}</td>
                      <td className={td}>
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.cls}`}>
                          {t(meta.label)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
