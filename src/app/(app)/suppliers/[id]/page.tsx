import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Pencil, Mail, Phone, MapPin } from "lucide-react";
import { requirePermission, getSession } from "@/lib/session";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { money, shortDate } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { card, th, td, btnGhost } from "@/lib/ui";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: `${t("Supplier")} · ${t("TextileHub")}` };
}

export default async function SupplierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("suppliers:view");
  const session = await getSession();
  const manage = session ? can(session.role, "suppliers:manage") : false;
  const t = await getT();
  const { id } = await params;

  const supplier = await prisma.supplier.findUnique({
    where: { id },
    include: {
      purchaseOrders: {
        orderBy: { createdAt: "desc" },
        take: 15,
      },
    },
  });
  if (!supplier) notFound();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        href="/suppliers"
        className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700"
      >
        <ChevronLeft size={16} /> {t("Suppliers")}
      </Link>

      <PageHeader
        title={supplier.company || supplier.name}
        subtitle={supplier.company ? supplier.name : undefined}
      >
        {manage && (
          <Link href={`/suppliers/${id}/edit`} className={btnGhost}>
            <Pencil size={15} /> {t("Edit")}
          </Link>
        )}
      </PageHeader>

      <div className={`${card} p-5`}>
        <h2 className="mb-3 font-semibold text-slate-900">{t("Contact")}</h2>
        <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
          <div className="flex items-center gap-2 text-slate-600">
            <Mail size={16} className="text-slate-400" />
            {supplier.email || "—"}
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Phone size={16} className="text-slate-400" />
            {supplier.phone || "—"}
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <MapPin size={16} className="text-slate-400" />
            {supplier.address || "—"}
          </div>
        </div>
      </div>

      <div className={`${card} overflow-hidden`}>
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">{t("Purchase orders")}</h2>
        </div>
        {supplier.purchaseOrders.length === 0 ? (
          <p className="px-5 py-6 text-sm text-slate-400">
            {t("No purchase orders yet")}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className={th}>PO</th>
                  <th className={th}>{t("Date")}</th>
                  <th className={th}>{t("Status")}</th>
                  <th className={`${th} text-end`}>{t("Total")}</th>
                </tr>
              </thead>
              <tbody>
                {supplier.purchaseOrders.map((po) => (
                  <tr key={po.id} className="border-b border-slate-50 last:border-0">
                    <td className={td}>
                      <Link href={`/purchases/${po.id}`} className="font-medium text-slate-800 hover:text-blue-600">
                        {po.poNumber}
                      </Link>
                    </td>
                    <td className={td}>{shortDate(po.createdAt, t.locale)}</td>
                    <td className={td}><StatusBadge status={po.status} /></td>
                    <td className={`${td} text-end font-medium text-slate-900`}>
                      {money(po.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
