export default function Logo({
  className = "",
  showTagline = true,
}: {
  className?: string;
  showTagline?: boolean;
}) {
  return (
    <div
      className={`group flex items-center gap-3 ${className}`}
      aria-label="RenterEasy home"
    >
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--brand-primary)] text-lg font-extrabold text-white shadow-sm shadow-orange-500/20 transition-transform duration-300 group-hover:scale-105">
        R
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-xl font-extrabold tracking-tight text-[var(--brand-text)]">
          RenterEasy
        </span>
        {showTagline && (
          <span className="mt-1 hidden text-[11px] font-medium uppercase tracking-wider text-[var(--brand-muted)] sm:block">
            Verified rentals · Noida & NCR
          </span>
        )}
      </span>
    </div>
  );
}
