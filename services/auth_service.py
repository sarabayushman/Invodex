from dataclasses import dataclass
from typing import Annotated

from fastapi import Depends, Header, HTTPException, status

from services.supabase_client import get_supabase


@dataclass
class RequestContext:
    user_id: str
    email: str | None
    company_id: str | None


def _bearer_token(authorization: str | None) -> str:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token.")
    return authorization.split(" ", 1)[1].strip()


def get_current_context(authorization: Annotated[str | None, Header()] = None) -> RequestContext:
    token = _bearer_token(authorization)
    client = get_supabase()
    try:
        user_response = client.auth.get_user(token)
        user = user_response.user
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Supabase token.") from exc

    profile = (
        client.table("company_profile")
        .select("id")
        .eq("owner_user_id", user.id)
        .limit(1)
        .execute()
        .data
    )
    return RequestContext(
        user_id=user.id,
        email=getattr(user, "email", None),
        company_id=profile[0]["id"] if profile else None,
    )


def require_company(ctx: RequestContext = Depends(get_current_context)) -> RequestContext:
    if not ctx.company_id:
        raise HTTPException(status_code=status.HTTP_428_PRECONDITION_REQUIRED, detail="Company onboarding is required.")
    return ctx

