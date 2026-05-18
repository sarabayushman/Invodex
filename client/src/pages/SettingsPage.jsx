import { useEffect, useState } from "react";

import { settingsApi } from "../api/settings.api";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { useToast } from "../components/ui/Toast";
import { useSettings } from "../hooks/useSettings";

export function SettingsPage() {
  const { data, loading, error, reload } = useSettings();
  const [company, setCompany] = useState({});
  const [settings, setSettings] = useState({});
  const toast = useToast();
  useEffect(() => { if (data) { setCompany(data.company || {}); setSettings(data.settings || {}); } }, [data]);
  async function save(e) {
    e.preventDefault();
    await settingsApi.update({ company, settings });
    toast("Settings saved");
    reload();
  }
  if (loading) return <p>Loading settings...</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  const companyFields = ["name","logo_url","address","city","state","pincode","gstin","phone","email","bank_name","bank_account","ifsc","upi_id"];
  return <form onSubmit={save} className="space-y-4">
    <Card><CardHeader><h2 className="font-bold">Company Profile</h2></CardHeader><CardContent className="grid grid-cols-2 gap-3 max-md:grid-cols-1">{companyFields.map((key) => <div className={key === "address" ? "field col-span-2 max-md:col-span-1" : "field"} key={key}><label className="capitalize">{key.replaceAll("_", " ")}</label><input value={company[key] || ""} onChange={(e) => setCompany((p) => ({ ...p, [key]: e.target.value }))} /></div>)}</CardContent></Card>
    <div className="desktop-grid grid grid-cols-3 gap-4"><Card><CardHeader><h3 className="font-bold">Gmail SMTP</h3></CardHeader><CardContent className="space-y-3"><div className="field"><label>SMTP email</label><input value={settings.gmail_smtp_user || ""} onChange={(e) => setSettings((p) => ({ ...p, gmail_smtp_user: e.target.value }))} /></div><div className="field"><label>App password</label><input type="password" value={settings.gmail_smtp_password || ""} onChange={(e) => setSettings((p) => ({ ...p, gmail_smtp_password: e.target.value }))} /></div><Button type="button" variant="secondary" onClick={() => toast("Connection will be tested when an email is sent")}>Test Connection</Button></CardContent></Card>
    <Card><CardHeader><h3 className="font-bold">Payment Rules</h3></CardHeader><CardContent className="space-y-3">{["reminder_days_before","emi_interest_rate","pay_later_penalty_rate"].map((key) => <div className="field" key={key}><label className="capitalize">{key.replaceAll("_", " ")}</label><input type="number" value={settings[key] || 0} onChange={(e) => setSettings((p) => ({ ...p, [key]: Number(e.target.value) }))} /></div>)}</CardContent></Card>
    <Card><CardHeader><h3 className="font-bold">Inventory Thresholds</h3></CardHeader><CardContent><div className="field"><label>Low stock alert threshold</label><input type="number" value={settings.low_stock_threshold || 5} onChange={(e) => setSettings((p) => ({ ...p, low_stock_threshold: Number(e.target.value) }))} /></div></CardContent></Card></div>
    <Button>Save Settings</Button>
  </form>;
}
