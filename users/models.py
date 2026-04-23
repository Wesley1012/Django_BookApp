from django.db import models
from django.contrib.auth.models import AbstractUser
from easy_thumbnails.fields import ThumbnailerImageField
from django.urls import reverse
import os

class User(AbstractUser):

    ROLE_CHOICES = [
        ('staff', 'Персонал клуба'),
        ('active', 'Активный читатель'),
        ('guest', 'Гость'),
    ]

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='active',
        verbose_name="Роль пользователя"
    )

    email = models.EmailField("email address", unique=True)
    username = models.CharField(
        "username",
        max_length=150,
        unique=True,
        blank=True,
        null=True,
        help_text="Необязательное. 150 символов или меньше."
    )

    # Основное поле для аватара
    avatar = ThumbnailerImageField(
        upload_to='avatars/%Y/%m/%d/',
        blank=True,
        null=True,
        verbose_name="Аватар",
        help_text="Загрузите изображение",
        resize_source={
            'size': (800, 800),
            'crop': 'smart',
            'quality': 90,
        }
    )

    avatar_cropping = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="Данные кадрирования",
        help_text="JSON с координатами кадрирования"
    )

    # Альтернатива: ссылка на аватар
    avatar_url = models.URLField(
        blank=True,
        verbose_name="Аватар (по ссылке)",
        help_text="ИЛИ вставьте ссылку на изображение",
        max_length=500
    )

    bio = models.TextField(
        blank=True,
        verbose_name="О себе",
        max_length=500,
        help_text="Расскажите о себе (максимум 500 символов)"
    )

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    class Meta:
        verbose_name = "Пользователь"
        verbose_name_plural = "Пользователи"

    def __str__(self):
        return self.email

    def get_absolute_url(self):
        return reverse('user_profile', kwargs={'user_id': self.id})

    @property
    def is_club_member(self):
        """Совместимость: является ли пользователь членом клуба"""
        return self.role == 'staff' or self.is_staff

    @property
    def display_avatar(self):
        """Возвращает аватар с учетом кадрирования или ссылки"""
        if self.avatar and hasattr(self.avatar, 'url'):
            # Используем easy_thumbnails для получения обрезанного аватара
            from easy_thumbnails.files import get_thumbnailer
            try:
                # Если указана область кадрирования
                if self.avatar_cropping:
                    # Получаем координаты кадрирования
                    box = [int(x) for x in self.avatar_cropping.split(',')]
                    options = {
                        'size': (300, 300),
                        'crop': box,
                        'quality': 85,
                        'upscale': True
                    }
                    return get_thumbnailer(self.avatar).get_thumbnail(options).url
                else:
                    # Просто уменьшенная версия
                    options = {
                        'size': (300, 300),
                        'crop': 'smart',
                        'quality': 85,
                        'upscale': True
                    }
                    return get_thumbnailer(self.avatar).get_thumbnail(options).url
            except Exception:
                # Если ошибка - возвращаем оригинал
                return self.avatar.url
        elif self.avatar_url:
            return self.avatar_url
        else:
            # Генерация дефолтного аватара с инициалами
            return self.generate_default_avatar()

    def generate_default_avatar(self):
        """Генерирует SVG аватар с инициалами"""

        # Берем первую букву имени или email
        if self.first_name:
            initial = self.first_name[0].upper()
        elif self.last_name:
            initial = self.last_name[0].upper()
        else:
            initial = self.email[0].upper()

        # Цвет на основе email (для постоянства)
        import hashlib
        hash_obj = hashlib.md5(self.email.lower().encode())
        hash_int = int(hash_obj.hexdigest(), 16)
        hue = hash_int % 360

        # Генерируем SVG
        svg = f'''
        <svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
            <rect width="300" height="300" fill="hsl({hue}, 70%, 60%)"/>
            <text x="150" y="150" text-anchor="middle" dy=".35em" 
                  font-family="Arial, sans-serif" font-size="120" 
                  fill="white" font-weight="bold">{initial}</text>
        </svg>
        '''

        # Кодируем SVG для использования в data URL
        import base64
        encoded = base64.b64encode(svg.encode()).decode()
        return f"data:image/svg+xml;base64,{encoded}"

    def get_avatar_thumbnail(self, size=(100, 100)):
        """Получение миниатюры аватара"""
        if self.avatar and hasattr(self.avatar, 'url'):
            from easy_thumbnails.files import get_thumbnailer
            try:
                if self.avatar_cropping:
                    box = [int(x) for x in self.avatar_cropping.split(',')]
                    options = {
                        'size': size,
                        'crop': box,
                        'quality': 85,
                        'upscale': True
                    }
                else:
                    options = {
                        'size': size,
                        'crop': 'smart',
                        'quality': 85,
                        'upscale': True
                    }
                return get_thumbnailer(self.avatar).get_thumbnail(options).url
            except Exception:
                return self.avatar.url
        return self.display_avatar

    def delete_old_avatar(self):
        """Удаляет старый файл аватара при замене"""
        if self.avatar and hasattr(self.avatar, 'path'):
            if os.path.isfile(self.avatar.path):
                os.remove(self.avatar.path)


class ClubEvent(models.Model):
    EVENT_TYPES = [
        ('user_registered', 'Новый участник'),
        ('book_added', 'Добавлена книга'),
        ('review_written', 'Написана рецензия'),
        ('book_favorited', 'Книга добавлена в избранное'),
    ]

    event_type = models.CharField(max_length=50, choices=EVENT_TYPES)
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='events')
    target = models.CharField(max_length=255, blank=True, null=True)  # Название книги/рецензии
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.get_event_type_display()}"