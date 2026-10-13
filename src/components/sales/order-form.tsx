"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { createSalesOrder, type OrderFormState } from "@/lib/sales-actions";
import { DEFAULT_TAX_RATE } from "@/lib/constants";
import { Field } from "@/components/ui/field";
import { input, btnPrimary, btnGhost, card } from "@/lib/ui";
import { useT } from "@/lib/i18n/context";

interface ProductOption {
  id: string;
  name: string;
  sku: string;
  unit: string;
  sellPrice: number;
}
interface CustomerOption {
  id: string;
  label: string;
}
interface Line {
  productId: string;
  quantity: number;
}

const usd = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

export function OrderForm({
  customers,
  products,
}: {
  customers: CustomerOption[];
  products: ProductOption[];
}) {
  const [state, formAction, pending] = useActionState(
    createSalesOrder,
    {} as OrderFormState,
  );
  const t = useT();
  const [customerId, setCustomerId] = useState("");
  const [lines, setLines] = useState<Line[]>([{ productId: "", quantity: 1 }]);

  const productMap = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products],
  );

  const { subtotal, tax, total } = useMemo(() => {
    const sub = lines.reduce((s, l) => {
      const p = productMap.get(l.productId);
      return s + (p ? p.sellPrice * (l.quantity || 0) : 0);
    }, 0);
    const taxAmt = sub * DEFAULT_TAX_RATE;
    return { subtotal: sub, tax: taxAmt, total: sub + taxAmt };
  }, [lines, productMap]);

  const validLines = lines.filter((l) => l.productId && l.quantity > 0);
  const canSubmit = !!customerId && validLines.length > 0 && !pending;

  const setLine = (i: number, patch: Partial<Line>) =>
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  const addLine = () =>
    setLines((prev) => [...prev, { productId: "", quantity: 1 }]);
  const removeLine = (i: number) =>
    setLines((prev) => (prev.length === 1 ? prev : prev.filter((_, idx) => idx !== i)));

  return (
    <form action={formAction} className="space-y-4">
      {/* Serialized data for the server action */}
      <input type="hidden" name="items" value={JSON.stringify(validLines)} />

      {state.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {t(state.error)}
        </div>
      )}

      <div className={`${card} p-6`}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t("Customer")}>
            <select
              name="customerId"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className={input}
              required
            >
              <option value="">{t("Select a customer…")}</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </Field>
          <Field label={t("Notes (optional)")}>
            <input name="notes" className={input} placeholder={t("Delivery instructions, PO ref…")} />
          </Field>
        </div>
      </div>

      {/* Line items */}
      <div className={`${card} overflow-hidden`}>
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">{t("Items")}</h2>
          <button type="button" onClick={addLine} className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700">
            <Plus size={16} /> {t("Add item")}
          </button>
        </div>

        <div className="divide-y divide-slate-50">
          {lines.map((line, i) => {
            const p = productMap.get(line.productId);
            const lineTotal = p ? p.sellPrice * (line.quantity || 0) : 0;
            return (
              <div key={i} className="grid grid-cols-12 items-end gap-3 px-5 py-3">
                <div className="col-span-12 sm:col-span-6">
                  <label className="mb-1 block text-xs font-medium text-slate-500">{t("Product")}</label>
                  <select
                    value={line.productId}
                    onChange={(e) => setLine(i, { productId: e.target.value })}
                    className={input}
                  >
                    <option value="">{t("Select product…")}</option>
                    {products.map((prod) => (
                      <option key={prod.id} value={prod.id}>
                        {prod.name} ({prod.sku})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-slate-500">{t("Unit price")}</label>
                  <div className="px-1 py-2.5 text-sm text-slate-600">
                    {p ? usd(p.sellPrice) : "—"}
                  </div>
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-slate-500">{t("Qty")}</label>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={line.quantity}
                    onChange={(e) => setLine(i, { quantity: parseInt(e.target.value) || 0 })}
                    className={input}
                  />
                </div>
                <div className="col-span-3 sm:col-span-1 text-end">
                  <label className="mb-1 block text-xs font-medium text-slate-500">{t("Total")}</label>
                  <div className="py-2.5 text-sm font-semibold text-slate-900">
                    {usd(lineTotal)}
                  </div>
                </div>
                <div className="col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeLine(i)}
                    disabled={lines.length === 1}
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-30"
                    aria-label={t("Remove item")}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Totals */}
        <div className="border-t border-slate-100 px-5 py-4">
          <div className="ms-auto w-full max-w-xs space-y-1.5 text-sm">
            <div className="flex justify-between text-slate-500">
              <span>{t("Subtotal")}</span>
              <span className="font-medium text-slate-700">{usd(subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>
                {t("Tax ({value}%)", {
                  value: (DEFAULT_TAX_RATE * 100).toFixed(1),
                })}
              </span>
              <span className="font-medium text-slate-700">{usd(tax)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-1.5 text-base">
              <span className="font-semibold text-slate-900">{t("Total")}</span>
              <span className="font-bold text-slate-900">{usd(total)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Link href="/sales" className={btnGhost}>{t("Cancel")}</Link>
        <button type="submit" disabled={!canSubmit} className={btnPrimary}>
          {pending && <Loader2 size={16} className="animate-spin" />}
          {t("Create order")}
        </button>
      </div>
    </form>
  );
}
