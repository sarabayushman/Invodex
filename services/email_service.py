import smtplib
from email.message import EmailMessage

from services.supabase_client import get_supabase


def send_gmail(company_id: str, recipient: str, subject: str, body: str, mail_type: str, invoice_id: str | None = None, customer_id: str | None = None) -> dict:
    client = get_supabase()
    settings = client.table("app_settings").select("*").eq("company_id", company_id).limit(1).execute().data
    smtp_user = settings[0].get("gmail_smtp_user") if settings else None
    smtp_password = settings[0].get("gmail_smtp_password") if settings else None
    status = "sent"
    error = None
    try:
        if not smtp_user or not smtp_password:
            raise RuntimeError("Gmail SMTP credentials are not configured.")
        msg = EmailMessage()
        msg["From"] = smtp_user
        msg["To"] = recipient
        msg["Subject"] = subject
        msg.set_content(body)
        with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=20) as smtp:
            smtp.login(smtp_user, smtp_password)
            smtp.send_message(msg)
    except Exception as exc:
        status = "failed"
        error = str(exc)

    log = {
        "company_id": company_id,
        "invoice_id": invoice_id,
        "customer_id": customer_id,
        "type": mail_type,
        "subject": subject,
        "body": body if not error else f"{body}\n\nSend error: {error}",
        "recipient_email": recipient,
        "status": status,
    }
    saved = client.table("mail_logs").insert(log).execute().data[0]
    return saved

