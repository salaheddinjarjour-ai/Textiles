interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, subtitle, children }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        {/* <bdi> isolates titles that may be user data (e.g. a Latin company
            name) so punctuation renders correctly inside an RTL page. */}
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          <bdi>{title}</bdi>
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-slate-500">
            <bdi>{subtitle}</bdi>
          </p>
        )}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
