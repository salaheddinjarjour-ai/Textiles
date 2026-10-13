import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/inventory/product-form";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: `${t("New Product")} · ${t("TextileHub")}` };
}

export default async function NewProductPage() {
  await requirePermission("inventory:manage");
  const t = await getT();
  const warehouses = await prisma.warehouse.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/inventory"
          className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          <ChevronLeft size={16} /> {t("Inventory")}
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
          {t("Add product")}
        </h1>
      </div>
      <ProductForm warehouses={warehouses} />
    </div>
  );
}
