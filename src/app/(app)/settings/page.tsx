import type { Metadata } from "next";
import { Building2, Warehouse as WarehouseIcon, Plus, Check } from "lucide-react";
import { requirePermission, getSession } from "@/lib/session";
import { can, ROLES, ROLE_LABELS, type Permission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { createWarehouse } from "@/lib/settings-actions";
import { PageHeader } from "@/components/ui/page-header";
import { Field } from "@/components/ui/field";
import { card, input, btnPrimary, th, td } from "@/lib/ui";
import { getT } from "@/lib/i18n/server";
import type { TranslateFn } from "@/lib/i18n/translate";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: `${t("Settings")} · ${t("TextileHub")}` };
}

const MODULES: { label: string; view: Permission; manage: Permission | null }[] = [
  { label: "Dashboard", view: "dashboard:view", manage: null },
  { label: "Sales", view: "sales:view", manage: "sales:manage" },
  { label: "Customers", view: "customers:view", manage: "customers:manage" },
  { label: "Inventory", view: "inventory:view", manage: "inventory:manage" },
  { label: "Suppliers", view: "suppliers:view", manage: "suppliers:manage" },
  { label: "Purchases", view: "purchases:view", manage: "purchases:manage" },
  { label: "Accounting", view: "accounting:view", manage: "accounting:manage" },
  { label: "Reports", view: "reports:view", manage: null },
  { label: "Users", view: "users:view", manage: "users:manage" },
  { label: "Settings", view: "settings:view", manage: null },
];

function AccessCell({
  role,
  view,
  manage,
  t,
}: {
  role: string;
  view: Permission;
  manage: Permission | null;
  t: TranslateFn;
}) {
  if (manage && can(role, manage)) {
    return <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">{t("Manage")}</span>;
  }
  if (can(role, view)) {
    return <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">{t("View")}</span>;
  }
  return <span className="text-slate-300">—</span>;
}

export default async function SettingsPage() {
  await requirePermission("settings:view");
  const session = await getSession();
  const manageSettings = session ? can(session.role, "settings:view") : false;
  const t = await getT();

  const warehouses = await prisma.warehouse.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { stock: true } } },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title={t("Settings")}
        subtitle={t("Company profile, warehouses, and access control.")}
      />

      {/* Company profile */}
      <div className={`${card} p-6`}>
        <div className="mb-4 flex items-center gap-2">
          <Building2 size={18} className="text-slate-400" />
          <h2 className="font-semibold text-slate-900">{t("Company profile")}</h2>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Company", "TextileHub ERP"],
            ["Currency", "USD ($)"],
            ["Default tax rate", "8.5%"],
            ["Location", "New York, NY, USA"],
          ].map(([k, v]) => (
            <div key={k}>
              <div className="text-xs font-medium uppercase tracking-wide text-slate-400">{t(k)}</div>
              <div className="mt-1 text-sm font-semibold text-slate-800">{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Warehouses */}
      <div className={`${card} overflow-hidden`}>
        <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
          <WarehouseIcon size={18} className="text-slate-400" />
          <h2 className="font-semibold text-slate-900">{t("Warehouses")}</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100">
              <th className={th}>{t("Name")}</th>
              <th className={th}>{t("Location")}</th>
              <th className={`${th} text-end`}>{t("Stock lots")}</th>
            </tr>
          </thead>
          <tbody>
            {warehouses.map((w) => (
              <tr key={w.id} className="border-b border-slate-50 last:border-0">
                <td className={`${td} font-medium text-slate-800`}>{w.name}</td>
                <td className={td}>{w.location || "—"}</td>
                <td className={`${td} text-end`}>{w._count.stock}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {manageSettings && (
          <form action={createWarehouse} className="flex flex-wrap items-end gap-3 border-t border-slate-100 bg-slate-50/50 px-5 py-4">
            <Field label={t("Warehouse name")}>
              <input name="name" required className={input} placeholder="Warehouse C" />
            </Field>
            <Field label={t("Location")}>
              <input name="location" className={input} placeholder="Dallas, TX" />
            </Field>
            <button type="submit" className={btnPrimary}>
              <Plus size={16} /> {t("Add warehouse")}
            </button>
          </form>
        )}
      </div>

      {/* Roles & permissions matrix */}
      <div className={`${card} overflow-hidden`}>
        <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
          <Check size={18} className="text-slate-400" />
          <h2 className="font-semibold text-slate-900">
            {t("Roles & permissions")}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className={th}>{t("Module")}</th>
                {ROLES.map((r) => (
                  <th key={r} className={`${th} text-center`}>{t(ROLE_LABELS[r])}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MODULES.map((m) => (
                <tr key={m.label} className="border-b border-slate-50 last:border-0">
                  <td className={`${td} font-medium text-slate-800`}>{t(m.label)}</td>
                  {ROLES.map((r) => (
                    <td key={r} className={`${td} text-center`}>
                      <AccessCell role={r} view={m.view} manage={m.manage} t={t} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
