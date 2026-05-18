from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


PaymentType = Literal["spot", "emi", "pay_later"]
InvoiceStatus = Literal["pending", "paid", "overdue", "pending_delivery", "issue_raised"]
MailType = Literal["invoice", "reminder", "custom"]


class CamelModel(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class CompanyProfileIn(CamelModel):
    name: str
    logo_url: str | None = None
    address: str
    city: str
    state: str
    pincode: str
    gstin: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    bank_name: str | None = None
    bank_account: str | None = None
    ifsc: str | None = None
    upi_id: str | None = None


class CustomerIn(CamelModel):
    name: str
    address: str | None = None
    city: str | None = None
    state: str | None = None
    pincode: str | None = None
    gstin: str | None = None
    email: EmailStr | None = None
    phone: str | None = None


class ProductIn(CamelModel):
    pid: str
    hsn_code: str
    name: str
    description: str | None = None
    upgrades: str | None = None
    cost_price: Decimal = Field(ge=0)
    profit_margin: Decimal = Field(ge=0)
    gst_percent: Decimal = Field(ge=0, le=28)
    stock_total: int = Field(ge=0)
    stock_unbooked: int = Field(ge=0)
    stock_not_shipped: int = Field(ge=0)


class InvoiceItemIn(CamelModel):
    product_id: str | None = None
    pid: str
    hsn_code: str
    name: str
    description: str | None = None
    upgrades: str | None = None
    cost_price: Decimal = Field(ge=0)
    profit_margin: Decimal = Field(ge=0)
    discount_percent: Decimal = Field(default=0, ge=0, le=100)
    quantity: int = Field(gt=0)
    gst_percent: Decimal = Field(ge=0, le=28)


class InvoiceIn(CamelModel):
    customer_id: str
    billing_date: date
    credit_days: int = Field(default=0, ge=0)
    payment_type: PaymentType = "spot"
    payment_done: bool = False
    freight_charges: Decimal = Field(default=Decimal("0"), ge=0)
    other_charges: Decimal = Field(default=Decimal("0"), ge=0)
    payment_notes: str | None = None
    is_delivered: bool = False
    status: InvoiceStatus | None = None
    items: list[InvoiceItemIn] = Field(min_length=1)


class PaymentIn(CamelModel):
    amount_paid: Decimal = Field(gt=0)
    payment_date: date
    note: str | None = None
    payment_mode: str = "UPI"


class SendEmailIn(CamelModel):
    recipient_email: EmailStr
    subject: str
    body: str


class ChatIn(CamelModel):
    message: str


class AppSettingsIn(CamelModel):
    gmail_smtp_user: EmailStr | None = None
    gmail_smtp_password: str | None = None
    reminder_days_before: int = Field(default=3, ge=0)
    emi_interest_rate: Decimal = Field(default=Decimal("1.5"), ge=0)
    pay_later_penalty_rate: Decimal = Field(default=Decimal("2.0"), ge=0)
    low_stock_threshold: int = Field(default=5, ge=0)


class ReminderRequest(CamelModel):
    subject: str | None = None
    body: str | None = None


class HsnCreate(CamelModel):
    hsn_code: str
    description: str
    gst_percent: Decimal = Field(ge=0, le=28)

