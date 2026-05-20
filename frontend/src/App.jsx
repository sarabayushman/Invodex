import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Bell,
  Bot,
  Box,
  Building2,
  CalendarDays,
  Check,
  Download,
  Edit3,
  Eye,
  FileText,
  LayoutDashboard,
  LockKeyhole,
  Mail,
  MessageSquare,
  Plus,
  Save,
  Search,
  Send,
  Settings,
  Trash2,
  Users,
  WalletCards,
} from "lucide-react";
import { Link, Route, Routes, useNavigate } from "react-router-dom";
import { Button } from "./components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import {
  bootstrapWorkspace,
  createAutosaveQueue,
  deleteInvoiceRecord,
  fetchInvoiceWorkspace,
  mapCustomerFromDb,
  mapInvoiceFromDb,
  mapProductFromDb,
  saveInvoiceWithItems,
  upsertCustomer,
  upsertProduct,
} from "./services/invodexData";
import { getAuthRedirectUrl, supabase, upsertUserProfile } from "./supabaseClient";

const baseInvoices = [
  { id: "INV-2026-0148", customer: "Aarav Auto Distributors", total: 182450, status: "Pending Payment", days: 6, billingDate: "2026-05-14" },
  { id: "INV-2026-0147", customer: "Northline Motors", total: 94780, status: "Pending Delivery", days: 13, billingDate: "2026-05-12" },
  { id: "INV-2026-0142", customer: "Mehra Fleet Works", total: 236100, status: "Past Due Date", days: -3, billingDate: "2026-04-28" },
  { id: "INV-2026-0139", customer: "Velocity Parts Co.", total: 68720, status: "Raised Issues", days: 2, billingDate: "2026-05-08" },
  { id: "INV-2026-0138", customer: "Kinetic Motors", total: 146300, status: "Pending Payment", days: 8, billingDate: "2026-05-03" },
  { id: "INV-2026-0135", customer: "Roadline Spares", total: 58120, status: "Pending Delivery", days: 17, billingDate: "2026-04-25" },
  { id: "INV-2026-0131", customer: "Eastern Fleet Hub", total: 304880, status: "Pending Payment", days: 22, billingDate: "2026-04-19" },
  { id: "INV-2026-0129", customer: "Blueway Logistics", total: 119400, status: "Past Due Date", days: -11, billingDate: "2026-03-30" },
  { id: "INV-2026-0126", customer: "Prime Axle Works", total: 77500, status: "Pending Delivery", days: 31, billingDate: "2026-03-18" },
  { id: "INV-2026-0122", customer: "Sunrise Dealership", total: 99580, status: "Raised Issues", days: 5, billingDate: "2026-03-09" },
  { id: "INV-2026-0119", customer: "Metro Auto Parts", total: 212900, status: "Pending Payment", days: 44, billingDate: "2026-02-26" },
  { id: "INV-2026-0115", customer: "Harbor Motors", total: 54200, status: "Pending Delivery", days: 49, billingDate: "2026-02-13" },
  { id: "INV-2025-0101", customer: "Apex Fleet East", total: 187600, status: "Pending Payment", days: 61, billingDate: "2025-12-18" },
];

const productCatalog = [
  { pid: "PRD-401", hsn: "8708", name: "Brake caliper assembly", desc: "Front axle compatible, dealership grade", cost: 4200, margin: "22%", shownDiscount: 380, unit: 5005, extraDiscount: 150, qty: 12, gst: 18 },
  { pid: "PRD-226", hsn: "8507", name: "Battery pack 12V", desc: "Sealed maintenance-free unit", cost: 6900, margin: "1400", shownDiscount: 600, unit: 8900, extraDiscount: 250, qty: 8, gst: 28 },
  { pid: "PRD-118", hsn: "4011", name: "Commercial tyre set", desc: "High-load tread, highway use", cost: 11800, margin: "18%", shownDiscount: 900, unit: 14824, extraDiscount: 400, qty: 6, gst: 18 },
  { pid: "PRD-502", hsn: "8708", name: "Clutch plate kit", desc: "Heavy duty kit for commercial vehicles", cost: 5300, margin: "24%", shownDiscount: 420, unit: 6972, extraDiscount: 180, qty: 4, gst: 18 },
];

const customers = [
  { name: "Apex Auto Dealership", contact: "Aarav Auto Distributors", address: "17 Industrial Estate, Pune", gstin: "27AAPCA1849M1Z8", email: "billing@apexauto.in", phone: "+91 98765 43210" },
  { name: "Northline Motors", contact: "Riya Sharma", address: "Plot 22, MIDC, Nashik", gstin: "27AAFCN2231L1Z7", email: "accounts@northline.in", phone: "+91 91234 56780" },
  { name: "Mehra Fleet Works", contact: "Kabir Mehra", address: "Ring Road Depot, Jaipur", gstin: "08AAMFM9981K1Z1", email: "finance@mehrafleet.in", phone: "+91 99887 77665" },
  { name: "Velocity Parts Co.", contact: "Tanvi Rao", address: "Sector 8 Warehouse, Noida", gstin: "09AAVPV7712Q1Z3", email: "billing@velocityparts.in", phone: "+91 88990 11223" },
];

const navItems = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Invoices", icon: FileText },
  { name: "Inventory", icon: Box },
  { name: "Customers", icon: Users },
  { name: "AI analytics", icon: Bot },
  { name: "Mail & Contact", icon: Mail },
  { name: "Team", icon: Building2, separated: true },
  { name: "Settings", icon: Settings },
];

const filters = ["All", "Pending Payment", "Past Due Date", "Pending Delivery", "Raised Issues"];
const dateRanges = ["Today", "This Week", "This Month", "This Year", "Custom Range"];
const emptyCustomer = { name: "Unknown customer", contact: "", address: "", gstin: "", email: "", phone: "" };
const emptyProduct = { pid: "", hsn: "", name: "", desc: "", cost: 0, margin: "", shownDiscount: 0, unit: 0, extraDiscount: 0, qty: 1, gst: 18 };

