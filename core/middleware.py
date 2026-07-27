
from django.shortcuts import render
from django.http import JsonResponse
from django.conf import settings
from core.rate_limiter import get_rate_limiter
import logging

logger = logging.getLogger(__name__)


class RateLimitMiddleware:
    """Middleware для ограничения количества запросов"""

    def __init__(self, get_response):
        self.get_response = get_response
        self.limiter = get_rate_limiter()
        self.limits_config = getattr(settings, 'RATE_LIMIT_CONFIG', {})
        self.excluded_paths = self.limits_config.get('EXCLUDED_PATHS', [])
        self.default_limit = self.limits_config.get('DEFAULT', {'requests': 60, 'window': 60})
        self.limits = self.limits_config.get('LIMITS', {})

    def __call__(self, request):
        # Получаем путь
        path = request.path

        # Проверяем исключения
        if self._is_excluded(path):
            return self.get_response(request)

        # Получаем IP клиента
        client_ip = self._get_client_ip(request)

        # Определяем лимиты для эндпоинта
        limit_config = self._get_limit_config(path)
        max_requests = limit_config['requests']
        window_seconds = limit_config['window']

        # Проверяем лимит
        is_limited = self.limiter.is_limited(
            ip_address=client_ip,
            endpoint=path,
            max_requests=max_requests,
            window_seconds=window_seconds
        )

        if is_limited:
            return self._rate_limit_response(request, max_requests, window_seconds)

        return self.get_response(request)

    def _is_excluded(self, path):
        """Проверяет, исключен ли путь из лимитирования"""
        # Точные совпадения
        if path in self.excluded_paths:
            return True

        # Префиксы (статичные файлы)
        for excluded in self.excluded_paths:
            if path.startswith(excluded):
                return True

        return False

    def _get_client_ip(self, request):
        """Получает IP клиента с учетом прокси"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR', 'unknown')

    def _get_limit_config(self, path):
        """Определяет лимиты для эндпоинта"""
        # Точное совпадение
        if path in self.limits:
            return self.limits[path]

        # Проверяем по префиксам (для API)
        for endpoint, config in self.limits.items():
            if path.startswith(endpoint):
                return config

        return self.default_limit

    def _rate_limit_response(self, request, max_requests, window_seconds):
        """Возвращает ответ при превышении лимита"""
        # Проверяем, ожидает ли клиент HTML
        accept_header = request.META.get('HTTP_ACCEPT', '')

        if 'text/html' in accept_header:
            # Возвращаем страницу 429
            return render(
                request,
                'errors/429.html',
                {
                    'limit': max_requests,
                    'window': window_seconds,
                },
                status=429
            )

        # Для API возвращаем JSON
        return JsonResponse(
            {
                'detail': 'Too many requests. Please try again later.',
                'limit': max_requests,
                'window': window_seconds,
                'message': f'Превышен лимит: {max_requests} запросов за {window_seconds} секунд'
            },
            status=429
        )