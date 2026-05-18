import { Box, Mail, ReceiptText, Settings, Sparkles, Users } from "lucide-react";
import { NavLink } from "react-router-dom";

const links = [
  { to: "/invoices", label: "Invoices", icon: ReceiptText },
  { to: "/inventory", label: "Inventory", icon: Box },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/mail", label: "Mail & Contact History", icon: Mail },
  { to: "/analytics", label: "AI Analytics", icon: Sparkles },
];

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-64 flex-col bg-sidebar text-slate-100 max-md:w-20">
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-white text-sidebar font-black">IV</div>
        <div className="font-extrabold max-md:hidden">Invodex</div>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold ${isActive ? "bg-white text-sidebar" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}>
            <Icon size={18} /><span className="max-md:hidden">{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="p-3">
        <NavLink to="/settings" className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold ${isActive ? "bg-white text-sidebar" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}>
          <Settings size={18} /><span className="max-md:hidden">Settings</span>
        </NavLink>
      </div>
    </aside>
  );
}
