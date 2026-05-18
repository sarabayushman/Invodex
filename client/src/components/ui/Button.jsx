import { clsx } from "clsx";

export function Button({ className, variant = "primary", ...props }) {
  const variants = {
    primary: "bg-primary text-white hover:bg-blue-700",
    secondary: "bg-slate-100 text-slate-800 hover:bg-slate-200",
    danger: "bg-red-600 text-white hover:bg-red-700",
    ghost: "bg-transparent text-slate-700 hover:bg-slate-100",
  };
  return <button className={clsx("inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition disabled:opacity-50", variants[variant], className)} {...props} />;
}
