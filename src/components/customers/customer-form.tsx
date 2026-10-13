"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import type { CustomerFormState } from "@/lib/customer-actions";
import { Field } from "@/components/ui/field";
import { input, btnPrimary, btnGhost, card } from "@/lib/ui";
import { useT } from "@/lib/i18n/context";

type Action = (
  prev: CustomerFormState,
  formData: FormData,
) => Promise<CustomerFormState>;

interface Defaults {
  name?: string;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
}

export function CustomerForm({
  action,
  defaults = {},
  submitLabel = "Save customer",
}: {
  action: Action;
  defaults?: Defaults;
  submitLabel?: string;
}) {
  const t = useT();
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className={`${card} p-6`}>
      {state.error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {t(state.error)}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={t("Customer / store name")}>
          <input name="name" required defaultValue={defaults.name ?? ""} className={input} placeholder="Metro Apparel Co." />
        </Field>
        <Field label={t("Company (optional)")}>
          <input name="company" defaultValue={defaults.company ?? ""} className={input} placeholder="Metro Apparel Co." />
        </Field>
        <Field label={t("Email")}>
          <input name="email" type="email" defaultValue={defaults.email ?? ""} className={input} placeholder="orders@company.com" />
        </Field>
        <Field label={t("Phone")}>
          <input name="phone" defaultValue={defaults.phone ?? ""} className={input} placeholder="+1 (555) 123-4567" />
        </Field>
        <Field label={t("Address")} className="sm:col-span-2">
          <input name="address" defaultValue={defaults.address ?? ""} className={input} placeholder="123 Market St" />
        </Field>
        <Field label={t("City")}>
          <input name="city" defaultValue={defaults.city ?? ""} className={input} placeholder="New York" />
        </Field>
        <Field label={t("Country")}>
          <input name="country" defaultValue={defaults.country ?? "USA"} className={input} />
        </Field>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <Link href="/customers" className={btnGhost}>
          {t("Cancel")}
        </Link>
        <button type="submit" disabled={pending} className={btnPrimary}>
          {pending && <Loader2 size={16} className="animate-spin" />}
          {t(submitLabel)}
        </button>
      </div>
    </form>
  );
}
