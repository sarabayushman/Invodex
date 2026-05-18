import { useState } from "react";

import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { PaymentDueBadge } from "../components/shared/PaymentDueBadge";
import { StatusBadge } from "../components/shared/StatusBadge";
import { useInvoices } from "../hooks/useInvoices";
import { formatCurrency } from "../utils/formatCurrency";
import { InvoiceDetailPage } from "./InvoiceDetailPage";

const tabs = [["all","All"],["pending","Pending Payment"],["overdue","Past Due Date"],["pending_delivery","Pending Delivery"],["issue_raised","Raised Issues"]];

export function InvoicesPage() {
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const { data = [], loading, error, reload } = useInvoices(filter);
  return (
    <div className="desktop-grid grid grid-cols-[340px_1fr] gap-4">
      <Card className="flex h-[calc(100vh-112px)] flex-col overflow-hidden">
        <div className="border-b p-3"><div className="flex flex-wrap gap-2">{tabs.map(([key, label]) => <button key={key} onClick={() => setFilter(key)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${filter === key ? "bg-primary text-white" : "bg-slate-100 text-slate-600"}`}>{label}</button>)}</div></div>
        <div className="flex-1 overflow-y-auto p-3">
          {loading && <p className="text-sm text-slate-500">Loading invoices...</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
          {!loading && data?.length === 0 && <div className="empty-illustration rounded-lg p-6 text-center text-sm text-slate-500">No invoices yet. Create the first GST invoice.</div>}
          {data?.map((invoice) => <button key={invoice.id} onClick={() => setSelected(invoice.id)} className={`mb-2 w-full rounded-lg border p-3 text-left ${selected === invoice.id ? "border-primary bg-blue-50" : "bg-white hover:bg-slate-50"}`}>
            <div className="flex justify-between gap-2"><b>{invoice.invoice_number}</b><span>{formatCurrency(invoice.final_total)}</span></div>
            <p className="text-sm text-slate-500">{invoice.customers?.name || "Customer"}</p>
            <div className="mt-2 flex flex-wrap gap-2"><StatusBadge status={invoice.status} /><PaymentDueBadge closureDate={invoice.closure_date} /></div>
          </button>)}
        </div>
        <div className="border-t p-3"><Button className="w-full" onClick={() => setSelected(null)}>Add Invoice +</Button></div>
      </Card>
      <InvoiceDetailPage selectedId={selected} onSaved={reload} />
    </div>
  );
}
