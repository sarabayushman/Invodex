import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Check, Edit3, Plus, Save, Search, Send, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import {
  createAutosaveQueue,
  deleteInvoiceRecord,
  mapCustomerFromDb,
  mapProductFromDb,
  saveInvoiceWithItems,
  upsertCustomer,
  upsertProduct,
} from "../../services/invodexData";
import { emptyCustomer, emptyProduct, formatMoney, loadWorkspace, todayIso } from "./workspace";

const filters = ["All", "Pending Payment", "Past Due Date", "Pending Delivery", "Raised Issues"];
const dateRanges = ["Today", "This Week", "This Month", "This Year", "Custom"];
const sortOptions = [
  { label: "Old -> new", value: "old-new" },
  { label: "New -> old", value: "new-old" },
  { label: "Bill price low -> high", value: "bill-low-high" },
  { label: "Bill price high -> low", value: "bill-high-low" },
  { label: "Due amount low -> high", value: "due-low-high" },
  { label: "Due amount high -> low", value: "due-high-low" },
];

function Invoices() {
  const navigate = useNavigate();
  const [orgId, setOrgId] = useState("");
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState("This Month");
  const [customRange, setCustomRange] = useState({ start: "", end: "" });
  const [sortBy, setSortBy] = useState("old-new");
  const [openMenu, setOpenMenu] = useState("");
  const [dialog, setDialog] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    let mounted = true;
    loadWorkspace(navigate).then((workspace) => {
      if (!mounted || workspace.redirected) return;
      if (workspace.error) setError(workspace.error);
      else {
        setOrgId(workspace.orgId);
        setInvoices(workspace.invoices);
        setCustomers(workspace.customers);
        setProducts(workspace.products);
        setSelectedId(workspace.invoices[0]?.id || "");
      }
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [navigate]);

  const selectedInvoice = invoices.find((invoice) => invoice.id === selectedId) || null;
  const filteredInvoices = useMemo(() => {
    return invoices
      .filter((invoice) => filter === "All" || invoice.status === filter)
      .filter((invoice) => invoiceMatchesSearch(invoice, search))
      .filter((invoice) => isInDateRange(invoice.billingDate, dateRange, customRange))
      .sort((first, second) => compareInvoices(first, second, sortBy));
  }, [customRange, dateRange, filter, invoices, search, sortBy]);
  const rows = useMemo(() => (selectedInvoice?.products || []).map(getPricedRow), [selectedInvoice]);
  const totals = useMemo(() => getInvoiceTotals(rows, selectedInvoice?.payment?.logs || []), [rows, selectedInvoice]);
  const autosaveQueue = useMemo(() => createAutosaveQueue((invoice) => persistInvoice(invoice)), [orgId]);

  function showToast(message) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  }

  async function persistInvoice(invoice) {
    if (!orgId || !invoice) return;
    const pricedRows = invoice.products.map(getPricedRow);
    const invoiceTotals = getInvoiceTotals(pricedRows, invoice.payment.logs);
    const { data, error: saveError } = await saveInvoiceWithItems(orgId, invoice, invoiceTotals);
    if (saveError) showToast(`Save failed: ${saveError.message}`);
    else if (data?.id && !invoice.dbId) setInvoices((current) => current.map((item) => (item.id === invoice.id ? { ...item, dbId: data.id } : item)));
  }

  function finalizeInvoice(invoice) {
    const pricedRows = invoice.products.map(getPricedRow);
    const invoiceTotals = getInvoiceTotals(pricedRows, invoice.payment.logs);
    return { ...invoice, total: invoiceTotals.finalTotal, billingDate: invoice.payment.billingDate, days: getDaysUntilDue(invoice.payment) };
  }

  function updateSelectedInvoice(patch, options = {}) {
    if (!selectedInvoice) return;
    const nextInvoice = finalizeInvoice({ ...selectedInvoice, ...patch });
    setInvoices((current) => current.map((invoice) => (invoice.id === selectedInvoice.id ? nextInvoice : invoice)));
    if (options.immediate) autosaveQueue.flush();
    autosaveQueue.schedule(nextInvoice);
  }

  function updatePayment(patch) {
    updateSelectedInvoice({ payment: { ...selectedInvoice.payment, ...patch } });
  }

  async function addInvoice() {
    const id = `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(4, "0")}`;
    const invoice = finalizeInvoice({
      id,
      customer: "Unknown customer",
      total: 0,
      status: "Pending Payment",
      days: 0,
      billingDate: todayIso(),
      customerInfo: { ...emptyCustomer },
      products: [],
      note: "",
      delivered: false,
      payment: { type: "Spot", billingDate: todayIso(), creditDays: 0, emiMonths: 6, interestRate: 12, paid: false, logs: [] },
    });
    const result = await saveInvoiceWithItems(orgId, invoice, getInvoiceTotals([], []));
    if (result.error) showToast(`Invoice save failed: ${result.error.message}`);
    else {
      setInvoices((current) => [...current, { ...invoice, dbId: result.data.id }]);
      setSelectedId(id);
    }
  }

  async function deleteInvoice(id) {
    const invoice = invoices.find((item) => item.id === id);
    if (!window.confirm(`Delete ${invoice?.id || "this invoice"}? This action cannot be undone.`)) return;
    if (invoice?.dbId) {
      const result = await deleteInvoiceRecord(invoice.dbId);
      if (result.error) {
        showToast(`Delete failed: ${result.error.message}`);
        return;
      }
    }
    setInvoices((current) => current.filter((item) => item.id !== id));
    if (selectedId === id) setSelectedId(invoices.find((item) => item.id !== id)?.id || "");
  }

  function addProductToInvoice(product, index) {
    const nextProducts = [...selectedInvoice.products];
    if (Number.isInteger(index)) nextProducts[index] = product;
    else nextProducts.push(product);
    updateSelectedInvoice({ products: nextProducts });
    setDialog("");
    setEditingProduct(null);
  }

  async function saveAndAddProduct(product, index) {
    const productResult = await upsertProduct(orgId, product);
    if (productResult.error) {
      showToast(`Product save failed: ${productResult.error.message}`);
      return;
    }
    const savedProduct = { ...mapProductFromDb(productResult.data), qty: product.qty };
    setProducts((current) => [...current.filter((item) => item.id !== savedProduct.id), savedProduct].sort((a, b) => a.name.localeCompare(b.name)));
    addProductToInvoice(savedProduct, index);
  }

  function addCustomerToInvoice(customerInfo) {
    updateSelectedInvoice({ customerInfo, customer: customerInfo.name || "Unknown customer" });
    setDialog("");
  }

  async function saveAndAddCustomer(customerInfo) {
    const customerResult = await upsertCustomer(orgId, customerInfo);
    if (customerResult.error) {
      showToast(`Customer save failed: ${customerResult.error.message}`);
      return;
    }
    const savedCustomer = mapCustomerFromDb(customerResult.data);
    setCustomers((current) => [...current.filter((item) => item.id !== savedCustomer.id), savedCustomer].sort((a, b) => a.name.localeCompare(b.name)));
    addCustomerToInvoice(savedCustomer);
  }

  if (loading) return <div className="empty-list">Loading your workspace from Supabase...</div>;
  if (error) return <div className="empty-list">Supabase error: {error}</div>;

  return (
    <>
      <div className="invoice-layout">
        <aside className="invoice-list-panel">
          <InvoiceListControls
            customRange={customRange}
            dateRange={dateRange}
            filter={filter}
            openMenu={openMenu}
            search={search}
            setCustomRange={setCustomRange}
            setDateRange={setDateRange}
            setFilter={setFilter}
            setOpenMenu={setOpenMenu}
            setSearch={setSearch}
            setSortBy={setSortBy}
            sortBy={sortBy}
          />
          <div className="invoice-list">
            {filteredInvoices.map((invoice) => (
              <button className={`invoice-list-item ${selectedId === invoice.id ? "active" : ""}`} key={invoice.id} onClick={() => setSelectedId(invoice.id)} type="button">
                <span><strong>{invoice.id}</strong><small>{invoice.customer}</small></span>
                <span className="invoice-item-meta"><b>{formatMoney(invoice.total)}</b><StatusBadge status={invoice.status} />{shouldShowDaysLeft(invoice.payment, getInvoiceBalance(invoice)) ? <DaysBadge days={invoice.days} compact /> : null}</span>
                <span className="invoice-date">{invoice.billingDate}</span>
                <span className="invoice-delete" onClick={(event) => { event.stopPropagation(); deleteInvoice(invoice.id); }} role="button" tabIndex={0}><Trash2 size={15} /></span>
              </button>
            ))}
            {!filteredInvoices.length ? <div className="empty-list">No invoices yet.</div> : null}
          </div>
          <div className="invoice-list-footer"><Button className="add-invoice-button" onClick={addInvoice}><Plus size={18} />Add Invoice</Button></div>
        </aside>

        {selectedInvoice ? (
          <section className="invoice-detail">
            <CustomerHeader invoice={selectedInvoice} totals={totals} onEdit={() => setDialog("customer")} />
            <section className="detail-grid">
              <section className="detail-main">
                <ProductTable delivered={selectedInvoice.delivered} rows={rows} onAdd={() => { setEditingProduct({ product: { ...emptyProduct }, index: null }); setDialog("product"); }} onDelete={(index) => updateSelectedInvoice({ products: selectedInvoice.products.filter((_, rowIndex) => rowIndex !== index) })} onEdit={(product, index) => { setEditingProduct({ product: { ...product }, index }); setDialog("product"); }} onToggleDelivered={(delivered) => updateSelectedInvoice({ delivered })} />
                <GeneralNote value={selectedInvoice.note} onChange={(note) => updateSelectedInvoice({ note })} />
              </section>
              <aside className="detail-side">
                <PaymentCard payment={selectedInvoice.payment} totals={totals} updatePayment={updatePayment} />
                <MoneySummary totals={totals} />
                <section className="action-panel"><Button className="secondary-action" onClick={() => setDialog("send")} type="button"><Send size={17} />Send Invoice</Button></section>
              </aside>
            </section>
          </section>
        ) : <section className="invoice-detail"><div className="empty-list">Add your first invoice to save it in Supabase.</div></section>}
      </div>

      {toast ? <div className="toast">{toast}</div> : null}
      {dialog === "customer" && selectedInvoice ? <Dialog title="Customer information" onClose={() => setDialog("")}><CustomerDialog customers={customers} invoice={selectedInvoice} onAdd={addCustomerToInvoice} onSaveAndAdd={saveAndAddCustomer} /></Dialog> : null}
      {dialog === "product" && editingProduct ? <Dialog title="Product information" onClose={() => setDialog("")}><ProductDialog editingProduct={editingProduct} products={products} onAdd={addProductToInvoice} onSaveAndAdd={saveAndAddProduct} /></Dialog> : null}
      {dialog === "send" && selectedInvoice ? <Dialog title="Send Invoice" onClose={() => setDialog("")}><div className="dialog-content"><EditableField label="Recipient" value={selectedInvoice.customerInfo?.email || ""} onChange={() => {}} /><Button type="button"><Send size={17} />Send via Gmail SMTP</Button></div></Dialog> : null}
    </>
  );
}

