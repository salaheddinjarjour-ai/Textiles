import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { updateCustomer } from "@/lib/customer-actions";
import { CustomerForm } from "@/components/customers/customer-form";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: `${t("Edit Customer")} · ${t("TextileHub")}` };
}

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("customers:manage");
  const t = await getT();
  const { id } = await params;
  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) notFound();

  const action = updateCustomer.bind(null, id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href={`/customers/${id}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          <ChevronLeft size={16} /> {t("Back")}
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
          {t("Edit customer")}
        </h1>
      </div>
      <CustomerForm
        action={action}
        defaults={customer}
        submitLabel="Save changes"
      />
    </div>
  );
}
