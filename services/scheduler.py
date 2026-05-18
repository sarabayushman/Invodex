from datetime import date, timedelta

from services.email_service import send_gmail
from services.supabase_client import get_supabase


def send_due_reminders(company_id: str) -> list[dict]:
    client = get_supabase()
    settings = client.table("app_settings").select("*").eq("company_id", company_id).limit(1).execute().data
    days = int(settings[0].get("reminder_days_before", 3)) if settings else 3
    limit_date = date.today() + timedelta(days=days)
    invoices = (
        client.table("invoices")
        .select("*, customers(name,email)")
        .eq("company_id", company_id)
        .neq("status", "paid")
        .lte("closure_date", limit_date.isoformat())
        .execute()
        .data
    )
    logs = []
    for invoice in invoices:
        customer = invoice.get("customers") or {}
        if not customer.get("email"):
            continue
        body = (
            f"Dear {customer.get('name')},\n\n"
            f"This is a payment reminder for invoice {invoice['invoice_number']} of INR {invoice['final_total']} "
            f"due on {invoice['closure_date']}.\n\nRegards,\nAccounts Team"
        )
        logs.append(send_gmail(company_id, customer["email"], f"Payment reminder: {invoice['invoice_number']}", body, "reminder", invoice["id"], invoice["customer_id"]))
    return logs

