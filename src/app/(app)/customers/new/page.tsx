import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requirePermission } from "@/lib/session";
import { createCustomer } from "@/lib/customer-actions";
import { CustomerForm } from "@/components/customers/customer-form";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: `${t("New Customer")} · ${t("TextileHub")}` };
}

export default async function NewCustomerPage() {
  await requirePermission("customers:manage");
  const t = await getT();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/customers"
          className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          <ChevronLeft size={16} /> {t("Customers")}
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
          {t("Add customer")}
        </h1>
      </div>
      <CustomerForm action={createCustomer} />
    </div>
  );
}
