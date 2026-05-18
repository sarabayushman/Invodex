from datetime import date, timedelta
from decimal import Decimal, ROUND_HALF_UP


TWOPLACES = Decimal("0.01")


def money(value: Decimal | int | float | str) -> Decimal:
    return Decimal(str(value or 0)).quantize(TWOPLACES, rounding=ROUND_HALF_UP)


def financial_year_for(day: date) -> int:
    return day.year if day.month >= 4 else day.year - 1


def closure_date(billing_date: date, credit_days: int) -> date:
    return billing_date + timedelta(days=credit_days)


def item_totals(item: dict) -> dict:
    cost = money(item["cost_price"])
    profit = money(item["profit_margin"])
    discount = Decimal(str(item.get("discount_percent") or 0))
    quantity = int(item["quantity"])
    gst_percent = Decimal(str(item["gst_percent"]))
    marked = money(cost + profit)
    unit_price = money(marked * (Decimal("1") - discount / Decimal("100")))
    total_price = money(unit_price * quantity)
    tax_amount = money(total_price * gst_percent / Decimal("100"))
    return {
        "marked_price": marked,
        "unit_price": unit_price,
        "total_price": total_price,
        "tax_amount": tax_amount,
    }


def invoice_totals(items: list[dict], freight: Decimal, other: Decimal) -> dict:
    subtotal = money(sum((money(i["total_price"]) for i in items), Decimal("0")))
    tax_total = money(sum((money(i["tax_amount"]) for i in items), Decimal("0")))
    gross = money(subtotal + tax_total + money(freight) + money(other))
    nearest_rupee = gross.quantize(Decimal("1"), rounding=ROUND_HALF_UP)
    round_off = money(nearest_rupee - gross)
    return {
        "subtotal": subtotal,
        "tax_total": tax_total,
        "round_off": round_off,
        "final_total": money(gross + round_off),
    }


def status_for(final_total: Decimal, paid: Decimal, due_on: date, delivered: bool, issue: bool = False) -> str:
    if issue:
        return "issue_raised"
    if money(paid) >= money(final_total):
        return "paid"
    if not delivered:
        return "pending_delivery"
    if date.today() > due_on:
        return "overdue"
    return "pending"


def emi_total(principal: Decimal, monthly_rate_percent: Decimal, months: int) -> Decimal:
    amount = money(principal)
    rate = Decimal(str(monthly_rate_percent)) / Decimal("100")
    for _ in range(max(months, 0)):
        amount = money(amount * (Decimal("1") + rate))
    return amount


def pay_later_penalty(total: Decimal, monthly_rate_percent: Decimal, overdue_days: int) -> Decimal:
    if overdue_days <= 0:
        return Decimal("0.00")
    months = Decimal(overdue_days) / Decimal("30")
    return money(money(total) * Decimal(str(monthly_rate_percent)) / Decimal("100") * months)

