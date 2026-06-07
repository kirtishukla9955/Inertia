from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    REDIS_URL: str = "redis://localhost:6379"
    QDRANT_HOST: str = "localhost"
    QDRANT_PORT: int = 6333
    OLLAMA_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.2"
    WEBHOOK_SECRET: str = "default_secret_key"
    IF_CONTAMINATION: float = 0.05
    IF_N_ESTIMATORS: int = 100
    DB_PATH: str = "/data/inertia.db"

    class Config:
        env_file = ".env"

settings = Settings()
