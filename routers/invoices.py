from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.encoders import jsonable_encoder

from services.auth_service import RequestContext, require_company
from services.email_service import send_gmail
from services.hsn_service import remember_hsn
from services.invoice_logic import closure_date, financial_year_for, invoice_totals, item_totals, money, status_for
from services.pdf_service import invoice_pdf_placeholder
from services.schemas import InvoiceIn, PaymentIn, SendEmailIn
from services.supabase_client import get_supabase

router = APIRouter(tags=["invoices"])


def _next_invoice_number(company_id: str, billing_date: date) -> str:
    fy = financial_year_for(billing_date)
    start = f"{fy}-04-01"
    end = f"{fy + 1}-03-31"
    rows = (
        get_supabase()
        .table("invoices")
        .select("invoice_number")
        .eq("company_id", company_id)
        .gte("billing_date", start)
        .lte("billing_date", end)
        .execute()
        .data
    )
    return f"{len(rows) + 1:04d}/{fy}"


def _paid_for_invoice(invoice_id: str, company_id: str) -> Decimal:
    payments = get_supabase().table("payment_history").select("amount_paid").eq("company_id", company_id).eq("invoice_id", invoice_id).execute().data
    return sum((Decimal(str(p.get("amount_paid") or 0)) for p in payments), Decimal("0"))


@router.get("/invoices")
def list_invoices(filter: str = "all", ctx: RequestContext = Depends(require_company)):
    query = get_supabase().table("invoices").select("*, customers(name,email,gstin,phone,address,city,state,pincode)").eq("company_id", ctx.company_id).order("created_at", desc=True)
    if filter != "all":
        query = query.eq("status", filter)
    return query.execute().data


@router.get("/invoices/{invoice_id}")
def get_invoice(invoice_id: str, ctx: RequestContext = Depends(require_company)):
    client = get_supabase()
    data = client.table("invoices").select("*, customers(*), company_profile(*)").eq("id", invoice_id).eq("company_id", ctx.company_id).limit(1).execute().data
    if not data:
        raise HTTPException(status_code=404, detail="Invoice not found.")
    invoice = data[0]
    invoice["items"] = client.table("invoice_items").select("*").eq("invoice_id", invoice_id).eq("company_id", ctx.company_id).execute().data
    invoice["payments"] = client.table("payment_history").select("*").eq("invoice_id", invoice_id).eq("company_id", ctx.company_id).order("payment_date", desc=True).execute().data
    invoice["previously_paid"] = float(money(sum((Decimal(str(p["amount_paid"])) for p in invoice["payments"]), Decimal("0"))))
    invoice["balance_due"] = float(money(Decimal(str(invoice["final_total"])) - Decimal(str(invoice["previously_paid"]))))
    return invoice


@router.post("/invoices", status_code=status.HTTP_201_CREATED)
def create_invoice(payload: InvoiceIn, ctx: RequestContext = Depends(require_company)):
    client = get_supabase()
    customer = client.table("customers").select("*").eq("id", payload.customer_id).eq("company_id", ctx.company_id).limit(1).execute().data
    if not customer:
        raise HTTPException(status_code=400, detail="Customer not found.")
    items = []
    for item in payload.items:
        row = jsonable_encoder(item)
        row.update(item_totals(row))
        row["company_id"] = ctx.company_id
        items.append(row)
        remember_hsn(row["hsn_code"], row["name"], row["gst_percent"])
    totals = invoice_totals(items, payload.freight_charges, payload.other_charges)
    due_on = closure_date(payload.billing_date, payload.credit_days)
    paid = totals["final_total"] if payload.payment_done else Decimal("0")
    status_value = payload.status or status_for(totals["final_total"], paid, due_on, payload.is_delivered)
    invoice_row = {
        **jsonable_encoder(payload, exclude={"items"}),
        "company_id": ctx.company_id,
        "invoice_number": _next_invoice_number(ctx.company_id, payload.billing_date),
        **totals,
        "status": status_value,
    }
    invoice_row = jsonable_encoder(invoice_row)
    invoice_row["closure_date"] = None
    invoice_row.pop("closure_date", None)
    invoice = client.table("invoices").insert(invoice_row).execute().data[0]
    for item in items:
        item["invoice_id"] = invoice["id"]
    client.table("invoice_items").insert(jsonable_encoder(items)).execute()
    client.table("customers").update({"loyalty_score": int(customer[0].get("loyalty_score") or 0) + 1}).eq("id", payload.customer_id).execute()
    return get_invoice(invoice["id"], ctx)


