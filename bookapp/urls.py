from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView, RedirectView
from users.views import home
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls, name='admin'),
    path('', RedirectView.as_view(url='/users/', permanent=True)),
    path('users/', include('users.urls')),
    path('home/', home, name='home'),
    path('books/', include('books.urls')),
    path('games/', include('games.urls')),

]
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)