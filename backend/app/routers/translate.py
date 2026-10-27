from fastapi import APIRouter, HTTPException, Request

from app.schemas import TranslateRequest, TranslateResponse
from app.services import usage_cap
from app.services.translate import translate_text

router = APIRouter(prefix="/translate", tags=["translate"])


def visitor_id(request: Request) -> str:
    """
    The visitor's IP address. Hosts like Render sit in front of the app and pass the real
    address in X-Forwarded-For (the first entry); without it we see the host's own address.
    """
    forwarded = request.headers.get("x-forwarded-for", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


@router.post("", response_model=TranslateResponse)
def translate_endpoint(body: TranslateRequest, request: Request):
    text = body.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Nothing to translate")
    if len(text) > 500:
        # A phrase tap should never be this long; this also caps what one request can cost.
        raise HTTPException(status_code=400, detail="Text too long (500 characters max)")

    key = (text, body.source_lang, body.target_lang)
    hit = usage_cap.cached(key)
    if hit is not None:
        return TranslateResponse(translation=hit)

    try:
        usage_cap.reserve(visitor_id(request), len(text))
    except usage_cap.LimitReached as limit:
        raise HTTPException(status_code=429, detail=str(limit))

    try:
        result = translate_text(text, target_lang=body.target_lang, source_lang=body.source_lang)
    except Exception as e:
        # 502 = "my code is fine, the service I depend on failed" (credentials, billing, quota...)
        raise HTTPException(status_code=502, detail=f"Translation failed: {e}")
    usage_cap.remember(key, result)
    return TranslateResponse(translation=result)
