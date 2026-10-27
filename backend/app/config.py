
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str

    google_client_id: str = ""

    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 10080

    google_application_credentials: str = ""

    # Websites allowed to call this API from a browser, separated by commas, e.g.
    # "https://bibleduo.vercel.app,http://localhost:8081". "*" allows any site (fine for development).
    allowed_origins: str = "*"

    # Most characters all visitors together may send to Google Translate per day (UTC).
    translate_daily_char_cap: int = 16000

    # Supabase Storage (audio files). Only the import scripts use these.
    supabase_url: str = ""
    supabase_service_key: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