function makeInvoice(invoice, index) {
  const customerInfo = customers.find((item) => invoice.customer.includes(item.contact) || invoice.customer === item.name) || customers[index % customers.length];

  return {
    ...invoice,
    customerInfo,
    products: productCatalog.slice(0, 3).map((item) => ({ ...item })),
    note: index % 2 === 0 ? "Customer prefers a consolidated dispatch update after payment." : "",
    delivered: invoice.status === "Pending Payment",
    payment: {
      type: index % 3 === 1 ? "Pay Later" : index % 3 === 2 ? "EMI" : "Spot",
      billingDate: invoice.billingDate,
      creditDays: 20,
      emiMonths: 6,
      interestRate: 12,
      paid: false,
      nextEmiDueDate: "2026-06-14",
      closingDate: "2026-11-14",
      logs: [
        { amount: Math.round(invoice.total * 0.25), date: invoice.billingDate, mode: "UPI", note: "Advance paid" },
        { amount: Math.round(invoice.total * 0.15), date: "2026-05-18", mode: "Bank transfer", note: "Partial payment" },
      ],
    },
  };
}

function App() {
  useEffect(() => {
    window.signout = async function signout() {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Invodex sign out failed:", error.message);
        return;
      }

      console.log("Invodex sign out successful");
      window.location.assign("/login");
    };

    return () => {
      delete window.signout;
    };
  }, []);

  return (
    <Routes>
      <Route path="/" element={<MainApp />} />
      <Route path="/login" element={<Login />} />
    </Routes>
  );
}

