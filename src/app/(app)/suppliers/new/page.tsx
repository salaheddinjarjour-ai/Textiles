import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requirePermission } from "@/lib/session";
import { createSupplier } from "@/lib/supplier-actions";
import { SupplierForm } from "@/components/suppliers/supplier-form";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: `${t("New Supplier")} · ${t("TextileHub")}` };
}

export default async function NewSupplierPage() {
  await requirePermission("suppliers:manage");
  const t = await getT();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/suppliers"
          className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          <ChevronLeft size={16} /> {t("Suppliers")}
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
          {t("Add supplier")}
        </h1>
      </div>
      <SupplierForm action={createSupplier} />
    </div>
  );
}
