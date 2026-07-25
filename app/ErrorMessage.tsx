export default function ErrorMessage({
  message,
  className = "",
}: {
  message?: string | null;
  className?: string;
}) {
  if (!message) return null;
  return (
    <div
      className={`rounded-2xl border border-[var(--brand-error)] bg-red-50 px-4 py-3 text-sm font-medium text-[var(--brand-error)] ${className}`}
      role="alert"
    >
      {message}
    </div>
  );
}