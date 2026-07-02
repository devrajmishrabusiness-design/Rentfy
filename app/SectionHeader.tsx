export default function SectionHeader({
  eyebrow,
  title,
  description,
  align = "left",
}: {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}) {
  return (
    <div
      className={`max-w-2xl ${
        align === "center" ? "mx-auto text-center" : ""
      }`}
    >
      <p className="text-sm font-bold uppercase tracking-wider text-[var(--brand-primary)]">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-extrabold text-[var(--brand-text)] sm:text-4xl">
        {title}
      </h2>
      {description && (
        <p className={`mt-${align === "center" ? "4" : "3"} text-[var(--brand-muted)]`}>
          {description}
        </p>
      )}
    </div>
  );
}
