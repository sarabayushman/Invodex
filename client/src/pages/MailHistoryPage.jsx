import { useState } from "react";

import { mailApi } from "../api/mail.api";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { Modal } from "../components/ui/Modal";
import { StatusBadge } from "../components/shared/StatusBadge";
import { useAsync } from "../hooks/useAsync";
import { formatDate } from "../utils/dateHelpers";

export function MailHistoryPage() {
  const [type, setType] = useState("");
  const [selected, setSelected] = useState(null);
  const { data = [], loading, error } = useAsync(() => mailApi.logs(type), [type]);
  return <Card>
    <CardHeader className="flex items-center justify-between"><h2 className="font-bold">Mail & Contact History</h2><select className="rounded-lg border px-3 py-2" value={type} onChange={(e) => setType(e.target.value)}><option value="">All types</option><option value="invoice">Invoice</option><option value="reminder">Reminder</option><option value="custom">Custom</option></select></CardHeader>
    <CardContent className="table-wrap">{loading && <p>Loading mail logs...</p>}{error && <p className="text-red-600">{error}</p>}<table className="data-table"><thead><tr>{["Date","Recipient","Type","Subject","Invoice #","Status"].map((h) => <th key={h}>{h}</th>)}</tr></thead><tbody>{data.map((m) => <tr key={m.id} onClick={() => setSelected(m)} className="cursor-pointer hover:bg-slate-50"><td>{formatDate(m.sent_at)}</td><td>{m.recipient_email}</td><td className="capitalize">{m.type}</td><td>{m.subject}</td><td>{m.invoices?.invoice_number}</td><td><StatusBadge status={m.status} /></td></tr>)}</tbody></table></CardContent>
    <Modal open={!!selected} title={selected?.subject} onClose={() => setSelected(null)}><pre className="whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm">{selected?.body}</pre></Modal>
  </Card>;
}
