type StatusBadgeProps = {
  status?: string | null;
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const s = (status || "pending").toLowerCase();

  if (s === "approved" || s === "verified") {
    return <span className="badge-success">✓ {status}</span>;
  }
  if (s === "pending") {
    return <span className="badge-warning">⏳ Pending</span>;
  }
  if (s === "rejected") {
    return <span className="badge-error">✗ Rejected</span>;
  }
  return <span className="badge-muted">{status || "Unknown"}</span>;
}
