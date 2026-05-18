import { useMemo, useState } from "react";
import { Edit, Plus, Trash2 } from "lucide-react";

import { inventoryApi } from "../api/inventory.api";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { Modal } from "../components/ui/Modal";
import { useToast } from "../components/ui/Toast";
import { useInventory } from "../hooks/useInventory";
import { formatCurrency } from "../utils/formatCurrency";

const blank = { pid: "", hsn_code: "", name: "", description: "", upgrades: "", cost_price: 0, profit_margin: 0, gst_percent: 18, stock_total: 0, stock_unbooked: 0, stock_not_shipped: 0 };

export function InventoryPage() {
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const { data = [], loading, error, reload } = useInventory(search);
  const toast = useToast();
  const summary = useMemo(() => ({
    products: data.length,
    cost: data.reduce((s, p) => s + Number(p.cost_price) * Number(p.stock_total), 0),
    marked: data.reduce((s, p) => s + Number(p.marked_price || Number(p.cost_price) + Number(p.profit_margin)) * Number(p.stock_total), 0),
    low: data.filter((p) => Number(p.stock_unbooked) < 5).length,
  }), [data]);
  async function save(e) {
    e.preventDefault();
    const payload = Object.fromEntries(new FormData(e.currentTarget));
    ["cost_price","profit_margin","gst_percent","stock_total","stock_unbooked","stock_not_shipped"].forEach((k) => payload[k] = Number(payload[k] || 0));
    editing?.id ? await inventoryApi.update(editing.id, payload) : await inventoryApi.create(payload);
    toast("Product saved");
    setEditing(null);
    reload();
  }
  async function remove(id) {
    if (!window.confirm("Delete this product?")) return;
    await inventoryApi.remove(id);
    toast("Product deleted");
    reload();
  }
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4 max-lg:grid-cols-2 max-sm:grid-cols-1">
        {[["Total Products", summary.products],["Stock Value Cost", formatCurrency(summary.cost)],["Stock Value Marked", formatCurrency(summary.marked)],["Low Stock Alerts", summary.low]].map(([k, v]) => <Card key={k}><CardContent><p className="text-sm text-slate-500">{k}</p><p className="mt-2 text-2xl font-extrabold">{v}</p></CardContent></Card>)}
      </div>
      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-bold">Product Master List</h2><div className="flex gap-2"><input className="rounded-lg border px-3 py-2" placeholder="Search products" value={search} onChange={(e) => setSearch(e.target.value)} /><Button onClick={() => setEditing(blank)}><Plus size={16} /> Add Product</Button></div></CardHeader>
        <CardContent className="table-wrap">
          {loading && <p>Loading products...</p>}{error && <p className="text-red-600">{error}</p>}
          <table className="data-table"><thead><tr>{["PID","HSN","Name","Description","Cost","Profit","Marked","GST %","Stock","Unbooked","Not Shipped","Actions"].map((h) => <th key={h}>{h}</th>)}</tr></thead>
          <tbody>{data.map((p) => <tr key={p.id}><td>{p.pid}</td><td>{p.hsn_code}</td><td className="font-bold">{p.name}</td><td>{p.description}</td><td>{formatCurrency(p.cost_price)}</td><td>{formatCurrency(p.profit_margin)}</td><td>{formatCurrency(p.marked_price)}</td><td>{p.gst_percent}</td><td>{p.stock_total}</td><td>{p.stock_unbooked}</td><td>{p.stock_not_shipped}</td><td><div className="flex gap-1"><Button variant="ghost" onClick={() => setEditing(p)}><Edit size={15} /></Button><Button variant="ghost" onClick={() => remove(p.id)}><Trash2 size={15} /></Button></div></td></tr>)}</tbody></table>
        </CardContent>
      </Card>
      <Modal open={!!editing} title={editing?.id ? "Edit product" : "Add product"} onClose={() => setEditing(null)}>
        <form onSubmit={save} className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">{Object.keys(blank).map((key) => <div className={key === "description" || key === "upgrades" ? "field col-span-2 max-sm:col-span-1" : "field"} key={key}><label className="capitalize">{key.replaceAll("_", " ")}</label><input name={key} defaultValue={editing?.[key] ?? blank[key]} type={["cost_price","profit_margin","gst_percent","stock_total","stock_unbooked","stock_not_shipped"].includes(key) ? "number" : "text"} required={["pid","hsn_code","name"].includes(key)} /></div>)}<div className="col-span-2 max-sm:col-span-1"><Button>Save product</Button></div></form>
      </Modal>
    </div>
  );
}
