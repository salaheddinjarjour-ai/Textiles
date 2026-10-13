import type { Metadata } from "next";
import { requirePermission, getSession } from "@/lib/session";
import { can, ROLE_LABELS, type Role } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { shortDate } from "@/lib/format";
import { AddUserForm } from "@/components/users/add-user-form";
import { UserRowActions } from "@/components/users/user-row-actions";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: `${t("Users")} · ${t("TextileHub")}` };
}

const ROLE_BADGE: Record<string, string> = {
  ADMIN: "bg-purple-50 text-purple-700 ring-purple-200",
  MANAGER: "bg-blue-50 text-blue-700 ring-blue-200",
  SALES: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  WAREHOUSE: "bg-amber-50 text-amber-700 ring-amber-200",
  ACCOUNTANT: "bg-teal-50 text-teal-700 ring-teal-200",
};

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default async function UsersPage() {
  await requirePermission("users:view");
  const session = await getSession();
  const manage = session ? can(session.role, "users:manage") : false;
  const t = await getT();

  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {t("Users & Access")}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {t("Manage who can sign in and what each person is allowed to do.")}
          </p>
        </div>
        {manage && <AddUserForm />}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-start text-xs uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3 font-semibold">{t("User")}</th>
                <th className="px-5 py-3 font-semibold">{t("Role")}</th>
                <th className="px-5 py-3 font-semibold">{t("Status")}</th>
                <th className="px-5 py-3 font-semibold">{t("Added")}</th>
                {manage && (
                  <th className="px-5 py-3 text-end font-semibold">
                    {t("Actions")}
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isSelf = session?.id === u.id;
                return (
                  <tr
                    key={u.id}
                    className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                          {initials(u.name)}
                        </div>
                        <div>
                          <div className="font-medium text-slate-800">
                            {u.name}
                            {isSelf && (
                              <span className="ms-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                                {t("You")}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400">
                            <bdi>{u.email}</bdi>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                          ROLE_BADGE[u.role] ??
                          "bg-slate-100 text-slate-600 ring-slate-200"
                        }`}
                      >
                        {t(ROLE_LABELS[u.role as Role] ?? u.role)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {u.active ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                          {t("Active")}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                          {t("Inactive")}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">
                      {shortDate(u.createdAt, t.locale)}
                    </td>
                    {manage && (
                      <td className="px-5 py-3.5">
                        <UserRowActions
                          userId={u.id}
                          role={u.role}
                          active={u.active}
                          isSelf={isSelf}
                        />
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-slate-400">
        {t(
          "Roles form the access hierarchy: Administrators can manage users and every module; other roles see only the modules they need. You can't change your own role or deactivate your own account.",
        )}
      </p>
    </div>
  );
}
