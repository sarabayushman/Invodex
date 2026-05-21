import { bootstrapWorkspace, fetchInvoiceWorkspace, mapCustomerFromDb, mapInvoiceFromDb, mapProductFromDb } from "../../services/invodexData";
import { supabase, upsertUserProfile } from "../../supabaseClient";

export async function loadWorkspace(navigate) {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) return { error: sessionError.message };

  const user = sessionData.session?.user;
  if (!user) {
    navigate("/login", { replace: true });
    return { redirected: true };
  }

  const profileResult = await upsertUserProfile(user);
  if (profileResult.error) return { error: profileResult.error.message };

  const workspaceResult = await bootstrapWorkspace(user);
  if (workspaceResult.error) return { error: workspaceResult.error.message };

  const workspaceData = await fetchInvoiceWorkspace(workspaceResult.orgId);
  if (workspaceData.error) return { error: workspaceData.error.message };

  return {
    orgId: workspaceResult.orgId,
    invoices: workspaceData.data.invoices.map(mapInvoiceFromDb),
    customers: workspaceData.data.customers.map(mapCustomerFromDb).filter(Boolean),
    products: workspaceData.data.products.map(mapProductFromDb).filter(Boolean),
  };
}

export const emptyCustomer = { name: "Unknown customer", contact: "", address: "", gstin: "", email: "", phone: "" };
export const emptyProduct = { pid: "", hsn: "", name: "", desc: "", cost: 0, margin: "", shownDiscount: 0, unit: 0, extraDiscount: 0, qty: 1, gst: 18 };

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function formatMoney(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value || 0));
}
