import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requirePermission, getSession } from "@/lib/session";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { money, shortDate } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { PaymentForm } from "@/components/accounting/payment-form";
import { card, th, td } from "@/lib/ui";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: `${t("Invoice")} · ${t("TextileHub")}` };
}

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("accounting:view");
  const session = await getSession();
  const manage = session ? can(session.role, "accounting:manage") : false;
  const t = await getT();
  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      customer: true,
      payments: { orderBy: { receivedAt: "desc" } },
      salesOrder: true,
    },
  });
  if (!invoice) notFound();

  const remaining = Math.max(0, invoice.amount - invoice.amountPaid);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/accounting"
        className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700"
      >
        <ChevronLeft size={16} /> {t("Accounting")}
      </Link>

      <PageHeader
        title={invoice.invoiceNumber}
        subtitle={
          invoice.dueDate
            ? t("Issued {date} · due {date2}", {
                date: shortDate(invoice.issueDate, t.locale),
                date2: shortDate(invoice.dueDate, t.locale),
              })
            : t("Issued {date}", { date: shortDate(invoice.issueDate, t.locale) })
        }
      >
        <StatusBadge status={invoice.status} />
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className={`${card} p-5 lg:col-span-2`}>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t("Billed to")}</div>
          <Link href={`/customers/${invoice.customer.id}`} className="mt-1 block text-lg font-semibold text-slate-900 hover:text-blue-600">
            <bdi>{invoice.customer.company || invoice.customer.name}</bdi>
          </Link>
          {invoice.salesOrder && (
            <Link href={`/sales/${invoice.salesOrder.id}`} className="mt-1 inline-block text-sm text-blue-600 hover:text-blue-700">
              {t("From order {order}", { order: invoice.salesOrder.orderNumber })}
            </Link>
          )}

          <div className="mt-5 space-y-1.5 border-t border-slate-100 pt-4 text-sm">
            <div className="flex justify-between text-slate-500">
              <span>{t("Invoice amount")}</span>
              <span className="font-medium text-slate-700">{money(invoice.amount)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>{t("Paid")}</span>
              <span className="font-medium text-green-600">{money(invoice.amountPaid)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-1.5 text-base">
              <span className="font-semibold text-slate-900">{t("Balance due")}</span>
              <span className={`font-bold ${remaining > 0.005 ? "text-red-600" : "text-slate-900"}`}>
                {money(remaining)}
              </span>
            </div>
          </div>
        </div>

        {manage && remaining > 0.005 && (
          <div className={`${card} p-5`}>
            <h2 className="font-semibold text-slate-900">{t("Record a payment")}</h2>
            <div className="mt-3">
              <PaymentForm invoiceId={invoice.id} remaining={remaining} />
            </div>
          </div>
        )}
      </div>

      <div className={`${card} overflow-hidden`}>
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">{t("Payment history")}</h2>
        </div>
        {invoice.payments.length === 0 ? (
          <p className="px-5 py-6 text-sm text-slate-400">{t("No payments recorded yet.")}</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className={th}>{t("Date")}</th>
                <th className={th}>{t("Method")}</th>
                <th className={th}>{t("Reference")}</th>
                <th className={`${th} text-end`}>{t("Amount")}</th>
              </tr>
            </thead>
            <tbody>
              {invoice.payments.map((p) => (
                <tr key={p.id} className="border-b border-slate-50 last:border-0">
                  <td className={td}>{shortDate(p.receivedAt, t.locale)}</td>
                  <td className={td}>{t(p.method)}</td>
                  <td className={td}>{p.reference || "—"}</td>
                  <td className={`${td} text-end font-medium text-green-600`}>{money(p.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
