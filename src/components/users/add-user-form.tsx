"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Loader2, UserPlus, X } from "lucide-react";
import { createUser, type UserFormState } from "@/lib/user-actions";
import { ROLES, ROLE_LABELS, ROLE_DESCRIPTIONS, type Role } from "@/lib/rbac";
import { useT } from "@/lib/i18n/context";

const initial: UserFormState = {};

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

export function AddUserForm() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createUser, initial);
  const [role, setRole] = useState<Role>("SALES");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
      >
        <UserPlus size={17} />
        {t("Add User")}
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">{t("Add a new user")}</h3>
        <button
          onClick={() => setOpen(false)}
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
          aria-label={t("Cancel")}
        >
          <X size={18} />
        </button>
      </div>

      {state.error && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {t(state.error)}
        </div>
      )}
      {state.success && (
        <div className="mt-3 rounded-lg border border-green-200 bg-green-50 px-3.5 py-2.5 text-sm text-green-700">
          {t(state.success)}
        </div>
      )}

      <form ref={formRef} action={formAction} className="mt-4 space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t("Full name")}>
            <input
              name="name"
              required
              placeholder="Jane Doe"
              className={inputClass}
            />
          </Field>
          <Field label={t("Email")}>
            <input
              name="email"
              type="email"
              required
              placeholder="jane@company.com"
              className={inputClass}
            />
          </Field>
          <Field label={t("Role")}>
            <select
              name="role"
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className={inputClass}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {t(ROLE_LABELS[r])}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("Temporary password")}>
            <input
              name="password"
              type="text"
              required
              minLength={6}
              placeholder={t("At least 6 characters")}
              className={inputClass}
            />
          </Field>
        </div>

        <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
          <span className="font-semibold text-slate-600">
            {t(ROLE_LABELS[role])}:
          </span>{" "}
          {t(ROLE_DESCRIPTIONS[role])}
        </p>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            {t("Cancel")}
          </button>
          <button
            type="submit"
            disabled={pending}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-70"
          >
            {pending && <Loader2 size={16} className="animate-spin" />}
            {t("Create user")}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </span>
      {children}
    </label>
  );
}
