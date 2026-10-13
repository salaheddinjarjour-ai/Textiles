import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, Truck } from "lucide-react";
import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PurchaseOrderForm } from "@/components/purchases/po-form";
import { EmptyState } from "@/components/ui/empty-state";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: `${t("New Purchase Order")} · ${t("TextileHub")}` };
}

export default async function NewPurchaseOrderPage() {
  await requirePermission("purchases:manage");
  const t = await getT();

  const [suppliers, products] = await Promise.all([
    prisma.supplier.findMany({ orderBy: { name: "asc" } }),
    prisma.product.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, sku: true, unit: true, costPrice: true },
    }),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link
          href="/purchases"
          className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          <ChevronLeft size={16} /> {t("Purchase Orders")}
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
          {t("New purchase order")}
        </h1>
      </div>

      {suppliers.length === 0 || products.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <EmptyState
            icon={Truck}
            title={t("Add suppliers and products first")}
            description={t(
              "You need at least one supplier and one product to create a purchase order.",
            )}
          />
        </div>
      ) : (
        <PurchaseOrderForm
          suppliers={suppliers.map((s) => ({ id: s.id, label: s.company || s.name }))}
          products={products}
        />
      )}
    </div>
  );
}
