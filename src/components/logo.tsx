interface LogoProps {
  size?: number;
  className?: string;
}

/** The TextileHub woven-knot mark. */
export function LogoMark({ size = 36, className }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect width="40" height="40" rx="10" fill="#2563eb" />
      <g stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round">
        <path d="M12 12 L28 28" />
        <path d="M28 12 L12 28" />
        <path d="M20 8 L20 32" />
        <path d="M8 20 L32 20" />
      </g>
      <circle cx="20" cy="20" r="3.4" fill="#ffffff" />
    </svg>
  );
}

export function LogoFull({ size = 36 }: LogoProps) {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark size={size} />
      <div className="leading-tight">
        <div className="text-[17px] font-bold tracking-tight text-slate-900">
          TextileHub
        </div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          ERP
        </div>
      </div>
    </div>
  );
}
