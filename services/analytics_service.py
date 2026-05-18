from collections import defaultdict
from datetime import date
from decimal import Decimal

from services.invoice_logic import money
from services.supabase_client import get_supabase


def analytics_summary(company_id: str) -> dict:
    client = get_supabase()
    invoices = client.table("invoices").select("*, customers(name)").eq("company_id", company_id).execute().data
    items = client.table("invoice_items").select("*").eq("company_id", company_id).execute().data
    customers = client.table("customers").select("*").eq("company_id", company_id).execute().data
    payments = client.table("payment_history").select("*").eq("company_id", company_id).execute().data

    today = date.today()
    total_paid = sum((Decimal(str(p.get("amount_paid") or 0)) for p in payments), Decimal("0"))
    final_total = sum((Decimal(str(i.get("final_total") or 0)) for i in invoices), Decimal("0"))
    month_revenue = sum(
        Decimal(str(i.get("final_total") or 0))
        for i in invoices
        if str(i.get("billing_date", "")).startswith(f"{today.year}-{today.month:02d}")
    )
    ytd_revenue = sum(
        Decimal(str(i.get("final_total") or 0))
        for i in invoices
        if str(i.get("billing_date", "")).startswith(str(today.year))
    )

    top_customers = []
    by_customer = defaultdict(lambda: {"invoice_count": 0, "total_value": Decimal("0")})
    for invoice in invoices:
        cid = invoice.get("customer_id")
        by_customer[cid]["invoice_count"] += 1
        by_customer[cid]["total_value"] += Decimal(str(invoice.get("final_total") or 0))
    customer_names = {c["id"]: c["name"] for c in customers}
    for cid, stats in by_customer.items():
        top_customers.append({"name": customer_names.get(cid, "Unknown customer"), "invoice_count": stats["invoice_count"], "total_value": float(money(stats["total_value"]))})

    by_product = defaultdict(lambda: {"units_sold": 0, "profit": Decimal("0"), "profit_margin": Decimal("0")})
    for item in items:
        key = item.get("pid") or item.get("name")
        qty = int(item.get("quantity") or 0)
        by_product[key]["name"] = item.get("name")
        by_product[key]["units_sold"] += qty
        by_product[key]["profit"] += Decimal(str(item.get("profit_margin") or 0)) * qty
        by_product[key]["profit_margin"] = Decimal(str(item.get("profit_margin") or 0))
    top_products = sorted(by_product.values(), key=lambda p: (p["units_sold"], p["profit"]), reverse=True)[:10]

    return {
        "total_revenue_mtd": float(money(month_revenue)),
        "total_revenue_ytd": float(money(ytd_revenue)),
        "total_outstanding": float(money(final_total - total_paid)),
        "total_invoices_month": sum(1 for i in invoices if str(i.get("billing_date", "")).startswith(f"{today.year}-{today.month:02d}")),
        "invoice_count": len(invoices),
        "customer_count": len(customers),
        "top_customers": sorted(top_customers, key=lambda c: c["total_value"], reverse=True)[:10],
        "top_products": [{**p, "profit": float(money(p["profit"])), "profit_margin": float(money(p["profit_margin"]))} for p in top_products],
    }


def chart_data(company_id: str) -> dict:
    client = get_supabase()
    invoices = client.table("invoices").select("*").eq("company_id", company_id).execute().data
    items = client.table("invoice_items").select("*").eq("company_id", company_id).execute().data
    monthly = defaultdict(lambda: {"revenue": Decimal("0"), "profit": Decimal("0")})
    for invoice in invoices:
        key = str(invoice.get("billing_date", ""))[:7] or "unknown"
        monthly[key]["revenue"] += Decimal(str(invoice.get("final_total") or 0))
    cost = sum((Decimal(str(i.get("cost_price") or 0)) * int(i.get("quantity") or 0) for i in items), Decimal("0"))
    profit = sum((Decimal(str(i.get("profit_margin") or 0)) * int(i.get("quantity") or 0) for i in items), Decimal("0"))
    for item in items:
        key = str(item.get("created_at", ""))[:7] or "unknown"
        monthly[key]["profit"] += Decimal(str(item.get("profit_margin") or 0)) * int(item.get("quantity") or 0)
    return {
        "cost_profit": [{"name": "Cost", "value": float(money(cost))}, {"name": "Profit", "value": float(money(profit))}],
        "monthly_profit": [{"month": k, "profit": float(money(v["profit"])), "revenue": float(money(v["revenue"]))} for k, v in sorted(monthly.items())[-12:]],
    }

