"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { createProduct, type ProductFormState } from "@/lib/inventory-actions";
import { CATEGORIES, UNITS } from "@/lib/constants";
import { Field } from "@/components/ui/field";
import { input, btnPrimary, btnGhost, card } from "@/lib/ui";
import { useT } from "@/lib/i18n/context";

interface Warehouse {
  id: string;
  name: string;
}

export function ProductForm({ warehouses }: { warehouses: Warehouse[] }) {
  const t = useT();
  const [state, formAction, pending] = useActionState(createProduct, {} as ProductFormState);

  return (
    <form action={formAction} className={`${card} p-6`}>
      {state.error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {t(state.error)}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={t("Fabric / product name")}>
          <input name="name" required className={input} placeholder="Cotton Poplin White" />
        </Field>
        <Field label={t("SKU")}>
          <input name="sku" required className={input} placeholder="CP-WHT" />
        </Field>
        <Field label={t("Category")}>
          <select name="category" className={input} defaultValue="Cotton">
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{t(c)}</option>
            ))}
          </select>
        </Field>
        <Field label={t("Unit")}>
          <select name="unit" className={input} defaultValue="Meter">
            {UNITS.map((u) => (
              <option key={u} value={u}>{t(u)}</option>
            ))}
          </select>
        </Field>
        <Field label={t("Color (optional)")}>
          <input name="color" className={input} placeholder="White" />
        </Field>
        <Field label={t("Reorder level")} hint={t("Low-stock alerts trigger at or below this quantity.")}>
          <input name="reorderLevel" type="number" min={0} step={1} defaultValue={0} className={input} />
        </Field>
        <Field label={t("Cost price ($ per unit)")}>
          <input name="costPrice" type="number" min={0} step="0.01" defaultValue={0} className={input} />
        </Field>
        <Field label={t("Sell price ($ per unit)")}>
          <input name="sellPrice" type="number" min={0} step="0.01" defaultValue={0} className={input} />
        </Field>
      </div>

      <div className="mt-6 border-t border-slate-100 pt-5">
        <h3 className="text-sm font-semibold text-slate-700">
          {t("Opening stock")}{" "}
          <span className="font-normal text-slate-400">{t("(optional)")}</span>
        </h3>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label={t("Quantity")}>
            <input name="initialQty" type="number" min={0} step={1} defaultValue={0} className={input} />
          </Field>
          <Field label={t("Warehouse")}>
            <select name="warehouseId" className={input} defaultValue={warehouses[0]?.id ?? ""}>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>{t(w.name)}</option>
              ))}
            </select>
          </Field>
          <Field label={t("Lot number")}>
            <input name="lotNumber" className={input} placeholder={t("Auto if blank")} />
          </Field>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <Link href="/inventory" className={btnGhost}>{t("Cancel")}</Link>
        <button type="submit" disabled={pending} className={btnPrimary}>
          {pending && <Loader2 size={16} className="animate-spin" />}
          {t("Save product")}
        </button>
      </div>
    </form>
  );
}
