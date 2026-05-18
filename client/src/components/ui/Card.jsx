import { clsx } from "clsx";

export function Card({ className, ...props }) {
  return <section className={clsx("rounded-lg border border-slate-200 bg-white shadow-sm", className)} {...props} />;
}

export function CardHeader({ className, ...props }) {
  return <div className={clsx("border-b border-slate-100 p-4", className)} {...props} />;
}

export function CardContent({ className, ...props }) {
  return <div className={clsx("p-4", className)} {...props} />;
}
