import { useEffect, useMemo, useState } from "react";
import { Download, Mail, Plus, Save, Trash2 } from "lucide-react";

import { customersApi } from "../api/customers.api";
import { inventoryApi } from "../api/inventory.api";
import { invoicesApi } from "../api/invoices.api";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { Modal } from "../components/ui/Modal";
import { useToast } from "../components/ui/Toast";
import { PaymentDueBadge } from "../components/shared/PaymentDueBadge";
import { StatusBadge } from "../components/shared/StatusBadge";
import { calculateInvoice } from "../utils/gstCalculator";
import { addDays, formatDate } from "../utils/dateHelpers";
import { formatCurrency } from "../utils/formatCurrency";

const blankItem = { pid: "", hsn_code: "", name: "", description: "", upgrades: "", cost_price: 0, profit_margin: 0, discount_percent: 0, quantity: 1, gst_percent: 18 };

export function InvoiceDetailPage({ selectedId, onSaved }) {
  const [invoice, setInvoice] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [emailOpen, setEmailOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [form, setForm] = useState({ customer_id: "", billing_date: new Date().toISOString().slice(0, 10), credit_days: 15, payment_type: "spot", payment_done: false, freight_charges: 0, other_charges: 0, payment_notes: "", is_delivered: false, items: [{ ...blankItem }] });
  const toast = useToast();
  const totals = useMemo(() => calculateInvoice(form.items, form.freight_charges, form.other_charges), [form]);
  const closure = addDays(form.billing_date, form.credit_days);
  const paid = Number(invoice?.previously_paid || 0);

  useEffect(() => {
    customersApi.list().then(setCustomers).catch(() => {});
    inventoryApi.list().then(setProducts).catch(() => {});
  }, []);
  useEffect(() => {
    if (!selectedId) return;
    invoicesApi.get(selectedId).then((data) => {
      setInvoice(data);
      setForm({
        customer_id: data.customer_id,
        billing_date: data.billing_date,
        credit_days: data.credit_days,
        payment_type: data.payment_type,
        payment_done: data.payment_done,
        freight_charges: data.freight_charges,
        other_charges: data.other_charges,
        payment_notes: data.payment_notes || "",
        is_delivered: data.is_delivered,
        items: data.items?.length ? data.items : [{ ...blankItem }],
      });
    }).catch(() => toast("Could not load invoice", "error"));
  }, [selectedId]);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const updateItem = (index, key, value) => setForm((prev) => ({ ...prev, items: prev.items.map((item, i) => i === index ? { ...item, [key]: value } : item) }));
  const useProduct = (index, productId) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    setForm((prev) => ({ ...prev, items: prev.items.map((item, i) => i === index ? { ...item, product_id: product.id, pid: product.pid, hsn_code: product.hsn_code, name: product.name, description: product.description, upgrades: product.upgrades, cost_price: product.cost_price, profit_margin: product.profit_margin, gst_percent: product.gst_percent } : item) }));
  };
  async function save() {
    try {
      const payload = { ...form, items: form.items.map(({ marked_price, unit_price, total_price, tax_amount, ...item }) => item) };
      selectedId ? await invoicesApi.update(selectedId, payload) : await invoicesApi.create(payload);
      toast("Invoice saved");
      onSaved?.();
    } catch (err) {
      toast(err.response?.data?.detail || "Invoice save failed", "error");
    }
  }
  async function logPayment(e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    await invoicesApi.logPayment(selectedId, data);
    toast("Payment logged");
    setPaymentOpen(false);
    onSaved?.();
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex gap-4">
            <div className="grid h-20 w-20 place-items-center rounded-lg border text-3xl font-black text-slate-500">DB</div>
            <div>
              <h2 className="text-2xl font-extrabold">{invoice?.company_profile?.name || "Company Profile"}</h2>
              <p className="text-sm text-slate-500">{invoice?.company_profile?.address || "Complete Settings to show billing address"}</p>
              <p className="text-sm text-slate-600">{invoice?.customers?.name || "Select customer"} {invoice?.customers?.gstin ? `- GSTIN ${invoice.customers.gstin}` : ""}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500">Invoice</p>
            <p className="text-xl font-extrabold">{invoice?.invoice_number || "Auto generated"}</p>
            {invoice && <StatusBadge status={invoice.status} />}
          </div>
        </CardContent>
      </Card>

      <div className="desktop-grid grid grid-cols-[1fr_360px] gap-4">
        <Card>
          <CardHeader className="flex items-center justify-between"><h3 className="font-bold">Products</h3><Button variant="secondary" onClick={() => update("items", [...form.items, { ...blankItem }])}><Plus size={16} /> Add Product</Button></CardHeader>
          <CardContent className="table-wrap">
            <div className="field mb-4 max-w-sm"><label>Customer</label><select value={form.customer_id} onChange={(e) => update("customer_id", e.target.value)}><option value="">Select customer</option>{customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <table className="data-table">
              <thead><tr>{["PID","HSN","Name & Description","Upgrades","Cost","Profit","Disc %","Qty","Marked","GST %","Unit","Total",""].map((h) => <th key={h}>{h}</th>)}</tr></thead>
              <tbody>{totals.items.map((item, index) => (
                <tr key={index}>
                  <td><input className="w-28 rounded border p-2" value={item.pid} onChange={(e) => updateItem(index, "pid", e.target.value)} /></td>
                  <td><input className="w-24 rounded border p-2" value={item.hsn_code} onChange={(e) => updateItem(index, "hsn_code", e.target.value)} /></td>
                  <td><select className="mb-2 w-48 rounded border p-2" onChange={(e) => useProduct(index, e.target.value)}><option>Pick inventory</option>{products.map((p) => <option key={p.id} value={p.id}>{p.pid} - {p.name}</option>)}</select><input className="w-48 rounded border p-2" value={item.name} onChange={(e) => updateItem(index, "name", e.target.value)} /><textarea className="mt-2 w-48 rounded border p-2" value={item.description || ""} onChange={(e) => updateItem(index, "description", e.target.value)} /></td>
                  <td><input className="w-32 rounded border p-2" value={item.upgrades || ""} onChange={(e) => updateItem(index, "upgrades", e.target.value)} /></td>
                  {["cost_price","profit_margin","discount_percent","quantity","gst_percent"].map((key) => <td key={key}><input className="w-24 rounded border p-2" type="number" value={item[key]} onChange={(e) => updateItem(index, key, e.target.value)} /></td>)}
                  <td>{formatCurrency(item.marked_price)}</td><td>{formatCurrency(item.unit_price)}</td><td className="font-bold">{formatCurrency(item.total_price)}</td>
                  <td><Button variant="ghost" onClick={() => update("items", form.items.filter((_, i) => i !== index))}><Trash2 size={16} /></Button></td>
                </tr>
              ))}</tbody>
            </table>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card><CardHeader><h3 className="font-bold">Payment Details</h3></CardHeader><CardContent className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={form.payment_done} onChange={(e) => update("payment_done", e.target.checked)} /> Payment Done</label>
            <div className="grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1">{["spot","emi","pay_later"].map((type) => <button key={type} onClick={() => update("payment_type", type)} className={`rounded-md px-2 py-2 text-xs font-bold capitalize ${form.payment_type === type ? "bg-white shadow" : ""}`}>{type.replace("_", " ")}</button>)}</div>
            <div className="field"><label>Billing date</label><input type="date" value={form.billing_date} onChange={(e) => update("billing_date", e.target.value)} /></div>
            <div className="field"><label>Credit days</label><input type="number" value={form.credit_days} onChange={(e) => update("credit_days", e.target.value)} /></div>
            <div className="flex items-center justify-between text-sm"><span>Closure date</span><b>{formatDate(closure)}</b></div><PaymentDueBadge closureDate={closure} />
            <Button variant="secondary" disabled={!selectedId} onClick={() => setPaymentOpen(true)}>Log Payment</Button>
            <div className="field"><label>Payment notes</label><textarea value={form.payment_notes} onChange={(e) => update("payment_notes", e.target.value)} /></div>
          </CardContent></Card>
          <Card><CardHeader><h3 className="font-bold">Money Summary</h3></CardHeader><CardContent className="space-y-2 text-sm">
            {[["Subtotal", totals.subtotal],["Total Tax", totals.tax_total]].map(([k, v]) => <div className="flex justify-between" key={k}><span>{k}</span><b>{formatCurrency(v)}</b></div>)}
            <div className="field"><label>Freight charges</label><input type="number" value={form.freight_charges} onChange={(e) => update("freight_charges", e.target.value)} /></div>
            <div className="field"><label>Other charges</label><input type="number" value={form.other_charges} onChange={(e) => update("other_charges", e.target.value)} /></div>
            <div className="flex justify-between"><span>Round off</span><b>{formatCurrency(totals.round_off)}</b></div>
            <div className="flex justify-between border-t pt-3 text-lg"><span>Final Total</span><b>{formatCurrency(totals.final_total)}</b></div>
            <div className="flex justify-between"><span>Previously Paid</span><b>{formatCurrency(paid)}</b></div>
            <div className="flex justify-between"><span>Balance Due</span><b>{formatCurrency(totals.final_total - paid)}</b></div>
          </CardContent></Card>
          <div className="grid grid-cols-3 gap-2"><Button onClick={save}><Save size={16} /> Save</Button><Button variant="secondary" onClick={() => toast("Feature coming soon")}><Download size={16} /></Button><Button variant="secondary" disabled={!selectedId} onClick={() => setEmailOpen(true)}><Mail size={16} /></Button></div>
        </div>
      </div>

      <Modal open={emailOpen} title="Send invoice" onClose={() => setEmailOpen(false)}>
        <form className="space-y-3" onSubmit={async (e) => { e.preventDefault(); await invoicesApi.sendEmail(selectedId, Object.fromEntries(new FormData(e.currentTarget))); toast("Email attempt logged"); setEmailOpen(false); }}>
          <div className="field"><label>Recipient</label><input name="recipient_email" defaultValue={invoice?.customers?.email || ""} /></div>
          <div className="field"><label>Subject</label><input name="subject" defaultValue={`Invoice ${invoice?.invoice_number || ""}`} /></div>
          <div className="field"><label>Body</label><textarea name="body" defaultValue={`Dear ${invoice?.customers?.name || "Customer"},\n\nPlease find your invoice details in Invodex.\n\nRegards`} /></div>
          <Button>Send</Button>
        </form>
      </Modal>
      <Modal open={paymentOpen} title="Log payment" onClose={() => setPaymentOpen(false)}>
        <form className="grid gap-3" onSubmit={logPayment}>
          <div className="field"><label>Amount</label><input name="amount_paid" type="number" required /></div>
          <div className="field"><label>Date</label><input name="payment_date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required /></div>
          <div className="field"><label>Mode</label><input name="payment_mode" defaultValue="UPI" /></div>
          <div className="field"><label>Note</label><textarea name="note" /></div>
          <Button>Save payment</Button>
        </form>
      </Modal>
    </div>
  );
}