function InvoiceListControls({ customRange, dateRange, filter, openMenu, search, setCustomRange, setDateRange, setFilter, setOpenMenu, setSearch, setSortBy, sortBy }) {
  const [menuPosition, setMenuPosition] = useState({ left: 0, top: 0, width: 300 });

  function toggleMenu(menu, event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const width = Math.min(menu === "date" ? 340 : 320, window.innerWidth - 24);
    const left = Math.min(Math.max(12, rect.left), window.innerWidth - width - 12);
    setMenuPosition({ left, top: rect.bottom + 8, width });
    setOpenMenu(openMenu === menu ? "" : menu);
  }

  function chooseDateRange(range) {
    setDateRange(range);
    setOpenMenu(range === "Custom" ? "date" : "");
  }

  return (
    <div className="list-tools invoice-list-tools">
      <div className="search-field"><Search size={16} /><input placeholder="Search invoices" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
      <div className="invoice-control-grid">
        <div className="menu-control">
          <button className="range-trigger" type="button" onClick={(event) => toggleMenu("filter", event)}>Filter: {filter}</button>
          {openMenu === "filter" ? <OptionMenu options={filters.map((item) => ({ label: item, value: item }))} style={menuPosition} value={filter} onPick={(value) => { setFilter(value); setOpenMenu(""); }} /> : null}
        </div>
        <div className="menu-control">
          <button className="range-trigger" type="button" onClick={(event) => toggleMenu("sort", event)}>Sort: {sortOptions.find((item) => item.value === sortBy)?.label}</button>
          {openMenu === "sort" ? <OptionMenu options={sortOptions} style={menuPosition} value={sortBy} onPick={(value) => { setSortBy(value); setOpenMenu(""); }} /> : null}
        </div>
      </div>
      <div className="menu-control">
        <button className="range-trigger" type="button" onClick={(event) => toggleMenu("date", event)}><CalendarDays size={16} />{dateRange === "Custom" ? formatRangeLabel(customRange) : dateRange}</button>
        {openMenu === "date" ? (
          <div className="date-menu" style={menuPosition}>
            <div className="date-range-options">
              {dateRanges.map((range) => <button className={dateRange === range ? "active" : ""} key={range} onClick={() => chooseDateRange(range)} type="button">{range}</button>)}
            </div>
            {dateRange === "Custom" ? <DateRangePicker range={customRange} onChange={setCustomRange} onDone={() => setOpenMenu("")} /> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function OptionMenu({ onPick, options, style, value }) {
  return (
    <div className="option-menu" style={style}>
      {options.map((option) => <button className={value === option.value ? "active" : ""} key={option.value} onClick={() => onPick(option.value)} type="button">{option.label}</button>)}
    </div>
  );
}

function DateRangePicker({ range, onChange, onDone }) {
  const [cursor, setCursor] = useState(range.start || todayIso());
  const [draft, setDraft] = useState(range);
  const days = getCalendarDays(cursor);
  const monthLabel = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(new Date(`${cursor}T00:00:00`));

  function pickDate(date) {
    if (!draft.start || (draft.start && draft.end)) {
      const next = { start: date, end: "" };
      setDraft(next);
      onChange(next);
      return;
    }

    if (date !== draft.start) {
      const next = normalizeRange(draft.start, date);
      setDraft(next);
      onChange(next);
    }
  }

  return (
    <div className="date-range-popover inline">
      <div className="calendar-head">
        <button type="button" onClick={() => setCursor(addMonths(cursor, -1))}>Prev</button>
        <strong>{monthLabel}</strong>
        <button type="button" onClick={() => setCursor(addMonths(cursor, 1))}>Next</button>
      </div>
      <div className="calendar-grid">
        {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}
        {days.map((day) => <button className={`${day.muted ? "muted" : ""} ${isInsideRange(day.date, draft) ? "selected" : ""}`} key={day.date} onClick={() => pickDate(day.date)} type="button">{new Date(`${day.date}T00:00:00`).getDate()}</button>)}
      </div>
      <div className="range-footer">
        <span>{formatRangeLabel(draft)}</span>
        <button disabled={!draft.start || !draft.end} type="button" onClick={onDone}>Done</button>
      </div>
    </div>
  );
}

function CustomerHeader({ invoice, totals, onEdit }) {
  const customer = invoice.customerInfo || emptyCustomer;
  return (
    <section className="customer-header">
      <div className="company-avatar">{getInitials(customer.name)}</div>
      <div className="customer-copy">
        <p>Customer information</p>
        <h2>{customer.name || "Unknown customer"}</h2>
        <div className="customer-meta"><span>{customer.contact || "No contact selected"}</span><span>{customer.address || "No address"}</span><span>{customer.gstin || "No GSTIN"}</span><span>{customer.email || "No email"}</span><span>{customer.phone || "No phone"}</span></div>
      </div>
      <div className="invoice-identity"><Label>Invoice number</Label><strong>{invoice.id}</strong><small>Total: {formatMoney(totals.finalTotal)}</small><Button className="secondary-action" onClick={onEdit} type="button"><Edit3 size={16} />Edit customer</Button></div>
    </section>
  );
}

function ProductTable({ delivered, rows, onAdd, onDelete, onEdit, onToggleDelivered }) {
  return (
    <section className="product-card">
      <div className="section-heading"><div><p>Product table</p><h3>Line items</h3></div><Button type="button" onClick={onAdd}><Plus size={17} />Add Product</Button></div>
      <div className="table-scroll">
        <table>
          <thead><tr>{["PID", "HSN Code", "Name & Description", "Cost Price", "Profit Margin", "Shown Discount", "Unit Price", "Extra Discount", "QTY", "GST %", "Marked Price", "Total Price", "Actions"].map((head) => <th key={head}>{head}</th>)}</tr></thead>
          <tbody>{rows.map((item, index) => <tr key={`${item.pid}-${index}`}><td>{item.pid || "-"}</td><td>{item.hsn || "-"}</td><td><strong>{item.name || "Untitled product"}</strong><small>{item.desc || "No description"}</small></td><td>{formatMoney(item.cost)}</td><td>{item.margin || "-"}</td><td>{formatMoney(item.shownDiscount)}</td><td>{formatMoney(item.unit)}</td><td>{formatMoney(item.extraDiscount)}</td><td>{item.qty}</td><td>{item.gst}%</td><td>{formatMoney(item.markedPrice)}</td><td>{formatMoney(item.total)}</td><td><div className="row-actions"><button type="button" onClick={() => onEdit(item, index)} aria-label="Edit product"><Edit3 size={15} /></button><button type="button" onClick={() => onDelete(index)} aria-label="Delete product"><Trash2 size={15} /></button></div></td></tr>)}</tbody>
        </table>
      </div>
      {!rows.length ? <p className="muted-copy">No products added yet.</p> : null}
      <label className="delivered-check"><input checked={delivered} type="checkbox" onChange={(event) => onToggleDelivered(event.target.checked)} /><span>Delivered</span></label>
    </section>
  );
}

function PaymentCard({ payment, totals, updatePayment }) {
  const lastLog = payment.logs[payment.logs.length - 1];
  return (
    <section className="side-card">
      <div className="section-heading compact"><div><p>Payment</p><h3>Terms</h3></div></div>
      {shouldShowDaysLeft(payment, totals.balance) ? <DaysLeftPanel days={getDaysUntilDue(payment)} /> : null}
      <label className="select-field full"><span>Payment type</span><select value={payment.type} onChange={(event) => updatePayment({ type: event.target.value })}><option>Spot</option><option>EMI</option><option>Pay Later</option></select></label>
      <label className="mini-field"><span>Billing date</span><input type="date" value={payment.billingDate} onChange={(event) => updatePayment({ billingDate: event.target.value })} /></label>
      {payment.type === "Pay Later" ? <label className="mini-field"><span>Credit days</span><input min="0" type="number" value={payment.creditDays} onChange={(event) => updatePayment({ creditDays: event.target.value })} /></label> : null}
      <label className="check-row payment-done"><input checked={Boolean(payment.paid)} type="checkbox" onChange={(event) => updatePayment({ paid: event.target.checked })} /><span>Payment done</span></label>
      <div className="last-payment-box"><span>Last payment log</span>{lastLog ? <strong>{formatMoney(lastLog.amount)} via {lastLog.mode}</strong> : <strong>No payments yet</strong>}<small>Balance: {formatMoney(totals.balance)}</small></div>
      <Button className="secondary-action" onClick={() => updatePayment({ logs: [...payment.logs, { amount: 0, date: todayIso(), mode: payment.type === "EMI" ? "EMI" : "UPI", note: "" }] })} type="button"><Plus size={15} />Add log</Button>
    </section>
  );
}

function CustomerDialog({ customers, invoice, onAdd, onSaveAndAdd }) {
  const [draft, setDraft] = useState(invoice.customerInfo || emptyCustomer);
  const [query, setQuery] = useState("");
  const matches = customers.filter((customer) => `${customer.name} ${customer.contact} ${customer.email}`.toLowerCase().includes(query.toLowerCase()));
  return <PickerShell query={query} setQuery={setQuery} placeholder="Search existing customers" results={matches} renderResult={(customer) => <button key={customer.id || customer.email} onClick={() => setDraft(customer)} type="button"><strong>{customer.name}</strong><span>{customer.contact}</span><small>{customer.email}</small></button>}><CustomerFields draft={draft} setDraft={setDraft} /><div className="dialog-actions"><Button type="button" onClick={() => onAdd(draft)}><Check size={17} />Add</Button><Button className="secondary-action" type="button" onClick={() => onSaveAndAdd(draft)}><Save size={17} />Save and add</Button></div></PickerShell>;
}

function ProductDialog({ editingProduct, products, onAdd, onSaveAndAdd }) {
  const [draft, setDraft] = useState(editingProduct.product);
  const [query, setQuery] = useState("");
  const matches = products.filter((product) => `${product.pid} ${product.name} ${product.hsn}`.toLowerCase().includes(query.toLowerCase()));
  return <PickerShell query={query} setQuery={setQuery} placeholder="Search existing products" results={matches} renderResult={(product) => <button key={product.id || product.pid} onClick={() => setDraft({ ...product, qty: draft.qty || 1 })} type="button"><strong>{product.name}</strong><span>{product.pid} - HSN {product.hsn}</span><small>{formatMoney(product.unit)}</small></button>}><ProductFields draft={draft} setDraft={setDraft} /><div className="dialog-actions"><Button type="button" onClick={() => onAdd(draft, editingProduct.index)}><Check size={17} />Add</Button><Button className="secondary-action" type="button" onClick={() => onSaveAndAdd(draft, editingProduct.index)}><Save size={17} />Save and add</Button></div></PickerShell>;
}

function PickerShell({ children, placeholder, query, renderResult, results, setQuery }) {
  return <div className="picker-dialog"><section className="picker-editor">{children}</section><section className="picker-search"><div className="search-field"><Search size={16} /><input placeholder={placeholder} value={query} onChange={(event) => setQuery(event.target.value)} /></div><div className="picker-results">{results.map(renderResult)}</div></section></div>;
}

function CustomerFields({ draft, setDraft }) {
  return ["name", "contact", "address", "gstin", "email", "phone"].map((key) => <EditableField key={key} label={key === "gstin" ? "GSTIN" : key} value={draft[key]} onChange={(value) => setDraft((current) => ({ ...current, [key]: value }))} />);
}

function ProductFields({ draft, setDraft }) {
  const fields = [["pid", "PID"], ["hsn", "HSN Code"], ["name", "Name"], ["desc", "Description"], ["cost", "Cost price", "number"], ["margin", "Profit margin"], ["shownDiscount", "Shown discount", "number"], ["unit", "Unit price", "number"], ["extraDiscount", "Extra discount", "number"], ["qty", "Quantity", "number"], ["gst", "GST %", "number"]];
  return fields.map(([key, label, type]) => <EditableField key={key} label={label} type={type} value={draft[key]} onChange={(value) => setDraft((current) => ({ ...current, [key]: type === "number" ? Number(value) : value }))} />);
}

function GeneralNote({ value, onChange }) {
  return <section className="product-card note-card"><div className="section-heading compact"><div><p>Invoice note</p><h3>General note</h3></div></div><label className="notes-field plain-note"><span>Note</span><textarea value={value || ""} onChange={(event) => onChange(event.target.value)} placeholder="Add a general note for this invoice" /></label></section>;
}

function MoneySummary({ totals }) {
  return <section className="side-card money-card"><div className="section-heading compact"><div><p>Money summary</p><h3>Total</h3></div></div><SummaryRow label="Subtotal" value={formatMoney(totals.subtotal)} /><SummaryRow label="Total tax" value={formatMoney(totals.tax)} /><div className="final-total"><span>Final Total</span><strong>{formatMoney(totals.finalTotal)}</strong></div><SummaryRow label="Previously paid" value={formatMoney(totals.paid)} /><SummaryRow label="Balance due" value={formatMoney(totals.balance)} strong /></section>;
}

function Dialog({ title, children, onClose }) {
  return <div className="dialog-backdrop" role="dialog" aria-modal="true" aria-label={title}><div className="dialog-card wide"><div className="dialog-header"><h3>{title}</h3><button onClick={onClose} type="button">Close</button></div>{children}</div></div>;
}

function EditableField({ label, value, onChange, type = "text" }) {
  return <label className="mini-field"><span>{label}</span><input type={type} value={value ?? ""} onChange={(event) => onChange(event.target.value)} /></label>;
}

function SummaryRow({ label, value, strong }) {
  return <div className={`summary-row ${strong ? "strong" : ""}`}><span>{label}</span><strong>{value}</strong></div>;
}

function StatusBadge({ status }) {
  return <span className={`status-badge ${status.toLowerCase().replaceAll(" ", "-")}`}>{status}</span>;
}

function DaysBadge({ days, compact }) {
  const tone = days < 0 ? "danger" : days <= 7 ? "warning" : "success";
  return <span className={`days-badge ${tone} ${compact ? "compact" : ""}`}>{days < 0 ? `${Math.abs(days)}d overdue` : `${days}d left`}</span>;
}

function invoiceMatchesSearch(invoice, search) {
  const query = search.trim().toLowerCase();
  if (!query) return true;
  return `${invoice.id} ${invoice.customer} ${invoice.customerInfo?.name || ""} ${invoice.customerInfo?.email || ""} ${invoice.status}`.toLowerCase().includes(query);
}

function compareInvoices(first, second, sortBy) {
  if (sortBy === "new-old") return new Date(second.billingDate) - new Date(first.billingDate);
  if (sortBy === "bill-low-high") return Number(first.total || 0) - Number(second.total || 0);
  if (sortBy === "bill-high-low") return Number(second.total || 0) - Number(first.total || 0);
  if (sortBy === "due-low-high") return getInvoiceBalance(first) - getInvoiceBalance(second);
  if (sortBy === "due-high-low") return getInvoiceBalance(second) - getInvoiceBalance(first);
  return new Date(first.billingDate) - new Date(second.billingDate);
}

function getInvoiceBalance(invoice) {
  const rows = (invoice.products || []).map(getPricedRow);
  return getInvoiceTotals(rows, invoice.payment?.logs || []).balance;
}

function shouldShowDaysLeft(payment, balance) {
  if (!payment) return false;
  if (payment.type === "Spot") return false;
  if (payment.paid) return false;
  if (Number(balance || 0) <= 0) return false;
  return true;
}

function isInDateRange(dateValue, range, customRange) {
  const date = new Date(`${dateValue}T00:00:00`);
  const now = new Date();
  if (range === "Today") return date.toDateString() === now.toDateString();
  if (range === "This Week") {
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    start.setHours(0, 0, 0, 0);
    return date >= start && date <= now;
  }
  if (range === "This Month") return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  if (range === "This Year") return date.getFullYear() === now.getFullYear();
  if (range === "Custom") {
    if (!customRange.start || !customRange.end) return true;
    const normalized = normalizeRange(customRange.start, customRange.end);
    return date >= new Date(`${normalized.start}T00:00:00`) && date <= new Date(`${normalized.end}T23:59:59`);
  }
  return true;
}

function normalizeRange(start, end) {
  return start <= end ? { start, end } : { start: end, end: start };
}

function formatRangeLabel(range) {
  if (!range.start && !range.end) return "Custom range";
  if (!range.end) return `${range.start} - choose end`;
  return `${range.start} to ${range.end}`;
}

function getCalendarDays(cursor) {
  const current = new Date(`${cursor}T00:00:00`);
  const year = current.getFullYear();
  const month = current.getMonth();
  const first = new Date(year, month, 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return { date: toIsoDate(date), muted: date.getMonth() !== month };
  });
}

function isInsideRange(date, range) {
  if (!range.start) return false;
  const normalized = normalizeRange(range.start, range.end || range.start);
  return date >= normalized.start && date <= normalized.end;
}

function DaysLeftPanel({ days }) {
  const tone = days < 0 ? "danger" : days <= 5 ? "warning" : "success";
  return <div className={`days-left-panel ${tone}`}><span>{days < 0 ? "Past due" : "Days left"}</span><strong>{days < 0 ? Math.abs(days) : days}</strong><small>{days < 0 ? "days overdue" : "days remaining"}</small></div>;
}

function getPricedRow(item) {
  const markedPrice = Math.round((Number(item.unit) - Number(item.extraDiscount)) * (1 + Number(item.gst) / 100));
  return { ...item, markedPrice, total: markedPrice * Number(item.qty) };
}

function getInvoiceTotals(rows, logs) {
  const subtotal = rows.reduce((sum, item) => sum + Number(item.unit) * Number(item.qty), 0);
  const tax = rows.reduce((sum, item) => sum + (Number(item.unit) - Number(item.extraDiscount)) * Number(item.qty) * (Number(item.gst) / 100), 0);
  const finalTotal = Math.round(subtotal + tax);
  const paid = logs.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  return { subtotal, tax, finalTotal, paid, balance: finalTotal - paid };
}

function getDaysUntilDue(payment) {
  const dueDate = payment.type === "Pay Later" ? addDays(payment.billingDate, Number(payment.creditDays || 0)) : payment.billingDate;
  const today = new Date(`${todayIso()}T00:00:00`);
  const due = new Date(`${dueDate}T00:00:00`);
  return Math.ceil((due - today) / 86400000);
}

function addDays(dateValue, days) {
  const date = new Date(`${dateValue}T00:00:00`);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function addMonths(dateValue, months) {
  const date = new Date(`${dateValue}T00:00:00`);
  const day = date.getDate();
  date.setMonth(date.getMonth() + Number(months || 0));
  if (date.getDate() !== day) date.setDate(0);
  return toIsoDate(date);
}

function toIsoDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getInitials(value) {
  return (value || "Unknown customer").split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export default Invoices;
