from django.shortcuts import render
from django.http import JsonResponse
from django.core.cache import cache
import time
import logging

logger = logging.getLogger(__name__)


class RateLimitMiddleware:
    """Простой лимитер запросов через Django Cache"""

    def __init__(self, get_response):
        self.get_response = get_response
        # Настройки лимитов
        self.limits = {
            '/': {'requests': 10, 'window': 30},
            '/home/': {'requests': 10, 'window': 30},
            '/books/top/': {'requests': 10, 'window': 30},
            '/books/submit/': {'requests': 5, 'window': 30},
            '/books/book/': {'requests': 15, 'window': 30},
            '/books/review/': {'requests': 6, 'window': 60},
            '/users/members/': {'requests': 10, 'window': 20},
        }
        self.default_limit = {'requests': 10, 'window': 30}
        self.excluded_paths = [
            '/health',
            '/favicon.ico',
            '/static/',
            '/media/',
            '/admin/',
            '/robots.txt',
        ]

    def __call__(self, request):
        path = request.path

        # Пропускаем исключения
        if self._is_excluded(path):
            return self.get_response(request)

        # Получаем IP
        client_ip = self._get_client_ip(request)

        # Определяем лимиты
        limit_config = self._get_limit_config(path)
        max_requests = limit_config['requests']
        window_seconds = limit_config['window']

        # Проверяем лимит
        if self._is_limited(client_ip, path, max_requests, window_seconds):
            logger.warning(f"Rate limit exceeded: {client_ip} -> {path}")
            return self._rate_limit_response(request, max_requests, window_seconds)

        return self.get_response(request)

    def _is_excluded(self, path):
        """Проверяет, исключен ли путь из лимитирования"""
        if path in self.excluded_paths:
            return True
        for excluded in self.excluded_paths:
            if path.startswith(excluded):
                return True
        return False

    def _get_client_ip(self, request):
        """Получает IP клиента"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR', 'unknown')

    def _get_limit_config(self, path):
        """Определяет лимиты для эндпоинта"""
        # Точное совпадение
        if path in self.limits:
            return self.limits[path]

        # По префиксам
        for endpoint, config in self.limits.items():
            if path.startswith(endpoint):
                return config

        return self.default_limit

    def _is_limited(self, ip, path, max_requests, window_seconds):
        """Проверяет, не превышен ли лимит"""
        try:
            key = f"rate_limiter:{path}:{ip}"
            current_time = time.time()

            # Получаем данные из кэша
            data = cache.get(key, [])

            # Очищаем старые записи
            data = [t for t in data if t > current_time - window_seconds]

            # Проверяем лимит
            if len(data) >= max_requests:
                return True

            # Добавляем новый запрос
            data.append(current_time)
            cache.set(key, data, window_seconds)

            return False

        except Exception as e:
            logger.error(f"Rate limiter error: {e}")
            return False  # Если ошибка - пропускаем

    def _rate_limit_response(self, request, max_requests, window_seconds):
        """Возвращает ответ при превышении лимита"""
        accept_header = request.META.get('HTTP_ACCEPT', '')

        if 'text/html' in accept_header:
            return render(
                request,
                'errors/429.html',
                {'limit': max_requests, 'window': window_seconds},
                status=429
            )

        return JsonResponse(
            {
                'detail': 'Too many requests. Please try again later.',
                'limit': max_requests,
                'window': window_seconds,
            },
            status=429
        )