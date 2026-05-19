import { useEffect, useState } from "react";
import { Link, NavLink, Route, Routes } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  Bell,
  CheckCircle2,
  FileText,
  LayoutDashboard,
  PackageCheck,
  Send,
  Sparkles,
} from "lucide-react";
import { getSummary, sendContactMessage } from "./api";

const fallbackSummary = {
  metrics: [
    { label: "Monthly revenue", value: "₹8.4L", trend: "+18%" },
    { label: "Open invoices", value: "37", trend: "-9%" },
    { label: "Inventory alerts", value: "12", trend: "+3" },
  ],
  activity: [
    {
      title: "Invoice INV-2048 generated",
      detail: "Sent to Aster Retail with GST details attached.",
      time: "Today, 10:45 AM",
    },
    {
      title: "Payment reminder queued",
      detail: "Follow-up scheduled for overdue invoices.",
      time: "Today, 9:20 AM",
    },
  ],
};

function App() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" to="/">
          <span className="brand-mark">I</span>
          <span>Invodex</span>
        </Link>
        <nav className="nav-links" aria-label="Primary navigation">
          <NavLink to="/">Home</NavLink>
          <NavLink to="/dashboard">Dashboard</NavLink>
        </nav>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </main>
    </div>
  );
}

function Home() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [status, setStatus] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus("Sending...");

    try {
      const result = await sendContactMessage(form);
      setStatus(result.reply);
      setForm({ name: "", email: "", message: "" });
    } catch {
      setStatus("Backend unavailable locally. Add VITE_API_BASE_URL or deploy to Vercel.");
    }
  }

  return (
    <section className="home-grid">
      <div className="hero-copy">
        <span className="eyebrow">
          <Sparkles size={16} />
          Sample full-stack app
        </span>
        <h1>Invodex</h1>
        <p>
          A deployable React and FastAPI starter for invoices, inventory alerts,
          and sales visibility.
        </p>
        <div className="hero-actions">
          <Link className="primary-button" to="/dashboard">
            Open dashboard
            <ArrowRight size={18} />
          </Link>
          <a className="secondary-button" href="/api/health">
            Check API
          </a>
        </div>
      </div>

      <form className="contact-panel" onSubmit={handleSubmit}>
        <h2>Quick enquiry</h2>
        <label>
          Name
          <input
            required
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            placeholder="Your name"
          />
        </label>
        <label>
          Email
          <input
            required
            type="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            placeholder="you@example.com"
          />
        </label>
        <label>
          Message
          <textarea
            required
            value={form.message}
            onChange={(event) => setForm({ ...form, message: event.target.value })}
            placeholder="Tell us what you want to automate"
          />
        </label>
        <button type="submit">
          <Send size={18} />
          Send
        </button>
        {status ? <p className="form-status">{status}</p> : null}
      </form>
    </section>
  );
}

function Dashboard() {
  const [summary, setSummary] = useState(fallbackSummary);
  const [state, setState] = useState("loading");

  useEffect(() => {
    getSummary()
      .then((data) => {
        setSummary(data);
        setState("ready");
      })
      .catch(() => setState("offline"));
  }, []);

  return (
    <section className="dashboard">
      <div className="page-heading">
        <span className="eyebrow">
          <LayoutDashboard size={16} />
          Dashboard
        </span>
        <h1>Sales command center</h1>
        <p>
          Live sample data comes from FastAPI. If the backend is offline, the UI
          keeps a local preview visible.
        </p>
      </div>

      <div className="status-line">
        <CheckCircle2 size={18} />
        {state === "ready" && "Connected to FastAPI"}
        {state === "loading" && "Loading FastAPI data"}
        {state === "offline" && "Showing preview data"}
      </div>

      <div className="metric-grid">
        {summary.metrics.map((metric) => (
          <article className="metric-card" key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <small>{metric.trend}</small>
          </article>
        ))}
      </div>

      <div className="workbench">
        <section className="activity-list">
          <h2>Recent activity</h2>
          {summary.activity.map((item) => (
            <article className="activity-item" key={`${item.title}-${item.time}`}>
              <FileText size={18} />
              <div>
                <h3>{item.title}</h3>
                <p>{item.detail}</p>
                <span>{item.time}</span>
              </div>
            </article>
          ))}
        </section>

        <section className="tool-list">
          <h2>Operations</h2>
          <button>
            <PackageCheck size={18} />
            Sync inventory
          </button>
          <button>
            <Bell size={18} />
            Queue reminders
          </button>
          <button>
            <BarChart3 size={18} />
            Export report
          </button>
        </section>
      </div>
    </section>
  );
}

export default App;
