from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.encoders import jsonable_encoder

from services.auth_service import RequestContext, require_company
from services.invoice_logic import money
from services.schemas import CustomerIn
from services.supabase_client import get_supabase

router = APIRouter(tags=["customers"])


@router.get("/customers")
def list_customers(search: str | None = None, ctx: RequestContext = Depends(require_company)):
    client = get_supabase()
    customers = client.table("customers").select("*").eq("company_id", ctx.company_id).order("created_at", desc=True).execute().data
    invoices = client.table("invoices").select("customer_id,final_total").eq("company_id", ctx.company_id).execute().data
    payments = client.table("payment_history").select("invoice_id,amount_paid").eq("company_id", ctx.company_id).execute().data
    inv_by_id = {i.get("id"): i for i in client.table("invoices").select("id,customer_id").eq("company_id", ctx.company_id).execute().data}
    paid_by_customer = {}
    for payment in payments:
        invoice = inv_by_id.get(payment.get("invoice_id"))
        if invoice:
            paid_by_customer[invoice["customer_id"]] = paid_by_customer.get(invoice["customer_id"], Decimal("0")) + Decimal(str(payment.get("amount_paid") or 0))
    for customer in customers:
        cinv = [i for i in invoices if i.get("customer_id") == customer["id"]]
        total = sum((Decimal(str(i.get("final_total") or 0)) for i in cinv), Decimal("0"))
        customer["total_invoices"] = len(cinv)
        customer["outstanding_balance"] = float(money(total - paid_by_customer.get(customer["id"], Decimal("0"))))
    if search:
        term = search.lower()
        customers = [c for c in customers if term in c.get("name", "").lower() or term in (c.get("gstin") or "").lower() or term in (c.get("city") or "").lower()]
    return customers


@router.post("/customers", status_code=status.HTTP_201_CREATED)
def create_customer(payload: CustomerIn, ctx: RequestContext = Depends(require_company)):
    return get_supabase().table("customers").insert({**jsonable_encoder(payload), "company_id": ctx.company_id}).execute().data[0]


@router.put("/customers/{customer_id}")
def update_customer(customer_id: str, payload: CustomerIn, ctx: RequestContext = Depends(require_company)):
    data = get_supabase().table("customers").update(jsonable_encoder(payload)).eq("id", customer_id).eq("company_id", ctx.company_id).execute().data
    if not data:
        raise HTTPException(status_code=404, detail="Customer not found.")
    return data[0]


@router.delete("/customers/{customer_id}")
def delete_customer(customer_id: str, ctx: RequestContext = Depends(require_company)):
    get_supabase().table("customers").delete().eq("id", customer_id).eq("company_id", ctx.company_id).execute()
    return {"deleted": True}


@router.get("/customers/{customer_id}/invoices")
def customer_invoices(customer_id: str, ctx: RequestContext = Depends(require_company)):
    return get_supabase().table("invoices").select("*, customers(*)").eq("company_id", ctx.company_id).eq("customer_id", customer_id).order("billing_date", desc=True).execute().data


@router.get("/customers/{customer_id}/outstanding")
def customer_outstanding(customer_id: str, ctx: RequestContext = Depends(require_company)):
    client = get_supabase()
    invoices = client.table("invoices").select("id,final_total").eq("company_id", ctx.company_id).eq("customer_id", customer_id).execute().data
    ids = [i["id"] for i in invoices]
    paid = Decimal("0")
    if ids:
        payments = client.table("payment_history").select("amount_paid").eq("company_id", ctx.company_id).in_("invoice_id", ids).execute().data
        paid = sum((Decimal(str(p.get("amount_paid") or 0)) for p in payments), Decimal("0"))
    total = sum((Decimal(str(i.get("final_total") or 0)) for i in invoices), Decimal("0"))
    return {"total_invoiced": float(money(total)), "total_paid": float(money(paid)), "total_outstanding": float(money(total - paid))}
