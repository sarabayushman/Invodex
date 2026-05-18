import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { analyticsApi } from "../api/analytics.api";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { useToast } from "../components/ui/Toast";
import { useAnalytics } from "../hooks/useAnalytics";
import { formatCurrency } from "../utils/formatCurrency";

const colors = ["#2563eb", "#10b981"];

export function AnalyticsPage() {
  const { data, loading, error } = useAnalytics();
  const [chat, setChat] = useState([]);
  const [message, setMessage] = useState("");
  const toast = useToast();
  async function ask(e) {
    e.preventDefault();
    const text = message.trim();
    if (!text) return;
    setChat((prev) => [...prev, { role: "user", text }]);
    setMessage("");
    const answer = await analyticsApi.chat(text);
    setChat((prev) => [...prev, { role: "ai", text: answer.answer }]);
  }
  if (loading) return <p>Loading analytics...</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  const summary = data?.summary || {};
  const charts = data?.charts || {};
  return <div className="space-y-4">
    <div className="grid grid-cols-4 gap-4 max-lg:grid-cols-2 max-sm:grid-cols-1">{[["Revenue MTD", summary.total_revenue_mtd],["Revenue YTD", summary.total_revenue_ytd],["Outstanding", summary.total_outstanding],["Invoices This Month", summary.total_invoices_month]].map(([k, v], i) => <Card key={k}><CardContent><p className="text-sm text-slate-500">{k}</p><p className="mt-2 text-2xl font-extrabold">{i === 3 ? v : formatCurrency(v)}</p></CardContent></Card>)}</div>
    <div className="desktop-grid grid grid-cols-2 gap-4"><Card><CardHeader><h3 className="font-bold">Cost vs Profit</h3></CardHeader><CardContent className="h-72"><ResponsiveContainer><PieChart><Pie data={charts.cost_profit || []} dataKey="value" nameKey="name">{(charts.cost_profit || []).map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}</Pie><Tooltip formatter={(v) => formatCurrency(v)} /></PieChart></ResponsiveContainer></CardContent></Card><Card><CardHeader><h3 className="font-bold">Monthly Profit</h3></CardHeader><CardContent className="h-72"><ResponsiveContainer><LineChart data={charts.monthly_profit || []}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis /><Tooltip formatter={(v) => formatCurrency(v)} /><Line dataKey="profit" stroke="#2563eb" strokeWidth={3} /><Bar dataKey="revenue" fill="#94a3b8" /></LineChart></ResponsiveContainer></CardContent></Card></div>
    <div className="desktop-grid grid grid-cols-2 gap-4"><Card><CardHeader><h3 className="font-bold">Top 10 Loyal Customers</h3></CardHeader><CardContent>{summary.top_customers?.map((c) => <div className="flex justify-between border-b py-2" key={c.name}><span>{c.name}</span><b>{formatCurrency(c.total_value)}</b></div>)}</CardContent></Card><Card><CardHeader><h3 className="font-bold">Top 10 Products</h3></CardHeader><CardContent>{summary.top_products?.map((p) => <div className="flex justify-between border-b py-2" key={p.name}><span>{p.name} ({p.units_sold} units)</span><b>{formatCurrency(p.profit)}</b></div>)}</CardContent></Card></div>
    <Card><CardHeader className="flex items-center justify-between"><h3 className="font-bold">Gemini AI Chatbot</h3><Button variant="secondary" onClick={() => toast("Feature coming soon")}>Download Performance Report</Button></CardHeader><CardContent><div className="mb-3 max-h-80 space-y-2 overflow-y-auto rounded-lg bg-slate-50 p-3">{chat.length === 0 && <p className="text-sm text-slate-500">Ask about revenue, overdue invoices, top products or customer trends.</p>}{chat.map((m, i) => <p key={i} className={`rounded-lg p-3 text-sm ${m.role === "user" ? "ml-auto bg-primary text-white" : "bg-white"}`}>{m.text}</p>)}</div><form onSubmit={ask} className="flex gap-2"><input className="flex-1 rounded-lg border px-3 py-2" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Ask a business question" /><Button>Ask</Button></form></CardContent></Card>
  </div>;
}
