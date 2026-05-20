import { useMemo, useState } from "react";
import {
  ArrowRight,
  Bell,
  Bot,
  Box,
  Building2,
  Check,
  Download,
  Edit3,
  FileText,
  LayoutDashboard,
  LockKeyhole,
  Mail,
  MessageSquare,
  Plus,
  Search,
  Send,
  Settings,
  Trash2,
  Users,
  WalletCards,
} from "lucide-react";
import { Link, Route, Routes } from "react-router-dom";
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

const invoices = [
  { id: "INV-2026-0148", customer: "Aarav Auto Distributors", total: 182450, status: "Pending Payment", days: 6, billingDate: "2026-05-14" },
  { id: "INV-2026-0147", customer: "Northline Motors", total: 94780, status: "Pending Delivery", days: 13, billingDate: "2026-05-12" },
  { id: "INV-2026-0142", customer: "Mehra Fleet Works", total: 236100, status: "Past Due Date", days: -3, billingDate: "2026-04-28" },
  { id: "INV-2026-0139", customer: "Velocity Parts Co.", total: 68720, status: "Raised Issues", days: 2, billingDate: "2026-05-08" },
];

const products = [
  { pid: "PRD-401", hsn: "8708", name: "Brake caliper assembly", desc: "Front axle compatible, dealership grade", cost: 4200, margin: "22%", shownDiscount: 380, unit: 5005, extraDiscount: 150, qty: 12, gst: 18 },
  { pid: "PRD-226", hsn: "8507", name: "Battery pack 12V", desc: "Sealed maintenance-free unit", cost: 6900, margin: "1400", shownDiscount: 600, unit: 8900, extraDiscount: 250, qty: 8, gst: 28 },
  { pid: "PRD-118", hsn: "4011", name: "Commercial tyre set", desc: "High-load tread, highway use", cost: 11800, margin: "18%", shownDiscount: 900, unit: 14824, extraDiscount: 400, qty: 6, gst: 18 },
];

const paymentLog = [
  { amount: 42000, date: "2026-05-15", mode: "UPI", note: "Advance paid" },
  { amount: 25000, date: "2026-05-18", mode: "Bank transfer", note: "Second partial payment" },
];

const navItems = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Invoices", icon: FileText },
  { name: "Inventory", icon: Box },
  { name: "Customers", icon: Users },
  { name: "AI analytics", icon: Bot },
  { name: "Mail & Contact", icon: Mail },
  { name: "Employees", icon: Building2, separated: true },
  { name: "Settings", icon: Settings },
];

const filters = ["All", "Pending Payment", "Past Due Date", "Pending Delivery", "Raised Issues"];

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainApp />} />
      <Route path="/login" element={<Login />} />
    </Routes>
  );
}

function MainApp() {
  const [activeMenu, setActiveMenu] = useState("Invoices");
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedInvoice, setSelectedInvoice] = useState(invoices[0]);
  const [paymentType, setPaymentType] = useState("Spot");
  const [paymentDone, setPaymentDone] = useState(false);
  const [dialog, setDialog] = useState("");
  const [toast, setToast] = useState("");

  const visibleInvoices = useMemo(() => {
    return activeFilter === "All" ? invoices : invoices.filter((invoice) => invoice.status === activeFilter);
  }, [activeFilter]);

  const rows = products.map((item) => {
    const markedPrice = Math.round((item.unit - item.extraDiscount) * (1 + item.gst / 100));
    return { ...item, markedPrice, total: markedPrice * item.qty };
  });
  const subtotal = rows.reduce((sum, item) => sum + item.unit * item.qty, 0);
  const tax = rows.reduce((sum, item) => sum + (item.unit - item.extraDiscount) * item.qty * (item.gst / 100), 0);
  const freight = 2400;
  const other = 850;
  const rawTotal = subtotal + tax + freight + other;
  const finalTotal = Math.round(rawTotal);
  const roundOff = finalTotal - rawTotal;
  const paid = paymentLog.reduce((sum, item) => sum + item.amount, 0);
  const balance = finalTotal - paid;

  function showToast(message) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  }

  function handleMenuClick(name) {
    setActiveMenu(name);
    if (name !== "Invoices") showToast(`${name} section coming soon`);
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
            <div className="list-tools">
              <div className="search-field"><Search size={16} /><input placeholder="Search invoices" /></div>
              <select aria-label="Sort invoices">
                <option>Sort: Client name</option>
                <option>Sort: Payment value</option>
                <option>Sort: Days remaining</option>
              </select>
            </div>
            <div className="filter-tabs" aria-label="Invoice filters">
              {filters.map((filter) => (
                <button className={activeFilter === filter ? "active" : ""} key={filter} onClick={() => setActiveFilter(filter)} type="button">{filter}</button>
              ))}
            </div>
            <div className="invoice-list">
              {visibleInvoices.map((invoice) => (
                <button className={`invoice-list-item ${selectedInvoice.id === invoice.id ? "active" : ""}`} key={invoice.id} onClick={() => setSelectedInvoice(invoice)} type="button">
                  <span><strong>{invoice.id}</strong><small>{invoice.customer}</small></span>
                  <span className="invoice-item-meta">
                    <b>{formatMoney(invoice.total)}</b>
                    <StatusBadge status={invoice.status} />
                    <DaysBadge days={invoice.days} compact />
                  </span>
                </button>
              ))}
            </div>
            <Button className="add-invoice-button" onClick={() => showToast("Add invoice flow coming soon")}><Plus size={18} />Add Invoice</Button>
          </aside>

          <section className="invoice-detail">
            <CustomerHeader invoice={selectedInvoice} />
            <section className="detail-grid">
              <section className="detail-main">
                <ProductTable rows={rows} onAction={() => setDialog("product")} />
              </section>
              <aside className="detail-side">
                <PaymentCard paymentDone={paymentDone} paymentType={paymentType} setPaymentDone={setPaymentDone} setPaymentType={setPaymentType} days={selectedInvoice.days} onLog={() => setDialog("payment")} />
                <MoneySummary subtotal={subtotal} tax={tax} freight={freight} other={other} roundOff={roundOff} finalTotal={finalTotal} paid={paid} balance={balance} />
                <ActionPanel onDownload={() => showToast("Feature coming soon")} onReminder={() => showToast("Reminder feature coming soon")} onSend={() => setDialog("send")} />
              </aside>
            </section>
          </section>
        </div>
      </section>

      {toast ? <div className="toast">{toast}</div> : null}
      {dialog ? (
        <Dialog title={dialogTitle(dialog)} onClose={() => setDialog("")}>
          {dialog === "payment" ? <PaymentLog finalTotal={finalTotal} paid={paid} balance={balance} /> : null}
          {dialog === "send" ? <SendInvoiceDialog customer={selectedInvoice.customer} /> : null}
          {dialog === "product" ? <ProductEditDialog /> : null}
        </Dialog>
      ) : null}
    </main>
  );
}

