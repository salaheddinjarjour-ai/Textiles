import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { OrderForm } from "@/components/sales/order-form";
import { EmptyState } from "@/components/ui/empty-state";
import { getT } from "@/lib/i18n/server";
import { Users } from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: `${t("New Order")} · ${t("TextileHub")}` };
}

export default async function NewOrderPage() {
  await requirePermission("sales:manage");
  const t = await getT();

  const [customers, products] = await Promise.all([
    prisma.customer.findMany({ orderBy: { name: "asc" } }),
    prisma.product.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, sku: true, unit: true, sellPrice: true },
    }),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link
          href="/sales"
          className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          <ChevronLeft size={16} /> {t("Sales Orders")}
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
          {t("New sales order")}
        </h1>
      </div>

      {customers.length === 0 || products.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <EmptyState
            icon={Users}
            title={t("Add customers and products first")}
            description={t(
              "You need at least one customer and one product before creating an order.",
            )}
          />
        </div>
      ) : (
        <OrderForm
          customers={customers.map((c) => ({
            id: c.id,
            label: c.company || c.name,
          }))}
          products={products}
        />
      )}
    </div>
  );
}
