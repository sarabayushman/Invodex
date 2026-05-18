def invoice_pdf_placeholder(invoice_id: str) -> dict[str, str]:
    return {
        "message": "PDF generation scaffold is ready. Connect ReportLab or WeasyPrint when final invoice template is approved.",
        "invoice_id": invoice_id,
    }

