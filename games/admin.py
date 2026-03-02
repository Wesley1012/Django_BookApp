from django.contrib import admin
from .models import WheelTheme, WheelConfiguration, SpinHistory

# Временно регистрируем старые модели
admin.site.register(WheelTheme)

