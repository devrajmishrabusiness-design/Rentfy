export default function StatCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string | number;
  sub: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="card p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--brand-muted)]">
            {label}
          </p>
          <p className="mt-2 text-3xl font-extrabold text-[var(--brand-text)]">
            {value}
          </p>
          <p className="mt-1 text-xs text-[var(--brand-muted)]">
            {sub}
          </p>
        </div>
        {icon && (
          <span
            className="grid h-11 w-11 place-items-center rounded-xl bg-slate-900 text-white"
            aria-hidden
          >
            {icon}
          </span>
        )}
      </div>
    </div>
  );
}