function CustomerHeader({ invoice }) {
  return (
    <section className="customer-header">
      <div className="company-avatar">DP</div>
      <div className="customer-copy">
        <p>Company profile</p>
        <h2>Apex Auto Dealership</h2>
        <div className="customer-meta">
          <span>{invoice.customer}</span><span>17 Industrial Estate, Pune</span><span>GSTIN 27AAPCA1849M1Z8</span><span>billing@apexauto.in</span><span>+91 98765 43210</span>
        </div>
      </div>
      <div className="invoice-identity">
        <Label>Invoice number</Label>
        <strong>{invoice.id}</strong>
        <small>Billing date: {invoice.billingDate}</small>
      </div>
    </section>
  );
}

function ProductTable({ rows, onAction }) {
  return (
    <section className="product-card">
      <div className="section-heading">
        <div><p>Product table</p><h3>Line items</h3></div>
        <Button type="button" onClick={onAction}><Plus size={17} />Add Product</Button>
      </div>
      <div className="table-scroll">
        <table>
          <thead><tr>{["PID", "HSN Code", "Name & Description", "Cost Price", "Profit Margin", "Shown Discount", "Unit Price", "Extra Discount", "QTY", "GST %", "Marked Price", "Total Price", "Actions"].map((head) => <th key={head}>{head}</th>)}</tr></thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.pid}>
                <td>{item.pid}</td><td>{item.hsn}</td><td><strong>{item.name}</strong><small>{item.desc}</small></td><td>{formatMoney(item.cost)}</td><td>{item.margin}</td><td>{formatMoney(item.shownDiscount)}</td><td>{formatMoney(item.unit)}</td><td>{formatMoney(item.extraDiscount)}</td><td>{item.qty}</td><td>{item.gst}%</td><td>{formatMoney(item.markedPrice)}</td><td>{formatMoney(item.total)}</td>
                <td><div className="row-actions"><button type="button" onClick={onAction} aria-label="Edit product"><Edit3 size={15} /></button><button type="button" onClick={onAction} aria-label="Delete product"><Trash2 size={15} /></button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <label className="delivered-check"><input type="checkbox" /><span>Delivered</span></label>
    </section>
  );
}

function PaymentCard({ paymentDone, paymentType, setPaymentDone, setPaymentType, days, onLog }) {
  const closureDate = "2026-06-03";
  return (
    <section className="side-card">
      <div className="section-heading compact"><div><p>Payment</p><h3>Terms</h3></div><DaysBadge days={days} /></div>
      <label className="check-row"><input checked={paymentDone} onChange={(event) => setPaymentDone(event.target.checked)} type="checkbox" /><span>Payment done</span></label>
      <div className="segment-control" aria-label="Payment type">
        {["Spot", "EMI", "Pay Later"].map((type) => <button className={paymentType === type ? "active" : ""} key={type} onClick={() => setPaymentType(type)} type="button">{type}</button>)}
      </div>
      {paymentType === "EMI" ? <div className="conditional-grid"><Field label="Interest rate" value="12%" /><Field label="Installments" value="6" /><Field label="Next date" value="2026-06-14" /></div> : null}
      {paymentType === "Pay Later" ? <div className="conditional-grid"><Field label="Penalty rate" value="2.5%" /><Field label="Kicks in after" value={closureDate} /></div> : null}
      <div className="date-grid"><Field label="Billing date" value="2026-05-14" /><Field label="Credit days" value="20" /><div className="readonly-field"><Label>Closure date</Label><strong>{closureDate}</strong></div></div>
      <Button className="secondary-action" onClick={onLog} type="button"><WalletCards size={17} />Show payment log</Button>
      <label className="notes-field"><span>Payment notes</span><textarea defaultValue="Client prefers bank transfer for balance settlement." /></label>
    </section>
  );
}

