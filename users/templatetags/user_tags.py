from django import template
from django.urls import reverse

register = template.Library()


@register.simple_tag
def user_profile_link(user, show_email=False):
    if not user:
        return ""

    if user.first_name and user.last_name:
        name = f"{user.first_name} {user.last_name}"
    elif user.first_name:
        name = user.first_name
    else:
        name = user.email if show_email else "Пользователь"

    url = reverse('user_profile', kwargs={'user_id': user.id})
    return f'<a href="{url}">{name}</a>'