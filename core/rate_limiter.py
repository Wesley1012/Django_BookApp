from django.core.cache import cache
import random
import time
import logging

logger = logging.getLogger(__name__)


class RateLimiter:
    """Лимитер запросов на основе Django Cache (работает с любым бэкендом)"""

    def __init__(self):
        self._cache = cache
        self._prefix = "rate_limiter"

    def _get_key(self, endpoint, ip_address):
        return f"{self._prefix}:{endpoint}:{ip_address}"

    def is_limited(self, ip_address, endpoint, max_requests, window_seconds):
        """Проверяет, не превышен ли лимит запросов (работает с любым бэкендом)"""
        try:
            key = self._get_key(endpoint, ip_address)
            current_time = time.time()

            # Получаем текущие данные
            data = self._cache.get(key, {})

            # Очищаем старые записи
            if data:
                data = {k: v for k, v in data.items() if v > current_time - window_seconds}

            # Проверяем лимит
            if len(data) >= max_requests:
                logger.warning(
                    f"Rate limit exceeded: {ip_address} -> {endpoint} "
                    f"({len(data)}/{max_requests} in {window_seconds}s)"
                )
                return True

            # Добавляем новый запрос
            request_id = f"{current_time}-{random.randint(0, 100000)}"
            data[request_id] = current_time

            # Сохраняем в кэш
            self._cache.set(key, data, timeout=window_seconds)

            return False

        except Exception as e:
            logger.error(f"Rate limiter error: {e}")
            return False  # Если ошибка - пропускаем


# Синглтон
_rate_limiter = None


def get_rate_limiter():
    global _rate_limiter
    if _rate_limiter is None:
        _rate_limiter = RateLimiter()
    return _rate_limiter