"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { createPurchaseOrder, type POFormState } from "@/lib/purchase-actions";
import { Field } from "@/components/ui/field";
import { input, btnPrimary, btnGhost, card } from "@/lib/ui";
import { useT } from "@/lib/i18n/context";

interface ProductOption {
  id: string;
  name: string;
  sku: string;
  unit: string;
  costPrice: number;
}
interface SupplierOption {
  id: string;
  label: string;
}
interface Line {
  productId: string;
  quantity: number;
}

const usd = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

export function PurchaseOrderForm({
  suppliers,
  products,
}: {
  suppliers: SupplierOption[];
  products: ProductOption[];
}) {
  const [state, formAction, pending] = useActionState(
    createPurchaseOrder,
    {} as POFormState,
  );
  const t = useT();
  const [supplierId, setSupplierId] = useState("");
  const [lines, setLines] = useState<Line[]>([{ productId: "", quantity: 1 }]);

  const productMap = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products],
  );

  const total = useMemo(
    () =>
      lines.reduce((s, l) => {
        const p = productMap.get(l.productId);
        return s + (p ? p.costPrice * (l.quantity || 0) : 0);
      }, 0),
    [lines, productMap],
  );

  const validLines = lines.filter((l) => l.productId && l.quantity > 0);
  const canSubmit = !!supplierId && validLines.length > 0 && !pending;

  const setLine = (i: number, patch: Partial<Line>) =>
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="items" value={JSON.stringify(validLines)} />

      {state.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {t(state.error)}
        </div>
      )}

      <div className={`${card} p-6`}>
        <Field label={t("Supplier")} className="max-w-md">
          <select
            name="supplierId"
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            className={input}
            required
          >
            <option value="">{t("Select a supplier…")}</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </Field>
      </div>

      <div className={`${card} overflow-hidden`}>
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">{t("Items")}</h2>
          <button
            type="button"
            onClick={() => setLines((p) => [...p, { productId: "", quantity: 1 }])}
            className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            <Plus size={16} /> {t("Add item")}
          </button>
        </div>

        <div className="divide-y divide-slate-50">
          {lines.map((line, i) => {
            const p = productMap.get(line.productId);
            const lineTotal = p ? p.costPrice * (line.quantity || 0) : 0;
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
                  <label className="mb-1 block text-xs font-medium text-slate-500">{t("Unit cost")}</label>
                  <div className="px-1 py-2.5 text-sm text-slate-600">{p ? usd(p.costPrice) : "—"}</div>
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
                  <div className="py-2.5 text-sm font-semibold text-slate-900">{usd(lineTotal)}</div>
                </div>
                <div className="col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setLines((prev) => (prev.length === 1 ? prev : prev.filter((_, idx) => idx !== i)))}
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

        <div className="border-t border-slate-100 px-5 py-4">
          <div className="ms-auto flex w-full max-w-xs justify-between text-base">
            <span className="font-semibold text-slate-900">{t("Order total")}</span>
            <span className="font-bold text-slate-900">{usd(total)}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Link href="/purchases" className={btnGhost}>{t("Cancel")}</Link>
        <button type="submit" disabled={!canSubmit} className={btnPrimary}>
          {pending && <Loader2 size={16} className="animate-spin" />}
          {t("Create purchase order")}
        </button>
      </div>
    </form>
  );
}
