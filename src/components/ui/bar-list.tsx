interface BarItem {
  label: string;
  sublabel?: string;
  value: number;
  display: string;
}

export function BarList({
  items,
  emptyText = "No data yet.",
}: {
  items: BarItem[];
  emptyText?: string;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  if (items.length === 0) {
    return <p className="px-5 py-6 text-sm text-slate-400">{emptyText}</p>;
  }
  return (
    <ul className="space-y-3 p-5">
      {items.map((item, i) => (
        <li key={i}>
          <div className="mb-1 flex items-baseline justify-between gap-3">
            <span className="truncate text-sm font-medium text-slate-700">
              {item.label}
              {item.sublabel && (
                <span className="ms-1.5 text-xs text-slate-400">{item.sublabel}</span>
              )}
            </span>
            <span className="shrink-0 text-sm font-semibold text-slate-900">
              {item.display}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-blue-500"
              style={{ width: `${Math.max(3, (item.value / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
