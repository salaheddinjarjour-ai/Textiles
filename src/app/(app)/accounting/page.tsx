import type { Metadata } from "next";
import Link from "next/link";
import {
  DollarSign,
  Receipt,
  TrendingDown,
  Wallet,
  Plus,
} from "lucide-react";
import { requirePermission, getSession } from "@/lib/session";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { createTransaction } from "@/lib/accounting-actions";
import { money, shortDate } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { StatTile } from "@/components/ui/stat-tile";
import { StatusBadge } from "@/components/ui/status-badge";
import { Field } from "@/components/ui/field";
import { card, th, td, input, btnPrimary } from "@/lib/ui";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: `${t("Accounting")} · ${t("TextileHub")}` };
}

export default async function AccountingPage() {
  await requirePermission("accounting:view");
  const session = await getSession();
  const manage = session ? can(session.role, "accounting:manage") : false;
  const t = await getT();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    invoices,
    invoiceAgg,
    paidThisMonth,
    expenseThisMonth,
    payments,
    transactions,
  ] = await Promise.all([
    prisma.invoice.findMany({
      orderBy: { issueDate: "desc" },
      take: 12,
      include: { customer: true },
    }),
    prisma.invoice.aggregate({ _sum: { amount: true, amountPaid: true } }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { receivedAt: { gte: monthStart } },
    }),
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { type: "EXPENSE", date: { gte: monthStart } },
    }),
    prisma.payment.findMany({
      orderBy: { receivedAt: "desc" },
      take: 8,
      include: { customer: true },
    }),
    prisma.transaction.findMany({ orderBy: { date: "desc" }, take: 10 }),
  ]);

  const invoiced = invoiceAgg._sum.amount ?? 0;
  const collected = invoiceAgg._sum.amountPaid ?? 0;
  const outstanding = invoiced - collected;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title={t("Accounting")}
        subtitle={t("Invoices, payments and the money side of the business.")}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label={t("Outstanding (A/R)")} value={money(outstanding)} icon={Receipt} iconClass="bg-red-50 text-red-600" />
        <StatTile label={t("Collected this month")} value={money(paidThisMonth._sum.amount ?? 0)} icon={Wallet} iconClass="bg-green-50 text-green-600" />
        <StatTile label={t("Total invoiced")} value={money(invoiced)} icon={DollarSign} iconClass="bg-blue-50 text-blue-600" />
        <StatTile label={t("Expenses this month")} value={money(expenseThisMonth._sum.amount ?? 0)} icon={TrendingDown} iconClass="bg-amber-50 text-amber-600" />
      </div>

      {/* Invoices */}
      <div className={`${card} overflow-hidden`}>
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">{t("Recent invoices")}</h2>
        </div>
        {invoices.length === 0 ? (
          <p className="px-5 py-6 text-sm text-slate-400">{t("No invoices yet. Generate one from a completed sales order.")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className={th}>{t("Invoice")}</th>
                  <th className={th}>{t("Customer")}</th>
                  <th className={th}>{t("Issued")}</th>
                  <th className={`${th} text-end`}>{t("Amount")}</th>
                  <th className={`${th} text-end`}>{t("Balance")}</th>
                  <th className={th}>{t("Status")}</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                    <td className={td}>
                      <Link href={`/accounting/invoices/${inv.id}`} className="font-medium text-slate-800 hover:text-blue-600">
                        {inv.invoiceNumber}
                      </Link>
                    </td>
                    <td className={td}><bdi>{inv.customer.company || inv.customer.name}</bdi></td>
                    <td className={td}>{shortDate(inv.issueDate, t.locale)}</td>
                    <td className={`${td} text-end`}>{money(inv.amount)}</td>
                    <td className={`${td} text-end font-medium ${inv.amount - inv.amountPaid > 0.005 ? "text-red-600" : "text-slate-400"}`}>
                      {money(inv.amount - inv.amountPaid)}
                    </td>
                    <td className={td}><StatusBadge status={inv.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Recent payments */}
        <div className={`${card} overflow-hidden`}>
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-900">
              {t("Recent payments")}
            </h2>
          </div>
          {payments.length === 0 ? (
            <p className="px-5 py-6 text-sm text-slate-400">
              {t("No payments recorded yet.")}
            </p>
          ) : (
            <ul className="divide-y divide-slate-50">
              {payments.map((p) => (
                <li key={p.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <div className="text-sm font-medium text-slate-800">
                      <bdi>{p.customer.company || p.customer.name}</bdi>
                    </div>
                    <div className="text-xs text-slate-400">
                      {p.method} · {shortDate(p.receivedAt, t.locale)}
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-green-600">
                    +{money(p.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Expenses / income ledger */}
        <div className={`${card} overflow-hidden`}>
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-900">{t("Ledger")}</h2>
          </div>
          {manage && (
            <form action={createTransaction} className="border-b border-slate-100 bg-slate-50/50 px-5 py-4">
              <div className="grid grid-cols-2 gap-2">
                <Field label={t("Type")}>
                  <select name="type" className={input} defaultValue="EXPENSE">
                    <option value="EXPENSE">{t("Expense")}</option>
                    <option value="INCOME">{t("Income")}</option>
                  </select>
                </Field>
                <Field label={t("Amount ($)")}>
                  <input name="amount" type="number" min="0.01" step="0.01" className={input} required />
                </Field>
                <Field label={t("Category")} className="col-span-2">
                  <input name="category" className={input} placeholder="Rent, Utilities, Freight…" required />
                </Field>
              </div>
              <input type="hidden" name="description" value="" />
              <button type="submit" className={`${btnPrimary} mt-3 w-full`}>
                <Plus size={16} /> {t("Add entry")}
              </button>
            </form>
          )}
          {transactions.length === 0 ? (
            <p className="px-5 py-6 text-sm text-slate-400">{t("No ledger entries yet.")}</p>
          ) : (
            <ul className="divide-y divide-slate-50">
              {transactions.map((tx) => (
                <li key={tx.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <div className="text-sm font-medium text-slate-800"><bdi>{tx.category}</bdi></div>
                    <div className="text-xs text-slate-400">{shortDate(tx.date, t.locale)}</div>
                  </div>
                  <span className={`text-sm font-semibold ${tx.type === "INCOME" ? "text-green-600" : "text-slate-700"}`}>
                    {tx.type === "INCOME" ? "+" : "−"}{money(tx.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
