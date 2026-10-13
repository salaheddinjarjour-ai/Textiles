import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, FileText } from "lucide-react";
import { requirePermission, getSession } from "@/lib/session";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { updateOrderStatus, createInvoiceForOrder } from "@/lib/sales-actions";
import { money, shortDate } from "@/lib/format";
import { ORDER_STATUSES } from "@/lib/constants";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { card, th, td, input, btnPrimary, btnGhost } from "@/lib/ui";
import { getT } from "@/lib/i18n/server";
import { qty } from "@/lib/i18n/translate";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: `${t("Order")} · ${t("TextileHub")}` };
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  PROCESSING: "Processing",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("sales:view");
  const session = await getSession();
  const manage = session ? can(session.role, "sales:manage") : false;
  const canInvoice = session ? can(session.role, "accounting:manage") : false;
  const t = await getT();
  const { id } = await params;

  const order = await prisma.salesOrder.findUnique({
    where: { id },
    include: {
      customer: true,
      createdBy: true,
      invoice: true,
      items: { include: { product: true } },
    },
  });
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/sales"
        className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700"
      >
        <ChevronLeft size={16} /> {t("Sales Orders")}
      </Link>

      <PageHeader
        title={order.orderNumber}
        subtitle={
          order.createdBy
            ? t("Placed {date} by {name}", {
                date: shortDate(order.createdAt, t.locale),
                name: order.createdBy.name,
              })
            : t("Placed {date}", { date: shortDate(order.createdAt, t.locale) })
        }
      >
        <StatusBadge status={order.status} />
      </PageHeader>

      {/* Customer + status controls */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className={`${card} p-5 lg:col-span-2`}>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {t("Bill to")}
          </div>
          <Link
            href={`/customers/${order.customer.id}`}
            className="mt-1 block text-lg font-semibold text-slate-900 hover:text-blue-600"
          >
            <bdi>{order.customer.company || order.customer.name}</bdi>
          </Link>
          <div className="mt-0.5 text-sm text-slate-500">
            {[order.customer.email, order.customer.phone].filter(Boolean).join(" · ")}
          </div>
          {order.customer.address && (
            <div className="text-sm text-slate-500">
              {[order.customer.address, order.customer.city, order.customer.country].filter(Boolean).join(", ")}
            </div>
          )}
          {order.notes && (
            <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
              <span className="font-medium text-slate-700">{t("Notes")}:</span> <bdi>{order.notes}</bdi>
            </div>
          )}
        </div>

        {manage && (
          <div className={`${card} p-5`}>
            <h2 className="font-semibold text-slate-900">{t("Update status")}</h2>
            <form action={updateOrderStatus} className="mt-3 space-y-3">
              <input type="hidden" name="orderId" value={order.id} />
              <select name="status" defaultValue={order.status} className={input}>
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {t(STATUS_LABELS[s] ?? s)}
                  </option>
                ))}
              </select>
              <button type="submit" className={`${btnPrimary} w-full`}>
                {t("Save status")}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Items */}
      <div className={`${card} overflow-hidden`}>
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">{t("Items")}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className={th}>{t("Product")}</th>
                <th className={`${th} text-end`}>{t("Unit price")}</th>
                <th className={`${th} text-end`}>{t("Qty")}</th>
                <th className={`${th} text-end`}>{t("Total")}</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((it) => (
                <tr key={it.id} className="border-b border-slate-50 last:border-0">
                  <td className={td}>
                    <span className="font-medium text-slate-800"><bdi>{it.product.name}</bdi></span>
                    <span className="ms-1 text-xs text-slate-400">{it.product.sku}</span>
                  </td>
                  <td className={`${td} text-end`}>{money(it.unitPrice)}</td>
                  <td className={`${td} text-end`}>
                    {qty(it.quantity, it.product.unit, t)}
                  </td>
                  <td className={`${td} text-end font-medium text-slate-900`}>
                    {money(it.lineTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-100 px-5 py-4">
          <div className="ms-auto w-full max-w-xs space-y-1.5 text-sm">
            <div className="flex justify-between text-slate-500">
              <span>{t("Subtotal")}</span>
              <span className="font-medium text-slate-700">{money(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>
                {t("Tax ({value}%)", {
                  value: (order.taxRate * 100).toFixed(1),
                })}
              </span>
              <span className="font-medium text-slate-700">{money(order.taxAmount)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-1.5 text-base">
              <span className="font-semibold text-slate-900">{t("Total")}</span>
              <span className="font-bold text-slate-900">{money(order.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice */}
      <div className={`${card} flex flex-wrap items-center justify-between gap-3 p-5`}>
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-purple-50 p-2.5">
            <FileText size={20} className="text-purple-600" />
          </div>
          <div>
            <div className="font-semibold text-slate-900">{t("Invoice")}</div>
            <div className="text-sm text-slate-500">
              {order.invoice
                ? `${order.invoice.invoiceNumber} · ${money(order.invoice.amount)}`
                : t("No invoice generated for this order yet.")}
            </div>
          </div>
        </div>
        {order.invoice ? (
          <div className="flex items-center gap-2">
            <StatusBadge status={order.invoice.status} />
            <Link href="/accounting" className={btnGhost}>
              {t("View in Accounting")}
            </Link>
          </div>
        ) : (
          canInvoice && (
            <form action={createInvoiceForOrder}>
              <input type="hidden" name="orderId" value={order.id} />
              <button type="submit" className={btnPrimary}>
                {t("Generate invoice")}
              </button>
            </form>
          )
        )}
      </div>
    </div>
  );
}
