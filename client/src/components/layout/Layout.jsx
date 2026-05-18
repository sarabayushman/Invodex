import { useLocation } from "react-router-dom";

import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

const titles = {
  "/invoices": "Invoices",
  "/inventory": "Inventory",
  "/customers": "Customers",
  "/mail": "Mail & Contact History",
  "/analytics": "AI Analytics",
  "/settings": "Settings",
};

export function Layout({ children, user }) {
  const location = useLocation();
  const title = titles[location.pathname] || (location.pathname.startsWith("/customers/") ? "Customer Detail" : "Invodex");
  return (
    <div>
      <Sidebar />
      <main className="min-h-screen pl-64 max-md:pl-20">
        <TopBar title={title} user={user} />
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
