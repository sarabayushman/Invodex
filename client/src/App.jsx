import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { settingsApi } from "./api/settings.api";
import { supabase } from "./api/supabase";
import { Layout } from "./components/layout/Layout";
import { ToastProvider } from "./components/ui/Toast";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { CustomerDetailPage } from "./pages/CustomerDetailPage";
import { CustomersPage } from "./pages/CustomersPage";
import { InventoryPage } from "./pages/InventoryPage";
import { InvoicesPage } from "./pages/InvoicesPage";
import { LoginPage } from "./pages/LoginPage";
import { MailHistoryPage } from "./pages/MailHistoryPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { SettingsPage } from "./pages/SettingsPage";

export default function App() {
  const [session, setSession] = useState(null);
  const [boot, setBoot] = useState({ loading: true, hasCompany: false });

  async function refreshBootstrap(activeSession = session) {
    if (!activeSession) {
      setBoot({ loading: false, hasCompany: false });
      return;
    }
    try {
      const data = await settingsApi.bootstrap();
      setBoot({ loading: false, hasCompany: data.has_company });
    } catch {
      setBoot({ loading: false, hasCompany: false });
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      refreshBootstrap(data.session);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      refreshBootstrap(nextSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <ToastProvider>
      {!session ? <LoginPage /> : boot.loading ? (
        <main className="grid min-h-screen place-items-center bg-slate-100 font-bold text-slate-600">Preparing Invodex...</main>
      ) : !boot.hasCompany ? (
        <OnboardingPage onDone={() => refreshBootstrap(session)} />
      ) : (
        <Layout user={session.user}>
          <Routes>
            <Route path="/" element={<Navigate to="/invoices" replace />} />
            <Route path="/invoices" element={<InvoicesPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/customers/:id" element={<CustomerDetailPage />} />
            <Route path="/mail" element={<MailHistoryPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/invoices" replace />} />
          </Routes>
        </Layout>
      )}
    </ToastProvider>
  );
}
