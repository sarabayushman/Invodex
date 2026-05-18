from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.encoders import jsonable_encoder

from services.auth_service import RequestContext, require_company
from services.hsn_service import lookup_hsn, remember_hsn
from services.invoice_logic import money
from services.schemas import HsnCreate, ProductIn
from services.supabase_client import get_supabase

router = APIRouter(tags=["inventory"])


@router.get("/products")
def list_products(search: str | None = None, ctx: RequestContext = Depends(require_company)):
    query = get_supabase().table("products").select("*").eq("company_id", ctx.company_id).order("created_at", desc=True)
    data = query.execute().data
    if search:
        term = search.lower()
        data = [p for p in data if term in p.get("name", "").lower() or term in p.get("pid", "").lower() or term in p.get("hsn_code", "").lower()]
    return data


@router.post("/products", status_code=status.HTTP_201_CREATED)
def create_product(payload: ProductIn, ctx: RequestContext = Depends(require_company)):
    row = jsonable_encoder(payload)
    row["company_id"] = ctx.company_id
    return get_supabase().table("products").insert(row).execute().data[0]


@router.put("/products/{product_id}")
def update_product(product_id: str, payload: ProductIn, ctx: RequestContext = Depends(require_company)):
    row = jsonable_encoder(payload)
    data = get_supabase().table("products").update(row).eq("id", product_id).eq("company_id", ctx.company_id).execute().data
    if not data:
        raise HTTPException(status_code=404, detail="Product not found.")
    return data[0]


@router.delete("/products/{product_id}")
def delete_product(product_id: str, ctx: RequestContext = Depends(require_company)):
    get_supabase().table("products").delete().eq("id", product_id).eq("company_id", ctx.company_id).execute()
    return {"deleted": True}


@router.get("/hsn-lookup")
def hsn_lookup(code: str = Query(..., min_length=2)):
    match = lookup_hsn(code)
    if not match:
        raise HTTPException(status_code=404, detail="HSN code not found.")
    return match


@router.post("/hsn-lookup")
def save_hsn(payload: HsnCreate):
    return remember_hsn(payload.hsn_code, payload.description, payload.gst_percent)