function MainApp() {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState("Invoices");
  const [activeFilter, setActiveFilter] = useState("All");
  const [dateRange, setDateRange] = useState("This Month");
  const [customRange, setCustomRange] = useState({ start: "2026-05-01", end: "2026-05-31" });
  const [visibleCount, setVisibleCount] = useState(10);
  const [orgId, setOrgId] = useState("");
  const [invoiceList, setInvoiceList] = useState([]);
  const [customerList, setCustomerList] = useState([]);
  const [productList, setProductList] = useState([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
  const [isLoadingWorkspace, setIsLoadingWorkspace] = useState(true);
  const [workspaceError, setWorkspaceError] = useState("");
  const [dialog, setDialog] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);
  const [toast, setToast] = useState("");

  const autosaveQueue = useMemo(() => createAutosaveQueue(async (invoice) => {
    if (!orgId || !invoice) return;
    const pricedRows = invoice.products.map(getPricedRow);
    const invoiceTotals = getInvoiceTotals(pricedRows, invoice.payment.logs);
    const { data, error } = await saveInvoiceWithItems(orgId, invoice, invoiceTotals);
    if (error) {
      showToast(`Save failed: ${error.message}`);
      return;
    }
    if (data?.id && !invoice.dbId) {
      setInvoiceList((current) => current.map((item) => (item.id === invoice.id ? { ...item, dbId: data.id } : item)));
    }
  }, 650), [orgId]);

  const selectedInvoice = invoiceList.find((invoice) => invoice.id === selectedInvoiceId) || null;

  const filteredInvoices = useMemo(() => {
    return invoiceList.filter((invoice) => {
      const matchesStatus = activeFilter === "All" || invoice.status === activeFilter;
      return matchesStatus && isInDateRange(invoice.billingDate, dateRange, customRange);
    });
  }, [activeFilter, customRange, dateRange, invoiceList]);

  const visibleInvoices = filteredInvoices.slice(0, visibleCount);
  const rows = useMemo(() => (selectedInvoice?.products || []).map(getPricedRow), [selectedInvoice]);
  const totals = useMemo(() => getInvoiceTotals(rows, selectedInvoice?.payment?.logs || []), [rows, selectedInvoice]);

  useEffect(() => {
    let mounted = true;
    let channel = null;

    async function loadWorkspace() {
      setIsLoadingWorkspace(true);
      setWorkspaceError("");

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        setWorkspaceError(sessionError.message);
        setIsLoadingWorkspace(false);
        return;
      }

      const user = sessionData.session?.user;
      if (!user) {
        navigate("/login", { replace: true });
        return;
      }

      const profileResult = await upsertUserProfile(user);
      if (profileResult.error) {
        setWorkspaceError(profileResult.error.message);
        setIsLoadingWorkspace(false);
        return;
      }

      const workspaceResult = await bootstrapWorkspace(user);
      if (workspaceResult.error) {
        setWorkspaceError(workspaceResult.error.message);
        setIsLoadingWorkspace(false);
        return;
      }

      async function refreshWorkspace(nextOrgId) {
        const workspaceData = await fetchInvoiceWorkspace(nextOrgId);
        if (!mounted) return;
        if (workspaceData.error) {
          setWorkspaceError(workspaceData.error.message);
          return;
        }

        const invoices = workspaceData.data.invoices.map(mapInvoiceFromDb);
        setInvoiceList(invoices);
        setCustomerList(workspaceData.data.customers.map(mapCustomerFromDb).filter(Boolean));
        setProductList(workspaceData.data.products.map(mapProductFromDb).filter(Boolean));
        setSelectedInvoiceId((current) => current && invoices.some((invoice) => invoice.id === current) ? current : invoices[0]?.id || "");
      }

      setOrgId(workspaceResult.orgId);
      await refreshWorkspace(workspaceResult.orgId);
      setIsLoadingWorkspace(false);

      channel = supabase
        .channel(`org-workspace-${workspaceResult.orgId}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "invoices", filter: `org_id=eq.${workspaceResult.orgId}` }, () => refreshWorkspace(workspaceResult.orgId))
        .on("postgres_changes", { event: "*", schema: "public", table: "invoice_items", filter: `org_id=eq.${workspaceResult.orgId}` }, () => refreshWorkspace(workspaceResult.orgId))
        .on("postgres_changes", { event: "*", schema: "public", table: "customers", filter: `org_id=eq.${workspaceResult.orgId}` }, () => refreshWorkspace(workspaceResult.orgId))
        .on("postgres_changes", { event: "*", schema: "public", table: "products", filter: `org_id=eq.${workspaceResult.orgId}` }, () => refreshWorkspace(workspaceResult.orgId))
        .subscribe();
    }

    loadWorkspace();

    return () => {
      mounted = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, [navigate]);

  useEffect(() => {
    setVisibleCount(10);
  }, [activeFilter, customRange, dateRange]);

  function showToast(message) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  }

  function handleMenuClick(name) {
    setActiveMenu(name);
    if (name !== "Invoices") showToast(`${name} section coming soon`);
  }

  function finalizeInvoice(invoice) {
    const pricedRows = invoice.products.map(getPricedRow);
    const invoiceTotals = getInvoiceTotals(pricedRows, invoice.payment.logs);
    return { ...invoice, total: invoiceTotals.finalTotal, billingDate: invoice.payment.billingDate, days: getDaysUntilDue(invoice.payment) };
  }

  function updateSelectedInvoice(patch, options = {}) {
    if (!selectedInvoice) return;
    const nextInvoice = finalizeInvoice({ ...selectedInvoice, ...patch });
    setInvoiceList((current) => current.map((invoice) => (invoice.id === selectedInvoice.id ? nextInvoice : invoice)));
    if (options.immediate) autosaveQueue.flush();
    autosaveQueue.schedule(nextInvoice);
  }

  function updatePayment(patch) {
    updateSelectedInvoice({ payment: { ...selectedInvoice.payment, ...patch } });
  }

  async function addInvoice() {
    if (!orgId) {
      showToast("Workspace is still loading");
      return;
    }
    const id = `INV-${new Date().getFullYear()}-${String(invoiceList.length + 1).padStart(4, "0")}`;
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
      payment: { type: "Spot", billingDate: todayIso(), creditDays: 0, emiMonths: 6, interestRate: 12, paid: false, nextEmiDueDate: addMonths(todayIso(), 1), closingDate: addMonths(todayIso(), 6), logs: [] },
    });

    const result = await saveInvoiceWithItems(orgId, invoice, getInvoiceTotals([], []));
    if (result.error) {
      showToast(`Invoice save failed: ${result.error.message}`);
      return;
    }

    setInvoiceList((current) => [{ ...invoice, dbId: result.data.id }, ...current]);
    setSelectedInvoiceId(id);
    setActiveFilter("All");
    setDateRange("This Year");
    showToast("Blank invoice created");
  }

  async function deleteInvoice(id) {
    const invoice = invoiceList.find((item) => item.id === id);
    if (!window.confirm(`Delete ${invoice?.id || "this invoice"}? This action cannot be undone.`)) return;
    if (invoice?.dbId) {
      const result = await deleteInvoiceRecord(invoice.dbId);
      if (result.error) {
        showToast(`Delete failed: ${result.error.message}`);
        return;
      }
    }
    setInvoiceList((current) => {
      const next = current.filter((invoice) => invoice.id !== id);
      if (selectedInvoiceId === id) setSelectedInvoiceId(next[0]?.id || "");
      return next;
    });
  }

  function handleInvoiceScroll(event) {
    const node = event.currentTarget;
    const nearBottom = node.scrollTop + node.clientHeight >= node.scrollHeight - 24;
    if (nearBottom && visibleCount < filteredInvoices.length) {
      setVisibleCount((count) => Math.min(count + 10, filteredInvoices.length));
    }
  }

  function openProductDialog(product, index) {
    setEditingProduct({ product: product ? { ...product } : { ...emptyProduct }, index });
    setDialog("product");
  }

  async function saveProduct(product, index) {
    if (!selectedInvoice || !orgId) return;
    const productResult = await upsertProduct(orgId, product);
    if (productResult.error) {
      showToast(`Product save failed: ${productResult.error.message}`);
      return;
    }
    const savedProduct = mapProductFromDb(productResult.data);
    const nextProducts = [...selectedInvoice.products];
    if (Number.isInteger(index)) nextProducts[index] = { ...savedProduct, qty: product.qty };
    else nextProducts.push({ ...savedProduct, qty: product.qty });
    setProductList((current) => {
      const withoutOld = current.filter((item) => item.id !== savedProduct.id);
      return [...withoutOld, savedProduct].sort((first, second) => first.name.localeCompare(second.name));
    });
    updateSelectedInvoice({ products: nextProducts });
    setDialog("");
    setEditingProduct(null);
  }

  function deleteProduct(index) {
    if (!selectedInvoice) return;
    updateSelectedInvoice({ products: selectedInvoice.products.filter((_, rowIndex) => rowIndex !== index) });
  }

  async function saveCustomer(customerInfo) {
    if (!selectedInvoice || !orgId) return;
    const customerResult = await upsertCustomer(orgId, customerInfo);
    if (customerResult.error) {
      showToast(`Customer save failed: ${customerResult.error.message}`);
      return;
    }
    const savedCustomer = mapCustomerFromDb(customerResult.data);
    setCustomerList((current) => {
      const withoutOld = current.filter((item) => item.id !== savedCustomer.id);
      return [...withoutOld, savedCustomer].sort((first, second) => first.name.localeCompare(second.name));
    });
    updateSelectedInvoice({ customerInfo: savedCustomer, customer: savedCustomer.name || "Unknown customer" });
    setDialog("");
  }

  if (isLoadingWorkspace) {
    return <main className="app-page"><section className="workspace"><div className="empty-list">Loading your workspace from Supabase...</div></section></main>;
  }

  if (workspaceError) {
    return <main className="app-page"><section className="workspace"><div className="empty-list">Supabase error: {workspaceError}</div></section></main>;
  }

  return (
    <main className="app-page">
      <aside className="app-sidebar" aria-label="Main navigation">
        <a className="brand-lockup app-brand" href="/" aria-label="Invodex home">
          <span className="brand-mark" aria-hidden="true"><span /><span /></span>
          <span>Invodex</span>
        </a>
        <nav className="side-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button className={`side-nav-item ${activeMenu === item.name ? "active" : ""} ${item.separated ? "separated" : ""}`} key={item.name} onClick={() => handleMenuClick(item.name)} type="button">
                <Icon size={18} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <section className="workspace">
        <header className="app-topbar">
          <div>
            <p>Admin workspace</p>
            <h1>Invoices</h1>
          </div>
          <div className="topbar-actions">
            <button type="button" onClick={() => showToast("Notifications coming soon")}><Bell size={18} /></button>
            <Link className="admin-pill" to="/login">Admin login</Link>
          </div>
        </header>

        <div className="invoice-layout">
          <aside className="invoice-list-panel">
            <InvoiceListTools customRange={customRange} dateRange={dateRange} setCustomRange={setCustomRange} setDateRange={setDateRange} />
            <div className="filter-tabs" aria-label="Invoice filters">
              {filters.map((filter) => (
                <button className={activeFilter === filter ? "active" : ""} key={filter} onClick={() => setActiveFilter(filter)} type="button">{filter}</button>
              ))}
            </div>
            <div className="invoice-list" onScroll={handleInvoiceScroll}>
              {visibleInvoices.map((invoice) => (
                <InvoiceListItem
                  invoice={invoice}
                  isActive={selectedInvoice?.id === invoice.id}
                  key={invoice.id}
                  onDelete={deleteInvoice}
                  onSelect={setSelectedInvoiceId}
                />
              ))}
              {visibleInvoices.length < filteredInvoices.length ? <div className="loading-row">Scroll for more invoices</div> : null}
              {!filteredInvoices.length ? <div className="empty-list">No invoices in this date range</div> : null}
            </div>
            <div className="invoice-list-footer">
              <Button className="add-invoice-button" onClick={addInvoice}><Plus size={18} />Add Invoice</Button>
            </div>
          </aside>

          {selectedInvoice ? <section className="invoice-detail">
            <CustomerHeader invoice={selectedInvoice} totals={totals} onEdit={() => setDialog("customer")} />
            <section className="detail-grid">
              <section className="detail-main">
                <ProductTable delivered={selectedInvoice.delivered} rows={rows} onAdd={() => openProductDialog(null, null)} onDelete={deleteProduct} onEdit={openProductDialog} onToggleDelivered={(delivered) => updateSelectedInvoice({ delivered })} />
                <GeneralNote value={selectedInvoice.note} onChange={(note) => updateSelectedInvoice({ note })} />
              </section>
              <aside className="detail-side">
                <PaymentCard payment={selectedInvoice.payment} totals={totals} updatePayment={updatePayment} onOpenLog={() => setDialog("payment-log")} onOpenPlan={() => setDialog("emi-plan")} />
                <MoneySummary totals={totals} />
                <ActionPanel onDownload={() => showToast("Feature coming soon")} onReminder={() => showToast("Reminder feature coming soon")} onSend={() => setDialog("send")} />
              </aside>
            </section>
          </section> : <section className="invoice-detail"><div className="empty-list">No invoices yet. Add your first invoice to save it in Supabase.</div></section>}
        </div>
      </section>

      {toast ? <div className="toast">{toast}</div> : null}
      {dialog ? (
        <Dialog title={dialogTitle(dialog)} onClose={() => setDialog("")}>
          {dialog === "customer" && selectedInvoice ? <CustomerDialog customers={customerList} invoice={selectedInvoice} onSave={saveCustomer} /> : null}
          {dialog === "send" && selectedInvoice ? <SendInvoiceDialog customer={selectedInvoice.customer} /> : null}
          {dialog === "product" && editingProduct ? <ProductDialog editingProduct={editingProduct} products={productList} onSave={saveProduct} /> : null}
          {dialog === "payment-log" && selectedInvoice ? <PaymentLogDialog payment={selectedInvoice.payment} totals={totals} updatePayment={updatePayment} /> : null}
          {dialog === "emi-plan" && selectedInvoice ? <EmiPlanDialog payment={selectedInvoice.payment} totals={totals} updatePayment={updatePayment} /> : null}
        </Dialog>
      ) : null}
    </main>
  );
}

function InvoiceListTools({ customRange, dateRange, setCustomRange, setDateRange }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="list-tools">
      <div className="search-field"><Search size={16} /><input placeholder="Search invoices" /></div>
      <label className="select-field">
        <span>Date range</span>
        <select aria-label="Date range" value={dateRange} onChange={(event) => { setDateRange(event.target.value); setOpen(event.target.value === "Custom Range"); }}>
          {dateRanges.map((range) => <option key={range}>{range}</option>)}
        </select>
      </label>
      {dateRange === "Custom Range" ? (
        <div className="range-picker-shell">
          <button className="range-trigger" type="button" onClick={() => setOpen((current) => !current)}><CalendarDays size={16} />{formatRangeLabel(customRange)}</button>
          {open ? <DateRangePicker range={customRange} onChange={setCustomRange} onDone={() => setOpen(false)} /> : null}
        </div>
      ) : null}
    </div>
  );
}

function DateRangePicker({ range, onChange, onDone }) {
  const [mode, setMode] = useState("date");
  const [cursor, setCursor] = useState(range.start || todayIso());
  const [draft, setDraft] = useState(range);
  const days = getCalendarDays(cursor);
  const monthLabel = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(new Date(`${cursor}T00:00:00`));

  function pickDate(date) {
    if (!draft.start || draft.end) {
      setDraft({ start: date, end: "" });
      return;
    }

    const next = normalizeRange(draft.start, date);
    setDraft(next);
    onChange(next);
  }

  function pickSpan(value) {
    const next = getSpanRange(mode, value);
    setDraft(next);
    onChange(next);
  }

  return (
    <div className="date-range-popover">
      <div className="range-mode-tabs">
        {["date", "month", "year"].map((item) => <button className={mode === item ? "active" : ""} key={item} onClick={() => setMode(item)} type="button">{item}</button>)}
      </div>
      {mode === "date" ? (
        <>
          <div className="calendar-head">
            <button type="button" onClick={() => setCursor(addMonths(cursor, -1))}>Prev</button>
            <strong>{monthLabel}</strong>
            <button type="button" onClick={() => setCursor(addMonths(cursor, 1))}>Next</button>
          </div>
          <div className="calendar-grid">
            {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}
            {days.map((day) => <button className={`${day.muted ? "muted" : ""} ${isInsideRange(day.date, draft) ? "selected" : ""}`} key={day.date} onClick={() => pickDate(day.date)} type="button">{new Date(`${day.date}T00:00:00`).getDate()}</button>)}
          </div>
        </>
      ) : (
        <div className="span-grid">
          {getSpanOptions(mode, cursor).map((item) => <button className={isSameRange(getSpanRange(mode, item.value), draft) ? "selected" : ""} key={item.value} onClick={() => pickSpan(item.value)} type="button">{item.label}</button>)}
        </div>
      )}
      <div className="range-footer">
        <span>{formatRangeLabel(draft)}</span>
        <button type="button" onClick={onDone}>Done</button>
      </div>
    </div>
  );
}

function InvoiceListItem({ invoice, isActive, onDelete, onSelect }) {
  return (
    <button className={`invoice-list-item ${isActive ? "active" : ""}`} onClick={() => onSelect(invoice.id)} type="button">
      <span><strong>{invoice.id}</strong><small>{invoice.customer}</small></span>
      <span className="invoice-item-meta">
        <b>{formatMoney(invoice.total)}</b>
        <StatusBadge status={invoice.status} />
        <DaysBadge days={invoice.days} compact />
      </span>
      <span className="invoice-date">{invoice.billingDate}</span>
      <span className="invoice-delete" onClick={(event) => { event.stopPropagation(); onDelete(invoice.id); }} role="button" tabIndex={0}><Trash2 size={15} /></span>
    </button>
  );
}

function CustomerHeader({ invoice, totals, onEdit }) {
  const customer = invoice.customerInfo || emptyCustomer;
  const tags = getInvoiceTags(invoice, totals);

  return (
    <section className="customer-header">
      <div className="company-avatar">{getInitials(customer.name)}</div>
      <div className="customer-copy">
        <p>Customer information</p>
        <h2>{customer.name || "Unknown customer"}</h2>
        <div className="customer-meta">
          <span>{customer.contact || "No contact selected"}</span><span>{customer.address || "No address"}</span><span>{customer.gstin || "No GSTIN"}</span><span>{customer.email || "No email"}</span><span>{customer.phone || "No phone"}</span>
        </div>
        <div className="customer-tags">
          {tags.map((tag) => <span className={`info-tag ${tag.tone}`} key={tag.label}>{tag.label}</span>)}
        </div>
      </div>
      <div className="invoice-identity">
        <Label>Invoice number</Label>
        <strong>{invoice.id}</strong>
        <small>Billing date: {invoice.billingDate}</small>
        <Button className="secondary-action" onClick={onEdit} type="button"><Edit3 size={16} />Edit customer</Button>
      </div>
    </section>
  );
}

function ProductTable({ delivered, rows, onAdd, onDelete, onEdit, onToggleDelivered }) {
  return (
    <section className="product-card">
      <div className="section-heading">
        <div><p>Product table</p><h3>Line items</h3></div>
        <Button type="button" onClick={onAdd}><Plus size={17} />Add Product</Button>
      </div>
      <div className="table-scroll">
        <table>
          <thead><tr>{["PID", "HSN Code", "Name & Description", "Cost Price", "Profit Margin", "Shown Discount", "Unit Price", "Extra Discount", "QTY", "GST %", "Marked Price", "Total Price", "Actions"].map((head) => <th key={head}>{head}</th>)}</tr></thead>
          <tbody>
            {rows.map((item, index) => (
              <tr key={`${item.pid}-${index}`}>
                <td>{item.pid || "-"}</td><td>{item.hsn || "-"}</td><td><strong>{item.name || "Untitled product"}</strong><small>{item.desc || "No description"}</small></td><td>{formatMoney(item.cost)}</td><td>{item.margin || "-"}</td><td>{formatMoney(item.shownDiscount)}</td><td>{formatMoney(item.unit)}</td><td>{formatMoney(item.extraDiscount)}</td><td>{item.qty}</td><td>{item.gst}%</td><td>{formatMoney(item.markedPrice)}</td><td>{formatMoney(item.total)}</td>
                <td><div className="row-actions"><button type="button" onClick={() => onEdit(item, index)} aria-label="Edit product"><Edit3 size={15} /></button><button type="button" onClick={() => onDelete(index)} aria-label="Delete product"><Trash2 size={15} /></button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length ? <p className="muted-copy">No products added yet.</p> : null}
      <label className="delivered-check"><input checked={delivered} type="checkbox" onChange={(event) => onToggleDelivered(event.target.checked)} /><span>Delivered</span></label>
    </section>
  );
}

function GeneralNote({ value, onChange }) {
  return (
    <section className="product-card note-card">
      <div className="section-heading compact"><div><p>Invoice note</p><h3>General note</h3></div></div>
      <label className="notes-field plain-note"><span>Note</span><textarea value={value || ""} onChange={(event) => onChange(event.target.value)} placeholder="Add a general note for this invoice" /></label>
    </section>
  );
}

function PaymentCard({ payment, totals, updatePayment, onOpenLog, onOpenPlan }) {
  const plan = getPaymentPlan(payment, totals.finalTotal);
  const lastLog = payment.logs[payment.logs.length - 1];

  return (
    <section className="side-card">
      <div className="section-heading compact"><div><p>Payment</p><h3>Terms</h3></div></div>
      <DaysLeftPanel days={getDaysUntilDue(payment)} />
      <label className="select-field full">
        <span>Payment type</span>
        <select value={payment.type} onChange={(event) => updatePayment({ type: event.target.value })}>
          <option>Spot</option>
          <option>EMI</option>
          <option>Pay Later</option>
        </select>
      </label>
      <div className="conditional-grid one-column">
        <label className="mini-field"><span>Billing date</span><input type="date" value={payment.billingDate} onChange={(event) => updatePayment({ billingDate: event.target.value })} /></label>
        {payment.type === "Pay Later" ? <label className="mini-field"><span>Credit days</span><input min="0" type="number" value={payment.creditDays} onChange={(event) => updatePayment({ creditDays: event.target.value })} /></label> : null}
        {payment.type === "EMI" ? <DisplayField label="Next EMI due date" value={plan.nextEmiDueDate} /> : null}
        {payment.type === "EMI" ? <DisplayField label="Closing date" value={plan.closingDate} /> : null}
      </div>
      <label className="check-row payment-done"><input checked={Boolean(payment.paid)} type="checkbox" onChange={(event) => updatePayment({ paid: event.target.checked })} /><span>Payment done</span></label>
      {payment.type === "EMI" ? <Button className="secondary-action" onClick={onOpenPlan} type="button"><Edit3 size={16} />Edit plan</Button> : null}
      <div className="last-payment-box">
        <span>Last payment log</span>
        {lastLog ? <strong>{formatMoney(lastLog.amount)} via {lastLog.mode}</strong> : <strong>No payments yet</strong>}
        <small>{lastLog ? `${lastLog.date} - ${lastLog.note || "No note"}` : "Add a log when a payment arrives."}</small>
      </div>
      <div className="payment-log-actions">
        <Button className="secondary-action" onClick={() => updatePayment({ logs: [...payment.logs, { amount: 0, date: todayIso(), mode: payment.type === "EMI" ? "EMI" : "UPI", note: "" }] })} type="button"><Plus size={15} />Add log</Button>
        <Button className="secondary-action" onClick={onOpenLog} type="button"><Eye size={15} />View payment log</Button>
      </div>
    </section>
  );
}

function PaymentLogDialog({ payment, totals, updatePayment }) {
  const heading = payment.type === "EMI" ? "EMI payments" : payment.type === "Pay Later" ? "Pay later ledger" : "Spot payment";

  function updateLog(index, key, value) {
    const logs = payment.logs.map((item, rowIndex) => (rowIndex === index ? { ...item, [key]: key === "amount" ? Number(value) : value } : item));
    updatePayment({ logs });
  }

  function addLog() {
    updatePayment({ logs: [...payment.logs, { amount: 0, date: todayIso(), mode: payment.type === "EMI" ? "EMI" : "UPI", note: "" }] });
  }

  return (
    <div className="payment-log-editor">
      <div className="section-heading compact"><div><p>Payment log</p><h3>{heading}</h3></div><Button className="mini-button" onClick={addLog} type="button"><Plus size={15} />Add log</Button></div>
      <div className="payment-log-form">
        {payment.logs.map((item, index) => (
          <div className="payment-log-edit-row" key={`${item.date}-${index}`}>
            <label><span>Amount</span><input type="number" value={item.amount} onChange={(event) => updateLog(index, "amount", event.target.value)} /></label>
            <label><span>Timestamp</span><input type="date" value={item.date} onChange={(event) => updateLog(index, "date", event.target.value)} /></label>
            <label><span>Payment from</span><select value={item.mode} onChange={(event) => updateLog(index, "mode", event.target.value)}><option>UPI</option><option>Cash</option><option>Cheque</option><option>Bank transfer</option><option>EMI</option></select></label>
            <label><span>Note</span><input value={item.note} onChange={(event) => updateLog(index, "note", event.target.value)} /></label>
          </div>
        ))}
      </div>
      <div className="payment-context">
        <DisplayField label="Remaining balance" value={formatMoney(totals.balance)} />
        {payment.type === "EMI" ? <DisplayField label="Next EMI due" value={getPaymentPlan(payment, totals.finalTotal).nextEmiDueDate} /> : null}
        {payment.type === "Pay Later" ? <DisplayField label="Closure date" value={addDays(payment.billingDate, Number(payment.creditDays || 0))} /> : null}
      </div>
    </div>
  );
}

function EmiPlanDialog({ payment, totals, updatePayment }) {
  const plan = getPaymentPlan(payment, totals.finalTotal);

  return (
    <div className="dialog-content emi-plan">
      <EditableField label="Billing date" type="date" value={payment.billingDate} onChange={(value) => updatePayment({ billingDate: value })} />
      <EditableField label="Months" type="number" value={payment.emiMonths} onChange={(value) => updatePayment({ emiMonths: Number(value) })} />
      <EditableField label="Interest rate %" type="number" value={payment.interestRate} onChange={(value) => updatePayment({ interestRate: Number(value) })} />
      <DisplayField label="Invoice principal" value={formatMoney(totals.finalTotal)} />
      <DisplayField label="Estimated EMI" value={formatMoney(plan.monthlyAmount)} />
      <DisplayField label="Next EMI due date" value={plan.nextEmiDueDate} />
      <DisplayField label="Closing date" value={plan.closingDate} />
    </div>
  );
}

function MoneySummary({ totals }) {
  return (
    <section className="side-card money-card">
      <div className="section-heading compact"><div><p>Money summary</p><h3>Total</h3></div></div>
      <SummaryRow label="Subtotal" value={formatMoney(totals.subtotal)} /><SummaryRow label="Total tax" value={formatMoney(totals.tax)} /><SummaryRow label="Freight charges" value={formatMoney(totals.freight)} /><SummaryRow label="Other charges" value={formatMoney(totals.other)} /><SummaryRow label="Round off" value={totals.roundOff.toFixed(2)} />
      <div className="final-total"><span>Final Total</span><strong>{formatMoney(totals.finalTotal)}</strong></div>
      <SummaryRow label="Previously paid" value={formatMoney(totals.paid)} /><SummaryRow label="Balance due" value={formatMoney(totals.balance)} strong />
    </section>
  );
}

function ActionPanel({ onDownload, onReminder, onSend }) {
  return (
    <section className="action-panel">
      <Button onClick={onDownload} type="button"><Download size={17} />Download Invoice</Button>
      <Button className="secondary-action" onClick={onSend} type="button"><Send size={17} />Send Invoice</Button>
      <Button className="secondary-action" onClick={onReminder} type="button"><MessageSquare size={17} />Send reminder</Button>
    </section>
  );
}

function CustomerDialog({ customers: customerOptions, invoice, onSave }) {
  const [draft, setDraft] = useState(invoice.customerInfo || emptyCustomer);
  const [query, setQuery] = useState("");
  const matches = customerOptions.filter((customer) => `${customer.name} ${customer.contact} ${customer.email}`.toLowerCase().includes(query.toLowerCase()));

  function update(key, value) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="picker-dialog">
      <section className="picker-editor">
        <EditableField label="Company name" value={draft.name} onChange={(value) => update("name", value)} />
        <EditableField label="Contact person" value={draft.contact} onChange={(value) => update("contact", value)} />
        <EditableField label="Address" value={draft.address} onChange={(value) => update("address", value)} />
        <EditableField label="GSTIN" value={draft.gstin} onChange={(value) => update("gstin", value)} />
        <EditableField label="Email" value={draft.email} onChange={(value) => update("email", value)} />
        <EditableField label="Phone" value={draft.phone} onChange={(value) => update("phone", value)} />
        <Button type="button" onClick={() => onSave(draft)}><Save size={17} />Save Customer</Button>
      </section>
      <section className="picker-search">
        <div className="search-field"><Search size={16} /><input placeholder="Search existing customers" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
        <div className="picker-results">
          {matches.map((customer) => (
            <button key={customer.id || customer.email} onClick={() => setDraft(customer)} type="button">
              <strong>{customer.name}</strong>
              <span>{customer.contact}</span>
              <small>{customer.email}</small>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function ProductDialog({ editingProduct, products, onSave }) {
  const [draft, setDraft] = useState(editingProduct.product);
  const [query, setQuery] = useState("");
  const matches = products.filter((product) => `${product.pid} ${product.name} ${product.hsn}`.toLowerCase().includes(query.toLowerCase()));

  function update(key, value) {
    setDraft((current) => ({ ...current, [key]: ["cost", "shownDiscount", "unit", "extraDiscount", "qty", "gst"].includes(key) ? Number(value) : value }));
  }

  return (
    <div className="picker-dialog">
      <section className="picker-editor">
        <EditableField label="PID" value={draft.pid} onChange={(value) => update("pid", value)} />
        <EditableField label="HSN Code" value={draft.hsn} onChange={(value) => update("hsn", value)} />
        <EditableField label="Name" value={draft.name} onChange={(value) => update("name", value)} />
        <EditableField label="Description" value={draft.desc} onChange={(value) => update("desc", value)} />
        <EditableField label="Cost price" type="number" value={draft.cost} onChange={(value) => update("cost", value)} />
        <EditableField label="Profit margin" value={draft.margin} onChange={(value) => update("margin", value)} />
        <EditableField label="Shown discount" type="number" value={draft.shownDiscount} onChange={(value) => update("shownDiscount", value)} />
        <EditableField label="Unit price" type="number" value={draft.unit} onChange={(value) => update("unit", value)} />
        <EditableField label="Extra discount" type="number" value={draft.extraDiscount} onChange={(value) => update("extraDiscount", value)} />
        <EditableField label="Quantity" type="number" value={draft.qty} onChange={(value) => update("qty", value)} />
        <EditableField label="GST %" type="number" value={draft.gst} onChange={(value) => update("gst", value)} />
        <Button type="button" onClick={() => onSave(draft, editingProduct.index)}><Check size={17} />Save Product</Button>
      </section>
      <section className="picker-search">
        <div className="search-field"><Search size={16} /><input placeholder="Search existing products" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
        <div className="picker-results">
          {matches.map((product) => (
            <button key={product.id || product.pid} onClick={() => setDraft(product)} type="button">
              <strong>{product.name}</strong>
              <span>{product.pid} - HSN {product.hsn}</span>
              <small>{formatMoney(product.unit)}</small>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function Dialog({ title, children, onClose }) {
  return <div className="dialog-backdrop" role="dialog" aria-modal="true" aria-label={title}><div className="dialog-card wide"><div className="dialog-header"><h3>{title}</h3><button onClick={onClose} type="button">Close</button></div>{children}</div></div>;
}

function SendInvoiceDialog({ customer }) {
  return <div className="dialog-content"><EditableField label="Recipient" value="billing@client.example" onChange={() => {}} /><EditableField label="Subject" value={`Invoice for ${customer}`} onChange={() => {}} /><label className="notes-field"><span>Body</span><textarea defaultValue="Hello, please find the invoice attached for your review." /></label><Button type="button"><Send size={17} />Send via Gmail SMTP</Button></div>;
}

function EditableField({ label, value, onChange, type = "text" }) {
  return <label className="mini-field"><span>{label}</span><input type={type} value={value ?? ""} onChange={(event) => onChange(event.target.value)} /></label>;
}

function OutputField({ label, value }) {
  return <div className="readonly-field"><Label>{label}</Label><input readOnly value={value} /></div>;
}

function DisplayField({ label, value }) {
  return <div className="display-field"><span>{label}</span><strong>{value}</strong></div>;
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

function dialogTitle(dialog) {
  if (dialog === "customer") return "Customer information";
  if (dialog === "send") return "Send Invoice";
  if (dialog === "payment-log") return "Payment log";
  if (dialog === "emi-plan") return "EMI plan";
  return "Product information";
}

function getPricedRow(item) {
  const markedPrice = Math.round((Number(item.unit) - Number(item.extraDiscount)) * (1 + Number(item.gst) / 100));
  return { ...item, markedPrice, total: markedPrice * Number(item.qty) };
}

function getInvoiceTotals(rows, logs) {
  const subtotal = rows.reduce((sum, item) => sum + Number(item.unit) * Number(item.qty), 0);
  const tax = rows.reduce((sum, item) => sum + (Number(item.unit) - Number(item.extraDiscount)) * Number(item.qty) * (Number(item.gst) / 100), 0);
  const freight = 2400;
  const other = 850;
  const rawTotal = subtotal + tax + freight + other;
  const finalTotal = Math.round(rawTotal);
  const paid = logs.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  return { subtotal, tax, freight, other, rawTotal, finalTotal, roundOff: finalTotal - rawTotal, paid, balance: finalTotal - paid };
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
  if (range === "Custom Range") {
    const normalized = normalizeRange(customRange.start, customRange.end || customRange.start);
    return date >= new Date(`${normalized.start}T00:00:00`) && date <= new Date(`${normalized.end}T23:59:59`);
  }
  return true;
}

function addDays(dateValue, days) {
  const date = new Date(`${dateValue}T00:00:00`);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
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

function normalizeRange(start, end) {
  return start <= end ? { start, end } : { start: end, end: start };
}

function formatRangeLabel(range) {
  if (!range.start && !range.end) return "Select two dates";
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

function getSpanOptions(mode, cursor) {
  const year = new Date(`${cursor}T00:00:00`).getFullYear();
  if (mode === "month") {
    return Array.from({ length: 12 }, (_, index) => ({ label: new Intl.DateTimeFormat("en-IN", { month: "short" }).format(new Date(year, index, 1)), value: `${year}-${String(index + 1).padStart(2, "0")}` }));
  }
  return Array.from({ length: 7 }, (_, index) => ({ label: String(year - 3 + index), value: String(year - 3 + index) }));
}

function getSpanRange(mode, value) {
  if (mode === "month") {
    const [year, month] = value.split("-").map(Number);
    const start = `${year}-${String(month).padStart(2, "0")}-01`;
    const end = toIsoDate(new Date(year, month, 0));
    return { start, end };
  }
  return { start: `${value}-01-01`, end: `${value}-12-31` };
}

function isSameRange(first, second) {
  return first.start === second.start && first.end === second.end;
}

function getPaymentPlan(payment, principal = 0) {
  const months = Math.max(1, Number(payment.emiMonths || 1));
  const nextEmiDueDate = addMonths(payment.billingDate, 1);
  const closingDate = addMonths(payment.billingDate, months);
  const interestMultiplier = 1 + Number(payment.interestRate || 0) / 100;
  return {
    nextEmiDueDate,
    closingDate,
    monthlyAmount: Math.round((Number(principal || 0) * interestMultiplier) / months),
  };
}

function getDaysUntilDue(payment) {
  const dueDate = payment.type === "EMI" ? getPaymentPlan(payment).nextEmiDueDate : payment.type === "Pay Later" ? addDays(payment.billingDate, Number(payment.creditDays || 0)) : payment.billingDate;
  const today = new Date(`${todayIso()}T00:00:00`);
  const due = new Date(`${dueDate}T00:00:00`);
  return Math.ceil((due - today) / 86400000);
}

function DaysLeftPanel({ days }) {
  const tone = days < 0 ? "danger" : days <= 5 ? "warning" : "success";
  return <div className={`days-left-panel ${tone}`}><span>{days < 0 ? "Past due" : "Days left"}</span><strong>{days < 0 ? Math.abs(days) : days}</strong><small>{days < 0 ? "days overdue" : "days remaining"}</small></div>;
}

function getInvoiceTags(invoice, totals) {
  const tags = [{ label: invoice.status, tone: invoice.days < 0 ? "danger" : invoice.status === "Pending Delivery" ? "info" : "warning" }];
  tags.push({ label: invoice.payment.paid || totals.balance <= 0 ? "Payment Done" : "Pending Payment", tone: invoice.payment.paid || totals.balance <= 0 ? "success" : "warning" });
  if (invoice.days < 0) tags.push({ label: "Payment Past Due Date", tone: "danger" });
  tags.push({ label: invoice.delivered ? "Delivered" : "Pending Delivery", tone: invoice.delivered ? "success" : "info" });
  if (invoice.payment.type === "EMI") tags.push({ label: "EMI", tone: "neutral" });
  return tags;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function getInitials(value) {
  return (value || "Unknown customer").split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function formatMoney(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value || 0));
}

function Login() {
  const navigate = useNavigate();
  const [authError, setAuthError] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function finishLogin(session) {
      if (!session?.user) return;

      const profileResult = await upsertUserProfile(session.user);
      if (profileResult.error) {
        console.warn("Invodex profile save skipped:", profileResult.error.message);
      }

      if (!mounted) return;
      console.log("Invodex login successful:", session.user.email);
      navigate("/", { replace: true });
    }

    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        setAuthError(error.message);
        return;
      }

      finishLogin(data.session);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
        finishLogin(session);
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  function handleLogin(event) {
    event.preventDefault();
    setAuthError("Email and password sign in is not enabled yet. Use Google to continue.");
  }

  async function handleGoogleLogin() {
    setAuthError("");
    setIsSigningIn(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: getAuthRedirectUrl(),
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error) {
      setAuthError(error.message);
      setIsSigningIn(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-shell" aria-label="Invodex sign in">
        <div className="brand-panel">
          <a className="brand-lockup" href="/" aria-label="Invodex home"><span className="brand-mark" aria-hidden="true"><span /><span /></span><span>Invodex</span></a>
          <div className="welcome-copy"><p>Admin workspace</p><h1>Sign in to manage invoices with clarity.</h1></div>
        </div>
        <Card className="login-card">
          <CardHeader><CardTitle>Admin login</CardTitle><CardDescription>Enter your details to continue to your dashboard.</CardDescription></CardHeader>
          <CardContent>
            <form className="login-form" onSubmit={handleLogin}>
              <Button type="button" className="google-button" aria-label="Continue with Google" disabled={isSigningIn} onClick={handleGoogleLogin}><GoogleMark />{isSigningIn ? "Opening Google..." : "Continue with Google"}</Button>
              <div className="login-divider"><span>or</span></div>
              <div className="form-field"><Label htmlFor="email">Email</Label><div className="input-wrap"><Mail aria-hidden="true" size={18} /><Input id="email" type="email" placeholder="name@company.com" autoComplete="email" /></div></div>
              <div className="form-field"><div className="field-row"><Label htmlFor="password">Password</Label><a href="/">Forgot password?</a></div><div className="input-wrap"><LockKeyhole aria-hidden="true" size={18} /><Input id="password" type="password" placeholder="Enter password" autoComplete="current-password" /></div></div>
              {authError ? <p className="auth-error" role="alert">{authError}</p> : null}
              <Button type="submit" className="submit-button">Sign in<ArrowRight aria-hidden="true" size={18} /></Button>
            </form>
          </CardContent>
          <CardFooter><p>New to Invodex? <a href="/">Sign up</a></p></CardFooter>
        </Card>
      </section>
    </main>
  );
}

function GoogleMark() {
  return (
    <svg className="google-mark" aria-hidden="true" viewBox="0 0 24 24" focusable="false">
      <path fill="#4285F4" d="M21.8 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h5.5c-.2 1.3-.9 2.3-2 3v2.7h3.3c1.9-1.8 3-4.4 3-7.7z" />
      <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.7-2.5l-3.3-2.7c-.9.6-2.1 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3v2.8C4.7 19.8 8.1 22 12 22z" />
      <path fill="#FBBC05" d="M6.4 13.7c-.2-.6-.3-1.2-.3-1.8s.1-1.2.3-1.8V7.3H3c-.7 1.4-1 2.9-1 4.6s.4 3.2 1 4.6l3.4-2.8z" />
      <path fill="#EA4335" d="M12 6.1c1.5 0 2.8.5 3.8 1.5l2.9-2.9C17 3 14.7 2 12 2 8.1 2 4.7 4.2 3 7.3l3.4 2.8C7.2 7.8 9.4 6.1 12 6.1z" />
    </svg>
  );
}

export default App;
