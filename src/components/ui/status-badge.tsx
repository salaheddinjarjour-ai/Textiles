"use client";

import { useT } from "@/lib/i18n/context";

const STYLES: Record<string, string> = {
  COMPLETED: "bg-green-50 text-green-700 ring-green-200",
  PROCESSING: "bg-blue-50 text-blue-700 ring-blue-200",
  PENDING: "bg-amber-50 text-amber-700 ring-amber-200",
  CANCELLED: "bg-slate-100 text-slate-500 ring-slate-200",
  RECEIVED: "bg-green-50 text-green-700 ring-green-200",
  PAID: "bg-green-50 text-green-700 ring-green-200",
  PARTIAL: "bg-amber-50 text-amber-700 ring-amber-200",
  UNPAID: "bg-red-50 text-red-700 ring-red-200",
};

const LABELS: Record<string, string> = {
  COMPLETED: "Completed",
  PROCESSING: "Processing",
  PENDING: "Pending",
  CANCELLED: "Cancelled",
  RECEIVED: "Received",
  PAID: "Paid",
  PARTIAL: "Partial",
  UNPAID: "Unpaid",
};

export function StatusBadge({ status }: { status: string }) {
  const t = useT();
  const style = STYLES[status] ?? "bg-slate-100 text-slate-600 ring-slate-200";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${style}`}
    >
      {t(LABELS[status] ?? status)}
    </span>
  );
}
