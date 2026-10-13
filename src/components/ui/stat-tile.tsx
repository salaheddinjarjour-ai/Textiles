import type { LucideIcon } from "lucide-react";

interface StatTileProps {
  label: string;
  value: string;
  icon: LucideIcon;
  iconClass?: string;
  sub?: string;
}

export function StatTile({
  label,
  value,
  icon: Icon,
  iconClass = "bg-blue-50 text-blue-600",
  sub,
}: StatTileProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`rounded-xl p-2.5 ${iconClass}`}>
          <Icon size={20} />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-medium text-slate-500">{label}</div>
          <div className="truncate text-xl font-bold tracking-tight text-slate-900">
            {value}
          </div>
        </div>
      </div>
      {sub && <div className="mt-2 text-xs text-slate-400">{sub}</div>}
    </div>
  );
}
