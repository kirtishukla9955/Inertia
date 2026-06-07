import logging
import redis
from app.config import settings

logger = logging.getLogger(__name__)

class RedisService:
    def __init__(self):
        self.client = None
        self._first_read = True

    def connect(self):
        logger.info(f"Connecting to Redis at {settings.REDIS_URL}...")
        self.client = redis.from_url(settings.REDIS_URL, decode_responses=False)
        self.client.ping()
        logger.info("Redis connected successfully.")
        try:
            self.client.xgroup_create("inertia:logs", "inertia-pipeline", id="0", mkstream=True)
            logger.info("Redis Stream consumer group created.")
        except redis.exceptions.ResponseError as e:
            if "BUSYGROUP" in str(e):
                logger.info("Redis consumer group already exists.")
            else:
                raise

    def disconnect(self):
        if self.client:
            self.client.close()
            logger.info("Redis disconnected.")

redis_client = RedisService()
