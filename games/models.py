from django.db import models
from django.conf import settings


class WheelTheme(models.Model):
    name = models.CharField(max_length=200, verbose_name="Название темы")
    probability = models.FloatField(default=1.0, verbose_name="Вероятность (1-100)")
    color = models.CharField(max_length=7, default='#3498db', verbose_name="Цвет")
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    # Добавляем владельца темы
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        verbose_name="Владелец"
    )

    def __str__(self):
        return f"{self.name} ({self.probability}%)"


class WheelConfiguration(models.Model):
    MODE_CHOICES = [
        ('normal', 'Обычный'),
        ('elimination', 'Навыбывание'),
        ('battle_royale', 'Батлрояль'),
    ]

    name = models.CharField(max_length=200, default="Колесо фортуны", verbose_name="Название")
    mode = models.CharField(max_length=20, choices=MODE_CHOICES, default='normal')
    spin_duration = models.IntegerField(default=10, verbose_name="Время вращения (сек)")
    is_elimination_active = models.BooleanField(default=False, verbose_name="Режим навыбывание")
    elimination_round = models.IntegerField(default=0, verbose_name="Текущий раунд")
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    # Добавляем поле для привязки к пользователю
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='wheel_configurations',
        verbose_name="Пользователь"
    )

    class Meta:
        # Уникальная конфигурация для каждого пользователя
        unique_together = ['user', 'name']

    def __str__(self):
        return f"{self.name} ({self.user.email})"


class WheelSector(models.Model):
    """Сектор колеса с привязкой к теме"""
    configuration = models.ForeignKey(WheelConfiguration, on_delete=models.CASCADE)
    theme = models.ForeignKey(WheelTheme, on_delete=models.CASCADE)
    order = models.IntegerField(default=0, verbose_name="Порядок")

    class Meta:
        ordering = ['order']


class SpinHistory(models.Model):
    """История вращений"""
    configuration = models.ForeignKey(WheelConfiguration, on_delete=models.CASCADE)
    winner_theme = models.ForeignKey(WheelTheme, on_delete=models.CASCADE)
    spin_time = models.IntegerField(verbose_name="Время вращения")
    spin_result = models.FloatField(verbose_name="Угол остановки")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "История вращения"
        verbose_name_plural = "История вращений"