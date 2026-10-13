"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { recordPayment, type PaymentFormState } from "@/lib/accounting-actions";
import { PAYMENT_METHODS } from "@/lib/constants";
import { Field } from "@/components/ui/field";
import { input, btnPrimary } from "@/lib/ui";
import { useT } from "@/lib/i18n/context";

export function PaymentForm({
  invoiceId,
  remaining,
}: {
  invoiceId: string;
  remaining: number;
}) {
  const t = useT();
  const action = recordPayment.bind(null, invoiceId);
  const [state, formAction, pending] = useActionState(
    action,
    {} as PaymentFormState,
  );

  return (
    <form action={formAction} className="space-y-3">
      {state.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {t(state.error)}
        </div>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label={t("Amount ($)")}>
          <input
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            defaultValue={remaining.toFixed(2)}
            className={input}
          />
        </Field>
        <Field label={t("Method")}>
          <select name="method" className={input} defaultValue="Bank Transfer">
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>{t(m)}</option>
            ))}
          </select>
        </Field>
      </div>
      <Field label={t("Reference (optional)")}>
        <input name="reference" className={input} placeholder="Check #, transfer id…" />
      </Field>
      <button type="submit" disabled={pending} className={btnPrimary}>
        {pending && <Loader2 size={16} className="animate-spin" />}
        {t("Record payment")}
      </button>
    </form>
  );
}
