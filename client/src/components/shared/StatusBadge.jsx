const tone = {
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending: "bg-slate-50 text-slate-700 border-slate-200",
  overdue: "bg-red-50 text-red-700 border-red-200",
  pending_delivery: "bg-amber-50 text-amber-700 border-amber-200",
  issue_raised: "bg-rose-50 text-rose-700 border-rose-200",
  sent: "bg-emerald-50 text-emerald-700 border-emerald-200",
  failed: "bg-red-50 text-red-700 border-red-200",
};

export function StatusBadge({ status }) {
  const label = String(status || "pending").replaceAll("_", " ");
  return <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-bold capitalize ${tone[status] || tone.pending}`}>{label}</span>;
}