function MoneySummary({ subtotal, tax, freight, other, roundOff, finalTotal, paid, balance }) {
  return (
    <section className="side-card money-card">
      <div className="section-heading compact"><div><p>Money summary</p><h3>Total</h3></div></div>
      <SummaryRow label="Subtotal" value={formatMoney(subtotal)} /><SummaryRow label="Total tax" value={formatMoney(tax)} /><SummaryRow label="Freight charges" value={formatMoney(freight)} editable /><SummaryRow label="Other charges" value={formatMoney(other)} editable /><SummaryRow label="Round off" value={roundOff.toFixed(2)} />
      <div className="final-total"><span>Final Total</span><strong>{formatMoney(finalTotal)}</strong></div>
      <SummaryRow label="Previously paid" value={formatMoney(paid)} /><SummaryRow label="Balance due" value={formatMoney(balance)} strong />
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

function Dialog({ title, children, onClose }) {
  return <div className="dialog-backdrop" role="dialog" aria-modal="true" aria-label={title}><div className="dialog-card"><div className="dialog-header"><h3>{title}</h3><button onClick={onClose} type="button">Close</button></div>{children}</div></div>;
}

function PaymentLog({ finalTotal, paid, balance }) {
  return <div className="dialog-content"><div className="payment-log-list">{paymentLog.map((item) => <div className="payment-log-item" key={`${item.date}-${item.amount}`}><strong>{formatMoney(item.amount)}</strong><span>{item.date} - {item.mode}</span><small>{item.note}</small></div>)}</div><div className="payment-totals"><SummaryRow label="Final total" value={formatMoney(finalTotal)} /><SummaryRow label="Total paid" value={formatMoney(paid)} /><SummaryRow label="Remaining balance" value={formatMoney(balance)} strong /></div><Button type="button"><Plus size={17} />Log Payment</Button></div>;
}

function SendInvoiceDialog({ customer }) {
  return <div className="dialog-content"><Field label="Recipient" value="billing@client.example" /><Field label="Subject" value={`Invoice for ${customer}`} /><label className="notes-field"><span>Body</span><textarea defaultValue="Hello, please find the invoice attached for your review." /></label><Button type="button"><Send size={17} />Send via Gmail SMTP</Button></div>;
}

function ProductEditDialog() {
  return <div className="dialog-content"><p className="muted-copy">Product picker and row edit actions will connect to inventory later.</p><Button type="button"><Check size={17} />Keep dummy row</Button></div>;
}

function Field({ label, value }) {
  return <label className="mini-field"><span>{label}</span><input defaultValue={value} /></label>;
}

function SummaryRow({ label, value, editable, strong }) {
  return <div className={`summary-row ${strong ? "strong" : ""}`}><span>{label}</span>{editable ? <input defaultValue={value} /> : <strong>{value}</strong>}</div>;
}

function StatusBadge({ status }) {
  return <span className={`status-badge ${status.toLowerCase().replaceAll(" ", "-")}`}>{status}</span>;
}

function DaysBadge({ days, compact }) {
  const tone = days < 0 ? "danger" : days <= 7 ? "warning" : "success";
  return <span className={`days-badge ${tone} ${compact ? "compact" : ""}`}>{days < 0 ? `${Math.abs(days)}d overdue` : `${days}d left`}</span>;
}

function dialogTitle(dialog) {
  if (dialog === "payment") return "Partial Payment Tracker";
  if (dialog === "send") return "Send Invoice";
  return "Product action";
}

function formatMoney(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

function Login() {
  function handleLogin(event) {
    event.preventDefault();
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
              <Button type="button" className="google-button" aria-label="Continue with Google"><GoogleMark />Continue with Google</Button>
              <div className="login-divider"><span>or</span></div>
              <div className="form-field"><Label htmlFor="email">Email</Label><div className="input-wrap"><Mail aria-hidden="true" size={18} /><Input id="email" type="email" placeholder="name@company.com" autoComplete="email" /></div></div>
              <div className="form-field"><div className="field-row"><Label htmlFor="password">Password</Label><a href="/">Forgot password?</a></div><div className="input-wrap"><LockKeyhole aria-hidden="true" size={18} /><Input id="password" type="password" placeholder="Enter password" autoComplete="current-password" /></div></div>
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
