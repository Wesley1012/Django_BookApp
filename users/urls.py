from django.urls import path, include
from django.contrib.auth import views as auth_views
from django.urls import reverse_lazy
from . import views

# app_name = 'users'

urlpatterns = [
    # path('auth/', include('django.contrib.auth.urls')),
    path('', views.home, name='home'),
    path('register/', views.Register.as_view(), name='register'),
    path('profile/edit/', views.edit_profile, name='edit_profile'),
    path('profile/', views.my_profile, name='my_profile'),
    path('profile/<int:user_id>/', views.user_profile, name='user_profile'),
    path('members/', views.members_list, name='members_list'),
    path('avatar/delete/', views.delete_avatar, name='delete_avatar'),
    path('mark-events-read/', views.mark_events_read, name='mark_events_read'),


]


