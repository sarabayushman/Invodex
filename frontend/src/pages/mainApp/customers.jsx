import { useEffect, useState } from "react";
import { Edit3, Plus, Save, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { deleteCustomerRecord, mapCustomerFromDb, upsertCustomer } from "../../services/invodexData";
import { emptyCustomer, loadWorkspace } from "./workspace";

function Customers() {
  const navigate = useNavigate();
  const [orgId, setOrgId] = useState("");
  const [customers, setCustomers] = useState([]);
  const [draft, setDraft] = useState(emptyCustomer);
  const [editingId, setEditingId] = useState("");
  const [mobileDialog, setMobileDialog] = useState("");
  const [isMobile, setIsMobile] = useState(() => (typeof window === "undefined" ? false : window.innerWidth <= 760));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    loadWorkspace(navigate).then((workspace) => {
      if (!mounted || workspace.redirected) return;
      if (workspace.error) setError(workspace.error);
      else {
        setOrgId(workspace.orgId);
        setCustomers(workspace.customers);
      }
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [navigate]);

  useEffect(() => {
    function syncMobile() {
      setIsMobile(window.innerWidth <= 760);
    }

    syncMobile();
    window.addEventListener("resize", syncMobile);
    return () => window.removeEventListener("resize", syncMobile);
  }, []);

  async function saveCustomer(closeAfterSave = false) {
    const result = await upsertCustomer(orgId, draft);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    const savedCustomer = mapCustomerFromDb(result.data);
    setCustomers((current) => [...current.filter((item) => item.id !== savedCustomer.id), savedCustomer].sort((a, b) => a.name.localeCompare(b.name)));
    setDraft(emptyCustomer);
    setEditingId("");
    if (closeAfterSave) setMobileDialog("");
  }

  function startAddCustomer() {
    setDraft(emptyCustomer);
    setEditingId("");
    if (isMobile) setMobileDialog("customer");
  }

  function startEditCustomer(customer) {
    setDraft(customer);
    setEditingId(customer.id || "");
    if (isMobile) setMobileDialog("customer");
  }

  async function deleteCustomer(customer) {
    if (!customer?.id) return;
    if (!window.confirm(`Delete ${customer.name || "this customer"}? This action cannot be undone.`)) return;
    const result = await deleteCustomerRecord(customer.id);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    setCustomers((current) => current.filter((item) => item.id !== customer.id));
    if (editingId === customer.id) {
      setDraft(emptyCustomer);
      setEditingId("");
    }
  }

  if (loading) return <div className="empty-list">Loading customers...</div>;

  return (
    <section className="management-page">
      {error ? <div className="empty-list">Supabase error: {error}</div> : null}
      <div className="management-grid">
        <section className="product-card customer-editor-card">
          <div className="section-heading"><div><p>Customer</p><h3>{editingId ? "edit customer" : "Add new customer"}</h3></div></div>
          <CustomerForm draft={draft} setDraft={setDraft} />
          <Button type="button" onClick={() => saveCustomer()}>{editingId ? <Save size={17} /> : <Plus size={17} />}{editingId ? "save changes" : "add new customer"}</Button>
        </section>
        <section className="product-card">
          <div className="section-heading">
            <div><p>Customer</p><h3>Saved customers</h3></div>
            <Button className="secondary-action mobile-customer-add" type="button" onClick={startAddCustomer}><Plus size={17} />add new customer</Button>
          </div>
          <div className="compact-list">
            {customers.map((customer) => (
              <article className="compact-row customer-row" key={customer.id || customer.email}>
                <div>
                  <strong>{customer.name}</strong>
                  <span>{customer.contact || "No contact"}</span>
                  <small>{customer.address || "No address"} - {customer.gstin || "No GSTIN"} - {customer.email || "No email"} - {customer.phone || "No phone"}</small>
                </div>
                <div className="row-actions">
                  <button type="button" onClick={() => startEditCustomer(customer)} aria-label="Edit customer"><Edit3 size={15} /></button>
                  <button type="button" onClick={() => deleteCustomer(customer)} aria-label="Delete customer"><Trash2 size={15} /></button>
                </div>
              </article>
            ))}
            {!customers.length ? <p className="muted-copy">No saved customers yet.</p> : null}
          </div>
        </section>
      </div>
      {mobileDialog === "customer" ? <CustomerDialog title={editingId ? "edit customer" : "Add new customer"} draft={draft} setDraft={setDraft} onClose={() => setMobileDialog("")} onSave={() => saveCustomer(true)} editing={Boolean(editingId)} /> : null}
    </section>
  );
}

function CustomerForm({ draft, setDraft }) {
  const fields = [["name", "Company name"], ["contact", "Contact person"], ["address", "Address"], ["gstin", "GSTIN"], ["email", "Email"], ["phone", "Phone"]];
  return <div className="form-grid">{fields.map(([key, label]) => <label className="mini-field" key={key}><span>{label}</span><input value={draft[key] ?? ""} onChange={(event) => setDraft((current) => ({ ...current, [key]: event.target.value }))} /></label>)}</div>;
}

function CustomerDialog({ draft, editing, onClose, onSave, setDraft, title }) {
  return (
    <div className="dialog-backdrop" role="dialog" aria-modal="true" aria-label={title}>
      <div className="dialog-card wide">
        <div className="dialog-header"><h3>{title}</h3><button onClick={onClose} type="button">Close</button></div>
        <CustomerForm draft={draft} setDraft={setDraft} />
        <Button type="button" onClick={onSave}>{editing ? <Save size={17} /> : <Plus size={17} />}{editing ? "save changes" : "add new customer"}</Button>
      </div>
    </div>
  );
}

export default Customers;
