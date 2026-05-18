export function addDays(dateValue, days) {
  const date = new Date(dateValue);
  date.setDate(date.getDate() + Number(days || 0));
  return date.toISOString().slice(0, 10);
}

export function daysRemaining(closureDate) {
  if (!closureDate) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(closureDate);
  due.setHours(0, 0, 0, 0);
  return Math.ceil((due - today) / 86400000);
}

export function formatDate(dateValue) {
  if (!dateValue) return "-";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(dateValue));
}
