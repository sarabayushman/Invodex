import os
from functools import lru_cache

from fastapi import HTTPException, status
from supabase import Client, create_client


@lru_cache
def get_supabase() -> Client:
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")
    if not url or not key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Supabase environment variables are not configured.",
        )
    return create_client(url, key)

