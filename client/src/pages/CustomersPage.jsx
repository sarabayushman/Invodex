import { useState } from "react";
import { Edit, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

import { customersApi } from "../api/customers.api";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { Modal } from "../components/ui/Modal";
import { useToast } from "../components/ui/Toast";
import { useCustomers } from "../hooks/useCustomers";
import { formatCurrency } from "../utils/formatCurrency";

const blank = { name: "", address: "", city: "", state: "", pincode: "", gstin: "", email: "", phone: "" };

export function CustomersPage() {
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const { data = [], loading, error, reload } = useCustomers(search);
  const toast = useToast();
  async function save(e) {
    e.preventDefault();
    const payload = Object.fromEntries(new FormData(e.currentTarget));
    editing?.id ? await customersApi.update(editing.id, payload) : await customersApi.create(payload);
    toast("Customer saved");
    setEditing(null);
    reload();
  }
  async function remove(id) {
    if (!window.confirm("Delete this customer?")) return;
    await customersApi.remove(id);
    toast("Customer deleted");
    reload();
  }
  return (
    <Card>
      <CardHeader className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-bold">Customers</h2><div className="flex gap-2"><input className="rounded-lg border px-3 py-2" placeholder="Search customers" value={search} onChange={(e) => setSearch(e.target.value)} /><Button onClick={() => setEditing(blank)}><Plus size={16} /> Add Customer</Button></div></CardHeader>
      <CardContent className="table-wrap">
        {loading && <p>Loading customers...</p>}{error && <p className="text-red-600">{error}</p>}
        <table className="data-table"><thead><tr>{["Name","GSTIN","City","Email","Phone","Total Invoices","Outstanding","Loyalty","Actions"].map((h) => <th key={h}>{h}</th>)}</tr></thead>
        <tbody>{data.map((c) => <tr key={c.id}><td><Link className="font-bold text-primary" to={`/customers/${c.id}`}>{c.name}</Link></td><td>{c.gstin}</td><td>{c.city}</td><td>{c.email}</td><td>{c.phone}</td><td>{c.total_invoices}</td><td>{formatCurrency(c.outstanding_balance)}</td><td>{c.loyalty_score}</td><td><div className="flex gap-1"><Button variant="ghost" onClick={() => setEditing(c)}><Edit size={15} /></Button><Button variant="ghost" onClick={() => remove(c.id)}><Trash2 size={15} /></Button></div></td></tr>)}</tbody></table>
      </CardContent>
      <Modal open={!!editing} title={editing?.id ? "Edit customer" : "Add customer"} onClose={() => setEditing(null)}>
        <form onSubmit={save} className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">{Object.keys(blank).map((key) => <div className={key === "address" ? "field col-span-2 max-sm:col-span-1" : "field"} key={key}><label className="capitalize">{key}</label><input name={key} defaultValue={editing?.[key] || ""} required={key === "name"} /></div>)}<Button>Save customer</Button></form>
      </Modal>
    </Card>
  );
}
