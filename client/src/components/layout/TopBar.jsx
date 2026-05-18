import { LogOut, UserCircle } from "lucide-react";

import { supabase } from "../../api/supabase";
import { Button } from "../ui/Button";

export function TopBar({ title, user }) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div>
        <h1 className="text-xl font-extrabold">{title}</h1>
        <p className="text-xs text-slate-500">GST sales, payments and analytics</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-bold">{user?.email || "Admin"}</p>
          <p className="text-xs text-slate-500">Business account</p>
        </div>
        <UserCircle className="text-slate-500" />
        <Button variant="ghost" className="h-9 w-9 p-0" onClick={() => supabase.auth.signOut()} title="Sign out"><LogOut size={17} /></Button>
      </div>
    </header>
  );
}
