from google.cloud import translate_v2 as translate

from app.config import settings

_client = None


def get_client():
    """
    Builds the Google Translate client once and reuses it.

    Google's library does NOT read our .env file by itself, so we pass the
    key-file path from settings explicitly. If no path is configured we fall
    back to Google's default credential lookup (useful on Google-hosted servers).
    """
    global _client
    if _client is None:
        if settings.google_application_credentials:
            _client = translate.Client.from_service_account_json(
                settings.google_application_credentials
            )
        else:
            _client = translate.Client()
    return _client


def translate_text(text: str, target_lang: str, source_lang: str | None = None) -> str:
    client = get_client()
    result = client.translate(
        text,
        target_language=target_lang,
        source_language=source_lang,
        format_="text",  # without this Google returns HTML-escaped text (e.g. &#39; for an apostrophe)
    )
    return result["translatedText"]
