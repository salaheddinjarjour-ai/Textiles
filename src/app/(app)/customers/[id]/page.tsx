import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronLeft,
  Pencil,
  Mail,
  Phone,
  MapPin,
  ShoppingBag,
  DollarSign,
  Receipt,
} from "lucide-react";
import { requirePermission, getSession } from "@/lib/session";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { money, shortDate } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { StatTile } from "@/components/ui/stat-tile";
import { StatusBadge } from "@/components/ui/status-badge";
import { card, th, td, btnGhost } from "@/lib/ui";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: `${t("Customer")} · ${t("TextileHub")}` };
}

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("customers:view");
  const session = await getSession();
  const manage = session ? can(session.role, "customers:manage") : false;
  const t = await getT();
  const { id } = await params;

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      salesOrders: { orderBy: { createdAt: "desc" }, take: 10 },
      invoices: { orderBy: { issueDate: "desc" }, take: 10 },
    },
  });
  if (!customer) notFound();

  const allOrders = await prisma.salesOrder.findMany({
    where: { customerId: id },
    select: { total: true },
  });
  const totalSales = allOrders.reduce((s, o) => s + o.total, 0);
  const allInvoices = await prisma.invoice.findMany({
    where: { customerId: id },
    select: { amount: true, amountPaid: true },
  });
  const outstanding = allInvoices.reduce(
    (s, i) => s + (i.amount - i.amountPaid),
    0,
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Link
          href="/customers"
          className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          <ChevronLeft size={16} /> {t("Customers")}
        </Link>
      </div>

      <PageHeader
        title={customer.company || customer.name}
        subtitle={customer.company ? customer.name : undefined}
      >
        {manage && (
          <Link href={`/customers/${id}/edit`} className={btnGhost}>
            <Pencil size={15} /> {t("Edit")}
          </Link>
        )}
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile label={t("Total orders")} value={String(allOrders.length)} icon={ShoppingBag} />
        <StatTile
          label={t("Total sales")}
          value={money(totalSales)}
          icon={DollarSign}
          iconClass="bg-green-50 text-green-600"
        />
        <StatTile
          label={t("Outstanding")}
          value={money(outstanding)}
          icon={Receipt}
          iconClass={
            outstanding > 0.005
              ? "bg-red-50 text-red-600"
              : "bg-slate-100 text-slate-500"
          }
        />
      </div>

      {/* Contact */}
      <div className={`${card} p-5`}>
        <h2 className="mb-3 font-semibold text-slate-900">{t("Contact")}</h2>
        <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
          <div className="flex items-center gap-2 text-slate-600">
            <Mail size={16} className="text-slate-400" />
            {customer.email || "—"}
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Phone size={16} className="text-slate-400" />
            {customer.phone || "—"}
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <MapPin size={16} className="text-slate-400" />
            {[customer.address, customer.city, customer.country]
              .filter(Boolean)
              .join(", ") || "—"}
          </div>
        </div>
      </div>

      {/* Recent orders */}
      <div className={`${card} overflow-hidden`}>
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">{t("Recent orders")}</h2>
        </div>
        {customer.salesOrders.length === 0 ? (
          <p className="px-5 py-6 text-sm text-slate-400">{t("No orders yet.")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className={th}>{t("Order")}</th>
                  <th className={th}>{t("Date")}</th>
                  <th className={th}>{t("Status")}</th>
                  <th className={`${th} text-end`}>{t("Total")}</th>
                </tr>
              </thead>
              <tbody>
                {customer.salesOrders.map((o) => (
                  <tr key={o.id} className="border-b border-slate-50 last:border-0">
                    <td className={td}>
                      <Link href={`/sales/${o.id}`} className="font-medium text-slate-800 hover:text-blue-600">
                        {o.orderNumber}
                      </Link>
                    </td>
                    <td className={td}>{shortDate(o.createdAt, t.locale)}</td>
                    <td className={td}><StatusBadge status={o.status} /></td>
                    <td className={`${td} text-end font-medium text-slate-900`}>
                      {money(o.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
