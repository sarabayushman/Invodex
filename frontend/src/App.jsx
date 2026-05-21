import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import Landing from "./pages/landing.jsx";
import LoginAndSignup from "./pages/login/login and signup.jsx";
import AppShell from "./pages/mainApp/AppShell.jsx";
import BlankMenuPage from "./pages/mainApp/BlankMenuPage.jsx";
import Customers from "./pages/mainApp/customers.jsx";
import Dashboard from "./pages/mainApp/dashboard.jsx";
import Inventory from "./pages/mainApp/inventory.jsx";
import Invoices from "./pages/mainApp/invoices.jsx";
import Settings from "./pages/mainApp/settings.jsx";
import { supabase } from "./supabaseClient";

function App() {
  useEffect(() => {
    window.signout = async function signout() {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Invodex sign out failed:", error.message);
        return;
      }

      window.location.assign("/login");
    };

    return () => {
      delete window.signout;
    };
  }, []);

  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/landing" element={<Landing />} />
      <Route path="/login" element={<LoginAndSignup />} />
      <Route element={<AppShell />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/invoices" element={<Invoices />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/ai-analytics" element={<BlankMenuPage title="AI analytics" />} />
        <Route path="/mail-contact" element={<BlankMenuPage title="Mail & Contact" />} />
        <Route path="/team" element={<BlankMenuPage title="Team" />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function HomeRedirect() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      navigate(data.session?.user ? "/dashboard" : "/landing", { replace: true });
      setChecking(false);
    });

    return () => {
      mounted = false;
    };
  }, [navigate]);

  if (checking) return <main className="landing-page"><p>landing page</p></main>;
  return null;
}

export default App;
