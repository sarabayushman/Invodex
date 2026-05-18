from fastapi import APIRouter, Depends
from fastapi.encoders import jsonable_encoder

from services.auth_service import RequestContext, get_current_context, require_company
from services.schemas import AppSettingsIn, CompanyProfileIn
from services.supabase_client import get_supabase

router = APIRouter(tags=["settings"])


@router.get("/settings/bootstrap")
def bootstrap(ctx: RequestContext = Depends(get_current_context)):
    client = get_supabase()
    company = client.table("company_profile").select("*").eq("owner_user_id", ctx.user_id).limit(1).execute().data
    return {"has_company": bool(company), "company": company[0] if company else None}


@router.post("/settings/onboarding")
def onboarding(payload: CompanyProfileIn, ctx: RequestContext = Depends(get_current_context)):
    client = get_supabase()
    company = client.table("company_profile").insert({**jsonable_encoder(payload), "owner_user_id": ctx.user_id}).execute().data[0]
    client.table("app_settings").insert({"company_id": company["id"]}).execute()
    return {"company": company}


@router.get("/settings")
def get_settings(ctx: RequestContext = Depends(require_company)):
    client = get_supabase()
    company = client.table("company_profile").select("*").eq("id", ctx.company_id).single().execute().data
    settings = client.table("app_settings").select("*").eq("company_id", ctx.company_id).limit(1).execute().data
    if not settings:
        settings = client.table("app_settings").insert({"company_id": ctx.company_id}).execute().data
    return {"company": company, "settings": settings[0]}


@router.put("/settings")
def update_settings(payload: dict, ctx: RequestContext = Depends(require_company)):
    client = get_supabase()
    company_payload = payload.get("company") or {}
    settings_payload = payload.get("settings") or {}
    company = None
    settings = None
    if company_payload:
        company = client.table("company_profile").update(company_payload).eq("id", ctx.company_id).execute().data[0]
    if settings_payload:
        settings = client.table("app_settings").upsert({**settings_payload, "company_id": ctx.company_id}, on_conflict="company_id").execute().data[0]
    return {"company": company, "settings": settings}


@router.put("/settings/company")
def update_company(payload: CompanyProfileIn, ctx: RequestContext = Depends(require_company)):
    return get_supabase().table("company_profile").update(jsonable_encoder(payload)).eq("id", ctx.company_id).execute().data[0]


@router.put("/settings/rules")
def update_rules(payload: AppSettingsIn, ctx: RequestContext = Depends(require_company)):
    return get_supabase().table("app_settings").upsert({**jsonable_encoder(payload), "company_id": ctx.company_id}, on_conflict="company_id").execute().data[0]
