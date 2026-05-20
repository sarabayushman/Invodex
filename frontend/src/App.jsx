import { ArrowRight, LockKeyhole, Mail } from "lucide-react";
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

function App() {
  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/login" element={<Login />} />
    </Routes>
  );
}

function Welcome() {
  return (
    <main className="welcome-page">
      <section className="welcome-panel" aria-label="Welcome">
        <h1>Welcome user</h1>
        <Link className="button welcome-button" to="/login">
          Login
        </Link>
      </section>
    </main>
  );
}

function Login() {
  function handleLogin(event) {
    event.preventDefault();
  }

  return (
    <main className="login-page">
      <section className="login-shell" aria-label="Invodex sign in">
        <div className="brand-panel">
          <a className="brand-lockup" href="/" aria-label="Invodex home">
            <span className="brand-mark" aria-hidden="true">
              <span />
              <span />
            </span>
            <span>Invodex</span>
          </a>

          <div className="welcome-copy">
            <p>Workspace access</p>
            <h1>Sign in to manage invoices with clarity.</h1>
          </div>
        </div>

        <Card className="login-card">
          <CardHeader>
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>
              Enter your details to continue to your dashboard.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form className="login-form" onSubmit={handleLogin}>
              <Button type="button" className="google-button" aria-label="Continue with Google">
                <svg
                  className="google-mark"
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  focusable="false"
                >
                  <path
                    fill="#4285F4"
                    d="M21.8 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h5.5c-.2 1.3-.9 2.3-2 3v2.7h3.3c1.9-1.8 3-4.4 3-7.7z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 22c2.7 0 5-.9 6.7-2.5l-3.3-2.7c-.9.6-2.1 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3v2.8C4.7 19.8 8.1 22 12 22z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M6.4 13.7c-.2-.6-.3-1.2-.3-1.8s.1-1.2.3-1.8V7.3H3c-.7 1.4-1 2.9-1 4.6s.4 3.2 1 4.6l3.4-2.8z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 6.1c1.5 0 2.8.5 3.8 1.5l2.9-2.9C17 3 14.7 2 12 2 8.1 2 4.7 4.2 3 7.3l3.4 2.8C7.2 7.8 9.4 6.1 12 6.1z"
                  />
                </svg>
                Continue with Google
              </Button>

              <div className="login-divider">
                <span>or</span>
              </div>

              <div className="form-field">
                <Label htmlFor="email">Email</Label>
                <div className="input-wrap">
                  <Mail aria-hidden="true" size={18} />
                  <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  autoComplete="email"
                  defaultValue="demo@invodex.app"
                />
                </div>
              </div>

              <div className="form-field">
                <div className="field-row">
                  <Label htmlFor="password">Password</Label>
                  <a href="/">Forgot password?</a>
                </div>
                <div className="input-wrap">
                  <LockKeyhole aria-hidden="true" size={18} />
                  <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  autoComplete="current-password"
                  defaultValue="password"
                />
                </div>
              </div>

              <Button type="submit" className="submit-button">
                Sign in
                <ArrowRight aria-hidden="true" size={18} />
              </Button>
            </form>
          </CardContent>

          <CardFooter>
            <p>
              New to Invodex? <a href="/">Request access</a>
            </p>
          </CardFooter>
        </Card>
      </section>
    </main>
  );
}

export default App;
