from fastapi import APIRouter, Depends

from services.analytics_service import analytics_summary, chart_data
from services.auth_service import RequestContext, require_company
from services.gemini_service import ask_gemini
from services.schemas import ChatIn

router = APIRouter(tags=["analytics"])


@router.get("/analytics/summary")
def summary(ctx: RequestContext = Depends(require_company)):
    return analytics_summary(ctx.company_id)


@router.get("/analytics/charts")
def charts(ctx: RequestContext = Depends(require_company)):
    return chart_data(ctx.company_id)


@router.post("/analytics/chat")
def chat(payload: ChatIn, ctx: RequestContext = Depends(require_company)):
    summary_data = analytics_summary(ctx.company_id)
    return {"answer": ask_gemini(summary_data, payload.message), "context": summary_data}

