"use client";

import { setUserActive, setUserRole } from "@/lib/user-actions";
import { ROLES, ROLE_LABELS } from "@/lib/rbac";
import { useT } from "@/lib/i18n/context";

interface Props {
  userId: string;
  role: string;
  active: boolean;
  isSelf: boolean;
}

export function UserRowActions({ userId, role, active, isSelf }: Props) {
  const t = useT();
  return (
    <div className="flex items-center justify-end gap-2">
      <form action={setUserRole}>
        <input type="hidden" name="userId" value={userId} />
        <select
          name="role"
          defaultValue={role}
          disabled={isSelf}
          onChange={(e) => e.currentTarget.form?.requestSubmit()}
          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-blue-400 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
          title={
            isSelf
              ? t("You cannot change your own role")
              : t("Change role")
          }
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {t(ROLE_LABELS[r])}
            </option>
          ))}
        </select>
      </form>

      {isSelf ? (
        <span className="w-24 text-center text-xs text-slate-300">—</span>
      ) : (
        <form action={setUserActive}>
          <input type="hidden" name="userId" value={userId} />
          <input type="hidden" name="active" value={(!active).toString()} />
          <button
            type="submit"
            className={`w-24 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              active
                ? "border border-slate-200 text-slate-600 hover:bg-slate-50"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
          >
            {t(active ? "Deactivate" : "Activate")}
          </button>
        </form>
      )}
    </div>
  );
}
