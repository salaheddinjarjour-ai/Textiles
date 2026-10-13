import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { updateSupplier } from "@/lib/supplier-actions";
import { SupplierForm } from "@/components/suppliers/supplier-form";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: `${t("Edit Supplier")} · ${t("TextileHub")}` };
}

export default async function EditSupplierPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("suppliers:manage");
  const t = await getT();
  const { id } = await params;
  const supplier = await prisma.supplier.findUnique({ where: { id } });
  if (!supplier) notFound();

  const action = updateSupplier.bind(null, id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href={`/suppliers/${id}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          <ChevronLeft size={16} /> {t("Back")}
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
          {t("Edit supplier")}
        </h1>
      </div>
      <SupplierForm
        action={action}
        defaults={supplier}
        submitLabel="Save changes"
      />
    </div>
  );
}
