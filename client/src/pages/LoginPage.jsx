import { useState } from "react";

import { supabase } from "../api/supabase";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function signIn(mode) {
    setError("");
    const result = mode === "google"
      ? await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } })
      : await supabase.auth.signInWithPassword({ email, password });
    if (result.error) setError(result.error.message);
  }

  async function signUp() {
    setError("");
    const { error: signUpError } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
    if (signUpError) setError(signUpError.message);
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="space-y-4 p-6">
          <div>
            <div className="mb-3 grid h-11 w-11 place-items-center rounded-lg bg-sidebar text-white font-black">IV</div>
            <h1 className="text-2xl font-extrabold">Invodex</h1>
            <p className="text-sm text-slate-500">Sign in to manage GST invoices, inventory and payments.</p>
          </div>
          {error && <p className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
          <div className="field"><label>Email</label><input value={email} onChange={(e) => setEmail(e.target.value)} type="email" /></div>
          <div className="field"><label>Password</label><input value={password} onChange={(e) => setPassword(e.target.value)} type="password" /></div>
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={() => signIn("email")}>Sign in</Button>
            <Button variant="secondary" onClick={signUp}>Create account</Button>
          </div>
          <Button className="w-full" variant="secondary" onClick={() => signIn("google")}>Continue with Google</Button>
        </CardContent>
      </Card>
    </main>
  );
}
