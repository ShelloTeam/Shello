from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    supabase_url: str = ""
    supabase_key: str = ""
    secret_key: str = "change-me-in-production"
    environment: str = "development"
    openai_api_key: str = ""
    sentry_dsn: str = ""
    admin_key: str = ""
    resend_api_key: str = ""
    base_url: str = "https://shello-production.up.railway.app"

    jwt_algorithm: str = "HS256"
    jwt_expire_days: int = 7

    @property
    def is_production(self) -> bool:
        return self.environment.lower() == "production"

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


# instância direta mantida para compatibilidade com core/security.py
settings = get_settings()