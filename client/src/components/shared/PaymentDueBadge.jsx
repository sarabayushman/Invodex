import { daysRemaining } from "../../utils/dateHelpers";

export function PaymentDueBadge({ closureDate }) {
  const days = daysRemaining(closureDate);
  const cls = days < 0 ? "bg-red-50 text-red-700 border-red-200" : days <= 7 ? "bg-yellow-50 text-yellow-700 border-yellow-200" : "bg-emerald-50 text-emerald-700 border-emerald-200";
  const label = days < 0 ? `${Math.abs(days)} days overdue` : `${days} days left`;
  return <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-bold ${cls}`}>{label}</span>;
}
