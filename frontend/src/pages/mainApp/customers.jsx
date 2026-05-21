import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { mapCustomerFromDb, upsertCustomer } from "../../services/invodexData";
import { emptyCustomer, loadWorkspace } from "./workspace";

function Customers() {
  const navigate = useNavigate();
  const [orgId, setOrgId] = useState("");
  const [customers, setCustomers] = useState([]);
  const [draft, setDraft] = useState(emptyCustomer);
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

  async function saveCustomer() {
    const result = await upsertCustomer(orgId, draft);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    const savedCustomer = mapCustomerFromDb(result.data);
    setCustomers((current) => [...current.filter((item) => item.id !== savedCustomer.id), savedCustomer].sort((a, b) => a.name.localeCompare(b.name)));
    setDraft(emptyCustomer);
  }

  if (loading) return <div className="empty-list">Loading customers...</div>;

  return (
    <section className="management-page">
      {error ? <div className="empty-list">Supabase error: {error}</div> : null}
      <div className="management-grid">
        <section className="product-card">
          <div className="section-heading"><div><p>Customer</p><h3>Add new customer</h3></div></div>
          <CustomerForm draft={draft} setDraft={setDraft} />
          <Button type="button" onClick={saveCustomer}><Save size={17} />Save new customer</Button>
        </section>
        <section className="product-card">
          <div className="section-heading"><div><p>Customer</p><h3>Saved customers</h3></div></div>
          <div className="compact-list">
            {customers.map((customer) => <article className="compact-row" key={customer.id || customer.email}><strong>{customer.name}</strong><span>{customer.contact || "No contact"}</span><small>{customer.address || "No address"} · {customer.gstin || "No GSTIN"} · {customer.email || "No email"} · {customer.phone || "No phone"}</small></article>)}
            {!customers.length ? <p className="muted-copy">No saved customers yet.</p> : null}
          </div>
        </section>
      </div>
    </section>
  );
}

function CustomerForm({ draft, setDraft }) {
  const fields = [["name", "Company name"], ["contact", "Contact person"], ["address", "Address"], ["gstin", "GSTIN"], ["email", "Email"], ["phone", "Phone"]];
  return <div className="form-grid">{fields.map(([key, label]) => <label className="mini-field" key={key}><span>{label}</span><input value={draft[key] ?? ""} onChange={(event) => setDraft((current) => ({ ...current, [key]: event.target.value }))} /></label>)}</div>;
}

export default Customers;
