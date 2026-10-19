from fastapi import APIRouter, HTTPException

from app.schemas import TranslateRequest, TranslateResponse
from app.services.translate import translate_text

router = APIRouter(prefix="/translate", tags=["translate"])


@router.post("", response_model=TranslateResponse)
def translate_endpoint(body: TranslateRequest):
    if not body.text.strip():
        raise HTTPException(status_code=400, detail="Nothing to translate")
    if len(body.text) > 500:
        # A phrase tap should never be this long; this also caps what one request can cost.
        raise HTTPException(status_code=400, detail="Text too long (500 characters max)")

    try:
        result = translate_text(body.text, target_lang=body.target_lang, source_lang=body.source_lang)
    except Exception as e:
        # 502 = "my code is fine, the service I depend on failed" (credentials, billing, quota...)
        raise HTTPException(status_code=502, detail=f"Translation failed: {e}")
    return TranslateResponse(translation=result)
