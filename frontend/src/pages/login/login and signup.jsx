import { useEffect, useState } from "react";
import { ArrowRight, LockKeyhole, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { getAuthRedirectUrl, supabase, upsertUserProfile } from "../../supabaseClient";

function LoginAndSignup() {
  const navigate = useNavigate();
  const [authError, setAuthError] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function finishLogin(session) {
      if (!session?.user) return;
      const profileResult = await upsertUserProfile(session.user);
      if (profileResult.error) console.warn("Invodex profile save skipped:", profileResult.error.message);
      if (mounted) navigate("/dashboard", { replace: true });
    }

    supabase.auth.getSession().then(({ data, error }) => {
      if (error) setAuthError(error.message);
      else finishLogin(data.session);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "INITIAL_SESSION") finishLogin(session);
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
        queryParams: { access_type: "offline", prompt: "consent" },
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
          <CardHeader><CardTitle>Login and signup</CardTitle><CardDescription>Continue with Google to enter your workspace.</CardDescription></CardHeader>
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
          <CardFooter><p>New to Invodex? Google sign-in creates your account.</p></CardFooter>
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

export default LoginAndSignup;
