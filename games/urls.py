from django.urls import path
from django.contrib.auth.decorators import login_required
from . import views

urlpatterns = [
    path('', views.wheel_dashboard, name='wheel_dashboard'),
    path('spin-result/', views.spin_result, name='spin_result'),
    path('update-probability/', views.update_theme_probability, name='update_probability'),
]