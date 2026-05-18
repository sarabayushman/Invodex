import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { customersApi } from "../api/customers.api";
import { mailApi } from "../api/mail.api";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { StatusBadge } from "../components/shared/StatusBadge";
import { formatDate } from "../utils/dateHelpers";
import { formatCurrency } from "../utils/formatCurrency";

export function CustomerDetailPage() {
  const { id } = useParams();
  const [invoices, setInvoices] = useState([]);
  const [outstanding, setOutstanding] = useState(null);
  const [mail, setMail] = useState([]);
  useEffect(() => { customersApi.invoices(id).then(setInvoices); customersApi.outstanding(id).then(setOutstanding); mailApi.logs().then((logs) => setMail(logs.filter((l) => l.customer_id === id))); }, [id]);
  const customer = invoices[0]?.customers;
  return <div className="space-y-4">
    <Card><CardHeader><h2 className="font-bold">{customer?.name || "Customer Detail"}</h2></CardHeader><CardContent className="grid grid-cols-3 gap-4 max-md:grid-cols-1">{[["Total invoiced", outstanding?.total_invoiced],["Total paid", outstanding?.total_paid],["Total outstanding", outstanding?.total_outstanding]].map(([k, v]) => <div key={k}><p className="text-sm text-slate-500">{k}</p><p className="text-2xl font-extrabold">{formatCurrency(v)}</p></div>)}</CardContent></Card>
    <Card><CardHeader><h3 className="font-bold">Invoice History</h3></CardHeader><CardContent className="table-wrap"><table className="data-table"><thead><tr><th>Invoice</th><th>Date</th><th>Total</th><th>Status</th></tr></thead><tbody>{invoices.map((i) => <tr key={i.id}><td>{i.invoice_number}</td><td>{formatDate(i.billing_date)}</td><td>{formatCurrency(i.final_total)}</td><td><StatusBadge status={i.status} /></td></tr>)}</tbody></table></CardContent></Card>
    <Card><CardHeader><h3 className="font-bold">Contact History</h3></CardHeader><CardContent className="table-wrap"><table className="data-table"><thead><tr><th>Date</th><th>Subject</th><th>Status</th></tr></thead><tbody>{mail.map((m) => <tr key={m.id}><td>{formatDate(m.sent_at)}</td><td>{m.subject}</td><td><StatusBadge status={m.status} /></td></tr>)}</tbody></table></CardContent></Card>
  </div>;
}
