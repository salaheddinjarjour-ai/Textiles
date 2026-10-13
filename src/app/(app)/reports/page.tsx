import type { Metadata } from "next";
import { DollarSign, ShoppingBag, PieChart, Boxes } from "lucide-react";
import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { money, moneyCompact, number, percent } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { StatTile } from "@/components/ui/stat-tile";
import { BarList } from "@/components/ui/bar-list";
import { SalesChart } from "@/components/dashboard/sales-chart";
import { card } from "@/lib/ui";
import { getT, getLocale } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: `${t("Reports")} · ${t("TextileHub")}` };
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export default async function ReportsPage() {
  await requirePermission("reports:view");
  const t = await getT();
  const locale = await getLocale();
  const dateLocale = locale === "ar" ? "ar-EG-u-nu-latn" : "en-US";

  const now = new Date();
  const today = startOfDay(now);
  const rangeStart = addDays(today, -29);

  const [orderAgg, items, products, topCustomerGroups, stocks, seriesOrders] =
    await Promise.all([
      prisma.salesOrder.aggregate({ _sum: { total: true }, _count: true }),
      prisma.salesOrderItem.findMany({
        select: { productId: true, lineTotal: true, quantity: true, unitPrice: true, unitCost: true },
      }),
      prisma.product.findMany(),
      prisma.salesOrder.groupBy({
        by: ["customerId"],
        _sum: { total: true },
        orderBy: { _sum: { total: "desc" } },
        take: 6,
      }),
      prisma.stock.findMany({ include: { product: true } }),
      prisma.salesOrder.findMany({
        where: { createdAt: { gte: rangeStart } },
        select: { createdAt: true, total: true },
      }),
    ]);

  const productMap = new Map(products.map((p) => [p.id, p]));
  const revenue = orderAgg._sum.total ?? 0;
  const orderCount = orderAgg._count;
  const grossProfit = items.reduce((s, i) => s + (i.unitPrice - i.unitCost) * i.quantity, 0);
  const itemsRevenue = items.reduce((s, i) => s + i.lineTotal, 0);
  const margin = itemsRevenue > 0 ? (grossProfit / itemsRevenue) * 100 : 0;
  const avgOrder = orderCount > 0 ? revenue / orderCount : 0;

  // Sales by category
  const byCategory = new Map<string, number>();
  const byProduct = new Map<string, number>();
  for (const it of items) {
    const p = productMap.get(it.productId);
    if (!p) continue;
    byCategory.set(p.category, (byCategory.get(p.category) ?? 0) + it.lineTotal);
    byProduct.set(it.productId, (byProduct.get(it.productId) ?? 0) + it.lineTotal);
  }
  const categoryItems = [...byCategory.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({ label, value, display: moneyCompact(value) }));
  const productItems = [...byProduct.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([id, value]) => ({
      label: productMap.get(id)?.name ?? "Unknown",
      value,
      display: moneyCompact(value),
    }));

  // Top customers
  const customers = await prisma.customer.findMany({
    where: { id: { in: topCustomerGroups.map((g) => g.customerId) } },
  });
  const customerMap = new Map(customers.map((c) => [c.id, c]));
  const customerItems = topCustomerGroups.map((g) => ({
    label: customerMap.get(g.customerId)?.company || customerMap.get(g.customerId)?.name || "Unknown",
    value: g._sum.total ?? 0,
    display: moneyCompact(g._sum.total ?? 0),
  }));

  // Inventory valuation by category
  const invByCategory = new Map<string, number>();
  for (const s of stocks) {
    invByCategory.set(
      s.product.category,
      (invByCategory.get(s.product.category) ?? 0) + s.quantity * s.product.costPrice,
    );
  }
  const invItems = [...invByCategory.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({ label, value, display: moneyCompact(value) }));

  // 30-day trend
  const buckets = new Map<string, number>();
  for (let i = 0; i < 30; i++) {
    buckets.set(addDays(rangeStart, i).toISOString().slice(0, 10), 0);
  }
  for (const o of seriesOrders) {
    const key = startOfDay(o.createdAt).toISOString().slice(0, 10);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + o.total);
  }
  const salesSeries = [...buckets.entries()].map(([date, value]) => ({
    date,
    label: new Date(date).toLocaleDateString(dateLocale, { month: "short", day: "numeric" }),
    value,
  }));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title={t("Reports")}
        subtitle={t("Business insights across sales, stock and finance.")}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label={t("Total revenue")} value={money(revenue)} icon={DollarSign} iconClass="bg-blue-50 text-blue-600" />
        <StatTile label={t("Orders")} value={number(orderCount)} icon={ShoppingBag} iconClass="bg-indigo-50 text-indigo-600" />
        <StatTile label={t("Avg. order value")} value={money(avgOrder)} icon={DollarSign} iconClass="bg-teal-50 text-teal-600" />
        <StatTile label={t("Gross margin")} value={percent(margin)} icon={PieChart} iconClass="bg-green-50 text-green-600" />
      </div>

      <div className={`${card} p-5`}>
        <h2 className="mb-2 font-semibold text-slate-900">
          {t("Sales — last 30 days")}
        </h2>
        <SalesChart data={salesSeries} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className={card}>
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-900">
              {t("Sales by category")}
            </h2>
          </div>
          <BarList items={categoryItems} emptyText={t("No data yet.")} />
        </div>
        <div className={card}>
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-900">{t("Top customers")}</h2>
          </div>
          <BarList items={customerItems} emptyText={t("No data yet.")} />
        </div>
        <div className={card}>
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-900">
              {t("Top products by revenue")}
            </h2>
          </div>
          <BarList items={productItems} emptyText={t("No data yet.")} />
        </div>
        <div className={card}>
          <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
            <Boxes size={17} className="text-slate-400" />
            <h2 className="font-semibold text-slate-900">
              {t("Inventory value by category")}
            </h2>
          </div>
          <BarList items={invItems} emptyText={t("No data yet.")} />
        </div>
      </div>
    </div>
  );
}
