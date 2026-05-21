import { useEffect, useMemo, useState } from "react";
import { Plus, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { mapProductFromDb, upsertProduct } from "../../services/invodexData";
import { emptyProduct, formatMoney, loadWorkspace, todayIso } from "./workspace";

const inventoryStages = [
  "Storage",
  "Ready for shipping",
  "About to deliver",
];

function Inventory() {
  const navigate = useNavigate();
  const [orgId, setOrgId] = useState("");
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState(() => JSON.parse(localStorage.getItem("invodex-inventory") || "[]"));
  const [logs, setLogs] = useState(() => JSON.parse(localStorage.getItem("invodex-inventory-logs") || "[]"));
  const [draft, setDraft] = useState(emptyProduct);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [stage, setStage] = useState("Storage");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    loadWorkspace(navigate).then((workspace) => {
      if (!mounted || workspace.redirected) return;
      if (workspace.error) setError(workspace.error);
      else {
        setOrgId(workspace.orgId);
        setProducts(workspace.products);
        setSelectedProductId(workspace.products[0]?.id || "");
      }
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [navigate]);

  useEffect(() => localStorage.setItem("invodex-inventory", JSON.stringify(inventory)), [inventory]);
  useEffect(() => localStorage.setItem("invodex-inventory-logs", JSON.stringify(logs)), [logs]);

  const groupedInventory = useMemo(() => Object.fromEntries(inventoryStages.map((item) => [item, inventory.filter((row) => row.stage === item)])), [inventory]);

  async function saveNewProduct() {
    const result = await upsertProduct(orgId, draft);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    const savedProduct = mapProductFromDb(result.data);
    setProducts((current) => [...current.filter((item) => item.id !== savedProduct.id), savedProduct].sort((a, b) => a.name.localeCompare(b.name)));
    setDraft(emptyProduct);
  }

  function addToInventory() {
    const product = products.find((item) => item.id === selectedProductId);
    if (!product) return;
    const row = { ...product, inventoryId: `${product.id}-${Date.now()}`, stage, loggedAt: new Date().toISOString() };
    setInventory((current) => [row, ...current]);
    setLogs((current) => [{ id: row.inventoryId, product: product.name, stage, invoice: "", timestamp: new Date().toISOString(), note: "Added from saved products" }, ...current]);
  }

  function moveInventory(row, nextStage) {
    setInventory((current) => current.map((item) => (item.inventoryId === row.inventoryId ? { ...item, stage: nextStage } : item)));
    setLogs((current) => [{ id: `${row.inventoryId}-${Date.now()}`, product: row.name, stage: nextStage, invoice: row.invoice || "", timestamp: new Date().toISOString(), note: "Stage updated" }, ...current]);
  }

  function markDelivered(row) {
    setInventory((current) => current.filter((item) => item.inventoryId !== row.inventoryId));
    setLogs((current) => [{ id: `${row.inventoryId}-delivered`, product: row.name, stage: "Delivered", invoice: row.invoice || "", timestamp: new Date().toISOString(), note: "Delivered and removed from active inventory" }, ...current]);
  }

  if (loading) return <div className="empty-list">Loading inventory...</div>;

  return (
    <section className="management-page">
      {error ? <div className="empty-list">Supabase error: {error}</div> : null}
      <div className="management-grid">
        <section className="product-card">
          <div className="section-heading"><div><p>Saved products</p><h3>Products list</h3></div></div>
          <ProductForm draft={draft} setDraft={setDraft} />
          <Button type="button" onClick={saveNewProduct}><Save size={17} />Save new product</Button>
          <div className="compact-list">
            {products.map((product) => <div className="compact-row" key={product.id || product.pid}><strong>{product.name}</strong><span>{product.pid || "No PID"} · {formatMoney(product.unit)}</span></div>)}
            {!products.length ? <p className="muted-copy">No saved products yet.</p> : null}
          </div>
        </section>

        <section className="product-card">
          <div className="section-heading"><div><p>Actual inventory</p><h3>Warehouse stock</h3></div></div>
          <div className="inventory-adder">
            <label className="select-field"><span>Saved product</span><select value={selectedProductId} onChange={(event) => setSelectedProductId(event.target.value)}>{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label>
            <label className="select-field"><span>Stage</span><select value={stage} onChange={(event) => setStage(event.target.value)}>{inventoryStages.map((item) => <option key={item}>{item}</option>)}</select></label>
            <Button type="button" onClick={addToInventory}><Plus size={17} />Add to inventory</Button>
          </div>
          <div className="inventory-columns">
            {inventoryStages.map((item) => (
              <section className="inventory-column" key={item}>
                <h4>{item}</h4>
                {groupedInventory[item].map((row) => <InventoryRow key={row.inventoryId} row={row} onDelivered={markDelivered} onMove={moveInventory} />)}
                {!groupedInventory[item].length ? <p className="muted-copy">Empty</p> : null}
              </section>
            ))}
          </div>
        </section>
      </div>

      <section className="product-card">
        <div className="section-heading"><div><p>Inventory log</p><h3>Product movement</h3></div></div>
        <div className="log-list">
          {logs.map((log) => <div className="log-row" key={log.id}><strong>{log.product}</strong><span>{log.stage}</span><span>{log.invoice || "No invoice"}</span><time>{new Date(log.timestamp).toLocaleString()}</time><small>{log.note}</small></div>)}
          {!logs.length ? <p className="muted-copy">No inventory log entries yet.</p> : null}
        </div>
      </section>
    </section>
  );
}

function ProductForm({ draft, setDraft }) {
  const fields = [["pid", "PID"], ["hsn", "HSN Code"], ["name", "Name"], ["desc", "Description"], ["cost", "Cost price", "number"], ["margin", "Profit margin"], ["shownDiscount", "Shown discount", "number"], ["unit", "Unit price", "number"], ["extraDiscount", "Extra discount", "number"], ["gst", "GST %", "number"]];
  return <div className="form-grid">{fields.map(([key, label, type]) => <label className="mini-field" key={key}><span>{label}</span><input type={type || "text"} value={draft[key] ?? ""} onChange={(event) => setDraft((current) => ({ ...current, [key]: type === "number" ? Number(event.target.value) : event.target.value }))} /></label>)}</div>;
}

function InventoryRow({ row, onDelivered, onMove }) {
  return (
    <div className="compact-row inventory-row">
      <strong>{row.name}</strong>
      <span>{row.pid || "No PID"} · {formatMoney(row.unit)}</span>
      <div className="row-actions-wide">
        {inventoryStages.filter((item) => item !== row.stage).map((item) => <button key={item} type="button" onClick={() => onMove(row, item)}>{item}</button>)}
        <button type="button" onClick={() => onDelivered(row)}>Delivered</button>
      </div>
    </div>
  );
}

export default Inventory;
