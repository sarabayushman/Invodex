from fastapi import APIRouter, Depends

from services.auth_service import RequestContext, require_company
from services.email_service import send_gmail
from services.schemas import ReminderRequest
from services.scheduler import send_due_reminders
from services.supabase_client import get_supabase

router = APIRouter(tags=["mail"])


@router.get("/mail-logs")
def mail_logs(type: str | None = None, ctx: RequestContext = Depends(require_company)):
    query = get_supabase().table("mail_logs").select("*, invoices(invoice_number), customers(name)").eq("company_id", ctx.company_id).order("sent_at", desc=True)
    if type:
        query = query.eq("type", type)
    return query.execute().data


@router.post("/mail/send-reminder/{invoice_id}")
def manual_reminder(invoice_id: str, payload: ReminderRequest | None = None, ctx: RequestContext = Depends(require_company)):
    client = get_supabase()
    invoice = client.table("invoices").select("*, customers(name,email)").eq("id", invoice_id).eq("company_id", ctx.company_id).limit(1).execute().data[0]
    customer = invoice.get("customers") or {}
    subject = payload.subject if payload and payload.subject else f"Payment reminder: {invoice['invoice_number']}"
    body = payload.body if payload and payload.body else (
        f"Dear {customer.get('name')},\n\nPlease clear the balance for invoice {invoice['invoice_number']} "
        f"of INR {invoice['final_total']} due on {invoice['closure_date']}.\n\nRegards,\nAccounts Team"
    )
    return send_gmail(ctx.company_id, customer.get("email") or "", subject, body, "reminder", invoice_id, invoice["customer_id"])


@router.post("/mail/send-due-reminders")
def send_due(ctx: RequestContext = Depends(require_company)):
    return send_due_reminders(ctx.company_id)
