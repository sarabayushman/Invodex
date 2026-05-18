from decimal import Decimal

from services.supabase_client import get_supabase


def lookup_hsn(code: str) -> dict | None:
    data = (
        get_supabase()
        .table("hsn_gst_rates")
        .select("*")
        .eq("hsn_code", code.strip())
        .limit(1)
        .execute()
        .data
    )
    return data[0] if data else None


def remember_hsn(code: str, description: str, gst_percent: Decimal) -> dict:
    payload = {"hsn_code": code.strip(), "description": description, "gst_percent": float(gst_percent)}
    return get_supabase().table("hsn_gst_rates").upsert(payload, on_conflict="hsn_code").execute().data[0]
