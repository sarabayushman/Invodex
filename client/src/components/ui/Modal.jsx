import { X } from "lucide-react";

import { Button } from "./Button";

export function Modal({ open, title, children, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4">
      <div className="w-full max-w-2xl rounded-lg bg-white shadow-soft">
        <div className="flex items-center justify-between border-b border-slate-100 p-4">
          <h2 className="text-lg font-bold">{title}</h2>
          <Button variant="ghost" onClick={onClose} className="h-9 w-9 p-0" aria-label="Close"><X size={18} /></Button>
        </div>
        <div className="max-h-[80vh] overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}
