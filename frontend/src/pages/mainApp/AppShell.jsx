import { useEffect, useMemo } from "react";
import { Bell, Bot, Box, Building2, FileText, LayoutDashboard, Mail, Settings, Users } from "lucide-react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";

const navItems = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Invoices", path: "/invoices", icon: FileText },
  { name: "Inventory", path: "/inventory", icon: Box },
  { name: "Customers", path: "/customers", icon: Users },
  { name: "AI analytics", path: "/ai-analytics", icon: Bot },
  { name: "Mail & Contact", path: "/mail-contact", icon: Mail },
  { name: "Team", path: "/team", icon: Building2, separated: true },
  { name: "Settings", path: "/settings", icon: Settings },
];

function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const title = useMemo(() => navItems.find((item) => item.path === location.pathname)?.name || "Invodex", [location.pathname]);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted && !data.session?.user) navigate("/login", { replace: true });
    });
    return () => {
      mounted = false;
    };
  }, [navigate]);

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
              <NavLink className={({ isActive }) => `side-nav-item ${isActive ? "active" : ""} ${item.separated ? "separated" : ""}`} key={item.name} to={item.path}>
                <Icon size={18} />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>
      <section className="workspace">
        <header className="app-topbar">
          <div>
            <p>Admin workspace</p>
            <h1>{title}</h1>
          </div>
          <div className="topbar-actions">
            <button type="button" aria-label="Notifications"><Bell size={18} /></button>
            <button className="admin-pill" type="button" onClick={() => window.signout?.()}>Sign out</button>
          </div>
        </header>
        <Outlet />
      </section>
    </main>
  );
}

export default AppShell;