@router.put("/invoices/{invoice_id}")
def update_invoice(invoice_id: str, payload: InvoiceIn, ctx: RequestContext = Depends(require_company)):
    client = get_supabase()
    current = client.table("invoices").select("*").eq("id", invoice_id).eq("company_id", ctx.company_id).limit(1).execute().data
    if not current:
        raise HTTPException(status_code=404, detail="Invoice not found.")
    client.table("invoice_items").delete().eq("invoice_id", invoice_id).eq("company_id", ctx.company_id).execute()
    items = []
    for item in payload.items:
        row = jsonable_encoder(item)
        row.update(item_totals(row))
        row["company_id"] = ctx.company_id
        row["invoice_id"] = invoice_id
        items.append(row)
    totals = invoice_totals(items, payload.freight_charges, payload.other_charges)
    paid = _paid_for_invoice(invoice_id, ctx.company_id)
    due_on = closure_date(payload.billing_date, payload.credit_days)
    row = {**jsonable_encoder(payload, exclude={"items"}), **totals}
    row["status"] = payload.status or status_for(totals["final_total"], paid, due_on, payload.is_delivered)
    row = jsonable_encoder(row)
    client.table("invoices").update(row).eq("id", invoice_id).eq("company_id", ctx.company_id).execute()
    client.table("invoice_items").insert(jsonable_encoder(items)).execute()
    return get_invoice(invoice_id, ctx)


@router.delete("/invoices/{invoice_id}")
def delete_invoice(invoice_id: str, ctx: RequestContext = Depends(require_company)):
    get_supabase().table("invoices").delete().eq("id", invoice_id).eq("company_id", ctx.company_id).execute()
    return {"deleted": True}


@router.post("/invoices/{invoice_id}/send-email")
def send_invoice_email(invoice_id: str, payload: SendEmailIn, ctx: RequestContext = Depends(require_company)):
    invoice = get_invoice(invoice_id, ctx)
    return send_gmail(ctx.company_id, str(payload.recipient_email), payload.subject, payload.body, "invoice", invoice_id, invoice["customer_id"])


@router.get("/invoices/{invoice_id}/download-pdf")
def download_pdf(invoice_id: str, ctx: RequestContext = Depends(require_company)):
    return invoice_pdf_placeholder(invoice_id)


@router.post("/invoices/{invoice_id}/payment")
def log_payment(invoice_id: str, payload: PaymentIn, ctx: RequestContext = Depends(require_company)):
    client = get_supabase()
    invoice = client.table("invoices").select("*").eq("id", invoice_id).eq("company_id", ctx.company_id).limit(1).execute().data
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found.")
    saved = client.table("payment_history").insert({**jsonable_encoder(payload), "invoice_id": invoice_id, "company_id": ctx.company_id}).execute().data[0]
    paid = _paid_for_invoice(invoice_id, ctx.company_id)
    inv = invoice[0]
    new_status = status_for(Decimal(str(inv["final_total"])), paid, date.fromisoformat(inv["closure_date"]), inv.get("is_delivered", False))
    client.table("invoices").update({"payment_done": new_status == "paid", "status": new_status}).eq("id", invoice_id).execute()
    return saved


@router.get("/invoices/{invoice_id}/payment-history")
def payment_history(invoice_id: str, ctx: RequestContext = Depends(require_company)):
    return get_supabase().table("payment_history").select("*").eq("invoice_id", invoice_id).eq("company_id", ctx.company_id).order("payment_date", desc=True).execute().data
