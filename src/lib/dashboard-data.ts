import { prisma } from "./prisma";

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

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export interface DashboardData {
  todaySales: number;
  todayChange: number;
  monthRevenue: number;
  monthChange: number;
  grossProfit: number;
  grossMargin: number;
  grossProfitChange: number;
  inventoryValue: number;
  salesSeries: { date: string; label: string; value: number }[];
  topFabrics: {
    id: string;
    name: string;
    category: string;
    unit: string;
    value: number;
    share: number;
  }[];
  lowStock: {
    id: string;
    name: string;
    lotNumber: string;
    warehouse: string;
    quantity: number;
    unit: string;
    reorderLevel: number;
    severity: "very-low" | "low";
  }[];
  recentOrders: {
    id: string;
    orderNumber: string;
    customer: string;
    total: number;
    status: string;
  }[];
}

export async function getDashboardData(
  locale: "en" | "ar" = "en",
): Promise<DashboardData> {
  // Arabic month names with Latin digits, so numbers stay readable.
  const dateLocale = locale === "ar" ? "ar-EG-u-nu-latn" : "en-US";
  const now = new Date();
  const today = startOfDay(now);
  const yesterday = addDays(today, -1);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const rangeStart = addDays(today, -29);

  const [
    todayAgg,
    yesterdayAgg,
    monthAgg,
    lastMonthAgg,
    monthItems,
    lastMonthItems,
    stocks,
    seriesOrders,
    topGroups,
    recent,
  ] = await Promise.all([
    prisma.salesOrder.aggregate({
      _sum: { total: true },
      where: { createdAt: { gte: today } },
    }),
    prisma.salesOrder.aggregate({
      _sum: { total: true },
      where: { createdAt: { gte: yesterday, lt: today } },
    }),
    prisma.salesOrder.aggregate({
      _sum: { total: true },
      where: { createdAt: { gte: monthStart } },
    }),
    prisma.salesOrder.aggregate({
      _sum: { total: true },
      where: { createdAt: { gte: lastMonthStart, lt: monthStart } },
    }),
    prisma.salesOrderItem.findMany({
      where: { order: { createdAt: { gte: monthStart } } },
      select: { quantity: true, unitPrice: true, unitCost: true },
    }),
    prisma.salesOrderItem.findMany({
      where: { order: { createdAt: { gte: lastMonthStart, lt: monthStart } } },
      select: { quantity: true, unitPrice: true, unitCost: true },
    }),
    prisma.stock.findMany({
      include: { product: true, warehouse: true },
    }),
    prisma.salesOrder.findMany({
      where: { createdAt: { gte: rangeStart } },
      select: { createdAt: true, total: true },
    }),
    prisma.salesOrderItem.groupBy({
      by: ["productId"],
      _sum: { lineTotal: true },
      orderBy: { _sum: { lineTotal: "desc" } },
      take: 5,
    }),
    prisma.salesOrder.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { customer: true },
    }),
  ]);

  const grossProfit = monthItems.reduce(
    (s, i) => s + (i.unitPrice - i.unitCost) * i.quantity,
    0,
  );
  const monthRevenue = monthAgg._sum.total ?? 0;
  const grossMargin = monthRevenue > 0 ? (grossProfit / monthRevenue) * 100 : 0;
  const lastMonthProfit = lastMonthItems.reduce(
    (s, i) => s + (i.unitPrice - i.unitCost) * i.quantity,
    0,
  );

  const inventoryValue = stocks.reduce(
    (s, st) => s + st.quantity * st.product.costPrice,
    0,
  );

  // Build a 30-day series with zero-filled days.
  const buckets = new Map<string, number>();
  for (let i = 0; i < 30; i++) {
    const d = addDays(rangeStart, i);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }
  for (const o of seriesOrders) {
    const key = startOfDay(o.createdAt).toISOString().slice(0, 10);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + o.total);
  }
  const salesSeries = Array.from(buckets.entries()).map(([date, value]) => ({
    date,
    label: new Date(date).toLocaleDateString(dateLocale, {
      month: "short",
      day: "numeric",
    }),
    value,
  }));

  // Top selling fabrics.
  const productIds = topGroups.map((g) => g.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));
  const topTotal = topGroups.reduce((s, g) => s + (g._sum.lineTotal ?? 0), 0);
  const topFabrics = topGroups.map((g) => {
    const p = productMap.get(g.productId);
    const value = g._sum.lineTotal ?? 0;
    return {
      id: g.productId,
      name: p?.name ?? "Unknown",
      category: p?.category ?? "",
      unit: p?.unit ?? "",
      value,
      share: topTotal > 0 ? (value / topTotal) * 100 : 0,
    };
  });

  // Low stock alerts (compare two columns in JS).
  const lowStock = stocks
    .filter((s) => s.quantity <= s.product.reorderLevel)
    .sort((a, b) => a.quantity - b.quantity)
    .slice(0, 5)
    .map((s) => ({
      id: s.id,
      name: s.product.name,
      lotNumber: s.lotNumber,
      warehouse: s.warehouse.name,
      quantity: s.quantity,
      unit: s.product.unit,
      reorderLevel: s.product.reorderLevel,
      severity:
        s.quantity <= s.product.reorderLevel * 0.5
          ? ("very-low" as const)
          : ("low" as const),
    }));

  const recentOrders = recent.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    customer: o.customer.company || o.customer.name,
    total: o.total,
    status: o.status,
  }));

  return {
    todaySales: todayAgg._sum.total ?? 0,
    todayChange: pctChange(todayAgg._sum.total ?? 0, yesterdayAgg._sum.total ?? 0),
    monthRevenue,
    monthChange: pctChange(monthRevenue, lastMonthAgg._sum.total ?? 0),
    grossProfit,
    grossMargin,
    grossProfitChange: pctChange(grossProfit, lastMonthProfit),
    inventoryValue,
    salesSeries,
    topFabrics,
    lowStock,
    recentOrders,
  };
}
