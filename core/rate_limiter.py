# core/rate_limiter.py

import random
import logging
from time import time
from django.core.cache import cache
from django.conf import settings

logger = logging.getLogger(__name__)


class RateLimiter:
    """Лимитер запросов на основе Redis через Django Cache"""

    def __init__(self):
        self._cache = cache
        self._prefix = "rate_limiter"

    def _get_key(self, endpoint: str, ip_address: str) -> str:
        """Создает ключ для Redis"""
        return f"{self._prefix}:{endpoint}:{ip_address}"

    def is_limited(
            self,
            ip_address: str,
            endpoint: str,
            max_requests: int,
            window_seconds: int,
    ) -> bool:
        """Проверяет, не превышен ли лимит запросов (синхронно)"""
        key = self._get_key(endpoint, ip_address)
        current_time = time()
        window_start = current_time - window_seconds

        # Используем Redis через Django cache
        from django_redis import get_redis_connection
        redis = get_redis_connection("default")

        # Очищаем старые записи
        redis.zremrangebyscore(key, 0, window_start)

        # Получаем количество запросов в окне
        count = redis.zcard(key)

        # Если лимит превышен - блокируем
        if count >= max_requests:
            logger.warning(
                f"Rate limit exceeded: {ip_address} -> {endpoint} "
                f"({count}/{max_requests} in {window_seconds}s)"
            )
            return True

        # Добавляем новый запрос
        request_id = f"{time()}-{random.randint(0, 100000)}"
        redis.zadd(key, {request_id: current_time})
        redis.expire(key, window_seconds)

        return False


# Создаем синглтон
_rate_limiter = None


def get_rate_limiter() -> RateLimiter:
    global _rate_limiter
    if _rate_limiter is None:
        _rate_limiter = RateLimiter()
    return _rate_limiter