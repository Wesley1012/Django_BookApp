from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
import json
import random
import math
from django.db import transaction
from .models import WheelTheme, WheelConfiguration, WheelSector, SpinHistory


@login_required
def wheel_dashboard(request):
    """Единственная страница - управление темами и колесо"""
    # Получаем темы текущего пользователя
    user_themes = WheelTheme.objects.filter(owner=request.user)

    # Получаем или создаем конфигурацию для текущего пользователя
    config, created = WheelConfiguration.objects.get_or_create(
        user=request.user,
        name='Моя рулетка',
        defaults={
            'mode': 'normal',
            'spin_duration': 10,
            'is_elimination_active': False,
            'elimination_round': 0,
            'created_by': request.user
        }
    )

    # Если конфигурация создана, добавляем темы пользователя
    if created and user_themes.exists():
        for i, theme in enumerate(user_themes):
            WheelSector.objects.create(
                configuration=config,
                theme=theme,
                order=i
            )

    if request.method == 'POST':
        action = request.POST.get('action')

        if action == 'add_theme':
            name = request.POST.get('name')
            color = request.POST.get('color', '#3498db')
            probability = float(request.POST.get('probability', 1.0))

            if name:
                theme = WheelTheme.objects.create(
                    name=name,
                    probability=probability,
                    color=color,
                    owner=request.user,
                    is_active=True
                )
                # Добавляем тему в конфигурацию пользователя
                WheelSector.objects.create(
                    configuration=config,
                    theme=theme,
                    order=WheelSector.objects.filter(configuration=config).count()
                )

        elif action == 'delete_theme':
            theme_id = request.POST.get('theme_id')
            if theme_id:
                theme = get_object_or_404(WheelTheme, id=theme_id, owner=request.user)
                theme.delete()

        elif action == 'update_probability':
            theme_id = request.POST.get('theme_id')
            probability = float(request.POST.get('probability', 1.0))
            if theme_id:
                theme = get_object_or_404(WheelTheme, id=theme_id, owner=request.user)
                theme.probability = probability
                theme.save()

        elif action == 'toggle_elimination':
            config.is_elimination_active = not config.is_elimination_active
            if not config.is_elimination_active:
                config.elimination_round = 0
                # Восстанавливаем все темы пользователя
                WheelTheme.objects.filter(owner=request.user, is_active=False).update(is_active=True)
            config.save()

        elif action == 'reset_elimination':
            config.elimination_round = 0
            WheelTheme.objects.filter(owner=request.user, is_active=False).update(is_active=True)
            config.save()

        elif action == 'restore_theme':
            theme_id = request.POST.get('theme_id')
            if theme_id:
                theme = get_object_or_404(WheelTheme, id=theme_id, owner=request.user)
                theme.is_active = True
                theme.save()

        return redirect('wheel_dashboard')

    # Получаем темы для колеса (только активные темы пользователя!)
    wheel_themes = user_themes.filter(is_active=True)
    wheel_data = []

    if wheel_themes.exists():
        total_probability = sum(theme.probability for theme in wheel_themes)
        current_angle = 0

        for theme in wheel_themes:
            if total_probability == 0:
                angle = 360 / wheel_themes.count()
            else:
                angle = 360 * (theme.probability / total_probability)

            wheel_data.append({
                'id': theme.id,
                'name': theme.name,
                'color': theme.color,
                'probability': theme.probability,
                'startAngle': current_angle,
                'endAngle': current_angle + angle,
                'angle': angle,
            })
            current_angle += angle

    return render(request, 'games/wheel_dashboard.html', {
        'all_themes': user_themes,
        'wheel_data': json.dumps(wheel_data, ensure_ascii=False),
        'total_themes': user_themes.count(),
        'config': config,
        'active_themes_count': wheel_themes.count(),
        'eliminated_themes_count': user_themes.filter(is_active=False).count()
    })


@login_required
def spin_result(request):
    """Обработка результата вращения колеса"""
    if request.method == 'POST' and request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        try:
            theme_name = request.POST.get('theme_name')
            is_elimination = request.POST.get('is_elimination') == 'true'

            # Получаем тему
            theme = get_object_or_404(WheelTheme, name=theme_name, owner=request.user)

            # Получаем конфигурацию
            config = get_object_or_404(WheelConfiguration, user=request.user, name='Моя рулетка')

            # Сохраняем в историю
            SpinHistory.objects.create(
                configuration=config,
                winner_theme=theme,
                spin_time=5,  # или реальное время вращения
                spin_result=0
            )

            # Если режим навыбывание - делаем тему неактивной
            eliminated = False
            if is_elimination:
                theme.is_active = False
                theme.save()
                config.elimination_round += 1
                config.save()
                eliminated = True

            # Получаем обновленные данные для фронтенда
            active_themes = WheelTheme.objects.filter(owner=request.user, is_active=True)
            wheel_data = []

            if active_themes.exists():
                total_prob = sum(t.probability for t in active_themes)
                current_angle = 0

                for t in active_themes:
                    angle = 360 * (t.probability / total_prob) if total_prob > 0 else 360 / active_themes.count()
                    wheel_data.append({
                        'id': t.id,
                        'name': t.name,
                        'color': t.color,
                        'probability': t.probability,
                        'startAngle': current_angle,
                        'endAngle': current_angle + angle,
                        'angle': angle,
                    })
                    current_angle += angle

            return JsonResponse({
                'success': True,
                'eliminated': eliminated,
                'elimination_round': config.elimination_round,
                'active_count': active_themes.count(),
                'wheel_data': wheel_data,
                'message': f'Тема "{theme.name}" {"выбыла" if eliminated else "победила"}!'
            })

        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})

    return JsonResponse({'success': False, 'error': 'Invalid request'})


@login_required
def update_theme_probability(request):
    """Обновление вероятности темы"""
    if request.method == 'POST' and request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        try:
            theme_id = request.POST.get('theme_id')
            probability = float(request.POST.get('probability', 1.0))

            theme = get_object_or_404(WheelTheme, id=theme_id, owner=request.user)
            theme.probability = probability
            theme.save()

            # Возвращаем обновленные данные для колеса
            active_themes = WheelTheme.objects.filter(owner=request.user, is_active=True)
            wheel_data = []

            if active_themes.exists():
                total_prob = sum(t.probability for t in active_themes)
                current_angle = 0

                for t in active_themes:
                    angle = 360 * (t.probability / total_prob) if total_prob > 0 else 360 / active_themes.count()
                    wheel_data.append({
                        'id': t.id,
                        'name': t.name,
                        'color': t.color,
                        'probability': t.probability,
                        'startAngle': current_angle,
                        'endAngle': current_angle + angle,
                        'angle': angle,
                    })
                    current_angle += angle

            return JsonResponse({
                'success': True,
                'wheel_data': wheel_data
            })

        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})

    return JsonResponse({'success': False, 'error': 'Invalid request'})

# Удаляем spin_wheel_api - он больше не нужен