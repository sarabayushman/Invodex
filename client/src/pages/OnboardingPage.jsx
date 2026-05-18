import { useState } from "react";

import { settingsApi } from "../api/settings.api";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { useToast } from "../components/ui/Toast";

const initial = { name: "", address: "", city: "", state: "", pincode: "", gstin: "", email: "", phone: "", bank_name: "", bank_account: "", ifsc: "", upi_id: "" };

export function OnboardingPage({ onDone }) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await settingsApi.onboard(form);
      toast("Company profile created");
      onDone();
    } catch (err) {
      toast(err.response?.data?.detail || "Onboarding failed", "error");
    } finally {
      setSaving(false);
    }
  }
  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <Card className="mx-auto max-w-4xl">
        <CardHeader><h1 className="text-xl font-extrabold">Set up your company profile</h1></CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
            {Object.keys(initial).map((key) => (
              <div className={key === "address" ? "field col-span-2 max-md:col-span-1" : "field"} key={key}>
                <label className="capitalize">{key.replaceAll("_", " ")}</label>
                <input required={["name", "address", "city", "state", "pincode"].includes(key)} value={form[key]} onChange={(e) => update(key, e.target.value)} />
              </div>
            ))}
            <div className="col-span-2 flex justify-end max-md:col-span-1"><Button disabled={saving}>{saving ? "Saving..." : "Enter dashboard"}</Button></div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
