from django.contrib.auth import authenticate, login, get_user_model
from django.views import View
from django.shortcuts import render, redirect, get_object_or_404
from books.models import Review, FavoriteBook, BookSubmission, Book
from users.forms import UserCreationForm
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from .forms import ProfileUpdateForm
from django.views.decorators.http import require_POST
from django.core.files.base import ContentFile
from .models import ClubEvent
from django.http import JsonResponse
import re, time, base64

User = get_user_model()


class Register(View):

    template_name = 'registration/register.html'

    def get(self, request):
        context = {
            'form': UserCreationForm()
        }
        return render(request, self.template_name, context)

    def post(self, request):
        form = UserCreationForm(request.POST)

        if form.is_valid():
            user = form.save()  # Сохраняем пользователя
            email = form.cleaned_data.get('email')
            password = form.cleaned_data.get('password1')
            user = authenticate(username=email, password=password)
            login(request, user)

            # 👇 ДОБАВЛЯЕМ СОБЫТИЕ РЕГИСТРАЦИИ
            ClubEvent.objects.create(
                event_type='user_registered',
                user=user,
                target=None,
                is_read=False
            )

            return redirect('/users/')
        context = {
            'form': form
        }
        return render(request, self.template_name, context)


@login_required
def my_profile(request):
    user = request.user

    books_in_top_count = Book.objects.filter(
        submission__submitted_by=user,
        is_active=True
    ).count()

    # Избранные книги
    favorite_books = FavoriteBook.objects.filter(user=user).select_related('book')

    # ВСЕ рецензии пользователя (включая те, что из предложки)
    reviews = Review.objects.filter(user=user).select_related('book').order_by('-created_at')

    # Только рецензии с текстом (для отдельного блока)
    reviews_with_comments = reviews.exclude(comment='').exclude(comment__isnull=True)

    all_submissions = BookSubmission.objects.filter(submitted_by=user)

    submissions = []
    for submission in all_submissions:
        if submission.status != 'approved' or (submission.status == 'approved' and hasattr(submission, 'book_in_top')):
            submissions.append(submission)

    # Сортируем по дате
    submissions.sort(key=lambda x: x.submitted_at, reverse=True)

    # Получаем все рецензии для личного топа
    user_reviews = reviews.select_related('book')

    # Формируем список для топа - ТОЛЬКО С ОЦЕНКАМИ!
    personal_top_books = []
    for review in user_reviews:
        if review.has_rating:  # Добавляем проверку на наличие оценок
            personal_top_books.append({
                'book': review.book,
                'review': review,
                'total_score': review.total_score
            })

    # ПОЛУЧАЕМ ПАРАМЕТРЫ СОРТИРОВКИ
    sort_by = request.GET.get('sort', 'total')
    order = request.GET.get('order', 'desc')

    # ПРИМЕНЯЕМ СОРТИРОВКУ
    if personal_top_books:
        if sort_by == 'title':
            personal_top_books.sort(
                key=lambda x: x['book'].title.lower(),
                reverse=(order == 'desc')
            )
        elif sort_by == 'character':
            personal_top_books.sort(
                key=lambda x: x['review'].character_depth or 0,
                reverse=(order == 'desc')
            )
        elif sort_by == 'idea':
            personal_top_books.sort(
                key=lambda x: x['review'].idea_reveal or 0,
                reverse=(order == 'desc')
            )
        elif sort_by == 'readability':
            personal_top_books.sort(
                key=lambda x: x['review'].readability or 0,
                reverse=(order == 'desc')
            )
        elif sort_by == 'relevance':
            personal_top_books.sort(
                key=lambda x: x['review'].relevance or 0,
                reverse=(order == 'desc')
            )
        elif sort_by == 'impression':
            personal_top_books.sort(
                key=lambda x: x['review'].overall_impression or 0,
                reverse=(order == 'desc')
            )
        else:  # total
            personal_top_books.sort(
                key=lambda x: x['total_score'] or 0,
                reverse=(order == 'desc')
            )

    # Статистика для админа (если нужно)
    pending_count = BookSubmission.objects.filter(status='pending').count() if user.is_staff else 0
    books_count = Book.objects.filter(is_active=True).count() if user.is_staff else 0

    context = {
        'favorite_books': favorite_books,
        'reviews': reviews,
        'reviews_with_comments': reviews_with_comments,
        'submissions': submissions,
        'personal_top_books': personal_top_books,
        'books_in_top_count': books_in_top_count,
        'pending_count': pending_count,
        'books_count': books_count,
        'sort_by': sort_by,
        'order': order,
    }

    return render(request, 'users/my_profile.html', context)

# users/views.py

def user_profile(request, user_id):
    """Просмотр чужого профиля"""
    profile_user = get_object_or_404(User, id=user_id)

    # Избранные книги пользователя
    favorite_books = FavoriteBook.objects.filter(
        user=profile_user
    ).select_related('book').order_by('-added_at')

    # Количество книг пользователя в ТОПе
    books_in_top_count = Book.objects.filter(
        submission__submitted_by=profile_user,
        is_active=True
    ).count()

    # Рецензии пользователя
    reviews = profile_user.book_reviews.all().select_related('book').order_by('-created_at')

    # Предложки пользователя (только одобренные)
    submissions = profile_user.booksubmission_set.filter(
        status='approved'
    ).order_by('-submitted_at')

    # Количество текстовых рецензий
    reviews_with_text_count = Review.objects.filter(
        user=profile_user
    ).exclude(
        comment__isnull=True
    ).exclude(
        comment__exact=''
    ).count()

    # Статистика
    approved_submissions_count = submissions.count()
    reviews_count = reviews.count()
    favorite_books_count = favorite_books.count()

    # Личный ТОП книг пользователя (ТОЛЬКО С ОЦЕНКАМИ)
    personal_top_books = []
    user_reviews = Review.objects.filter(user=profile_user).select_related('book')

    for review in user_reviews:
        if review.has_rating:  # Только с оценками
            personal_top_books.append({
                'book': review.book,
                'review': review,
                'total_score': review.total_score
            })

    # ПОЛУЧАЕМ ПАРАМЕТРЫ СОРТИРОВКИ
    sort_by = request.GET.get('sort', 'total')
    order = request.GET.get('order', 'desc')

    # ПРИМЕНЯЕМ СОРТИРОВКУ
    if personal_top_books:
        if sort_by == 'title':
            personal_top_books.sort(
                key=lambda x: x['book'].title.lower(),
                reverse=(order == 'desc')
            )
        elif sort_by == 'character':
            personal_top_books.sort(
                key=lambda x: x['review'].character_depth or 0,
                reverse=(order == 'desc')
            )
        elif sort_by == 'idea':
            personal_top_books.sort(
                key=lambda x: x['review'].idea_reveal or 0,
                reverse=(order == 'desc')
            )
        elif sort_by == 'readability':
            personal_top_books.sort(
                key=lambda x: x['review'].readability or 0,
                reverse=(order == 'desc')
            )
        elif sort_by == 'relevance':
            personal_top_books.sort(
                key=lambda x: x['review'].relevance or 0,
                reverse=(order == 'desc')
            )
        elif sort_by == 'impression':
            personal_top_books.sort(
                key=lambda x: x['review'].overall_impression or 0,
                reverse=(order == 'desc')
            )
        else:  # total
            personal_top_books.sort(
                key=lambda x: x['total_score'] or 0,
                reverse=(order == 'desc')
            )

    context = {
        'profile_user': profile_user,
        'favorite_books': favorite_books,
        'reviews': reviews,
        'submissions': submissions,
        'personal_top_books': personal_top_books,
        'books_in_top_count': books_in_top_count,
        'is_own_profile': (request.user == profile_user),
        'approved_submissions_count': approved_submissions_count,
        'reviews_count': reviews_count,
        'reviews_with_text_count': reviews_with_text_count,
        'favorite_books_count': favorite_books_count,
        'sort_by': sort_by,
        'order': order,
    }

    return render(request, 'users/user_profile.html', context)


def home(request):
    if request.user.is_authenticated:
        # Все события для отображения (без пагинации)
        recent_events = ClubEvent.objects.all().order_by('-created_at')
        unread_count = ClubEvent.objects.exclude(read_by=request.user).count()
    else:
        recent_events = []
        unread_count = 0

    return render(request, 'home.html', {
        'recent_events': recent_events,
        'unread_count': unread_count,
        'tilda_style': True
    })

@login_required
def mark_events_read(request):
    if request.method == 'POST':
        # Отмечаем все события как прочитанные для текущего пользователя
        unread_events = ClubEvent.objects.exclude(read_by=request.user)
        for event in unread_events:
            event.read_by.add(request.user)
        return JsonResponse({'success': True})
    return JsonResponse({'success': False})

@login_required
def edit_profile(request):
    if request.method == 'POST':
        form = ProfileUpdateForm(request.POST, request.FILES, instance=request.user)

        if form.is_valid():
            user = form.save(commit=False)

            # Обработка обрезанного аватара (base64)
            cropped_avatar = request.POST.get('cropped_avatar', '')
            if cropped_avatar and cropped_avatar.startswith('data:img'):
                try:
                    # Извлекаем base64 данные
                    format, imgstr = cropped_avatar.split(';base64,')

                    # Определяем расширение файла
                    ext = format.split('/')[-1]

                    # Декодируем base64
                    data = base64.b64decode(imgstr)

                    # Создаем имя файла
                    filename = f"avatar_{user.id}_{int(time.time())}.{ext}"

                    # Сохраняем файл
                    user.avatar.save(
                        filename,
                        ContentFile(data),
                        save=False
                    )

                    # Очищаем ссылку на аватар если была
                    user.avatar_url = ''

                except Exception as e:
                    print(f"Ошибка сохранения обрезанного аватара: {e}")

            user.save()
            return redirect('my_profile')
    else:
        form = ProfileUpdateForm(instance=request.user)

    return render(request, 'users/edit_profile.html', {'form': form})


def members_list(request):
    from django.db.models import Count, Q, Sum
    from django.http import JsonResponse
    from django.template.loader import render_to_string
    from books.models import Review, Book, BookSubmission

    User = get_user_model()

    sort_by = request.GET.get('sort', 'date_joined')
    order = request.GET.get('order', 'desc')

    users = User.objects.all()

    # Собираем статистику
    user_stats = []
    for user in users:
        # Количество книг в ТОПе (которые добавил пользователь и они в ТОПе)
        books_in_top_count = Book.objects.filter(
            submission__submitted_by=user,
            is_active=True
        ).count()

        reviews_with_text_count = Review.objects.filter(
            user=user
        ).exclude(
            comment__isnull=True
        ).exclude(
            comment__exact=''
        ).count()

        favorite_books_count = user.favorite_books.count()

        approved_submissions_count = user.booksubmission_set.filter(status='approved').count()

        rated_books_count = Review.objects.filter(
            user=user
        ).filter(
            Q(character_depth__isnull=False) |
            Q(idea_reveal__isnull=False) |
            Q(readability__isnull=False) |
            Q(relevance__isnull=False) |
            Q(overall_impression__isnull=False)
        ).count()

        user_stats.append({
            'user': user,
            'approved_submissions_count': approved_submissions_count,
            'books_in_top_count': books_in_top_count,  # 👈 НОВЫЙ СТОЛБЕЦ
            'reviews_with_text_count': reviews_with_text_count,  # 👈 НОВЫЙ СТОЛБЕЦ
            'rated_books_count': rated_books_count,
            'favorite_books_count': favorite_books_count,
        })

    # СОРТИРОВКА
    if sort_by == 'username':
        user_stats.sort(key=lambda x: x['user'].username.lower(), reverse=(order == 'desc'))
    elif sort_by == 'date_joined':
        user_stats.sort(key=lambda x: x['user'].date_joined, reverse=(order == 'desc'))
    elif sort_by == 'books_in_top':
        user_stats.sort(key=lambda x: x['books_in_top_count'], reverse=(order == 'desc'))
    elif sort_by == 'reviews_with_text':
        user_stats.sort(key=lambda x: x['reviews_with_text_count'], reverse=(order == 'desc'))
    elif sort_by == 'approved_submissions':
        user_stats.sort(key=lambda x: x['approved_submissions_count'], reverse=(order == 'desc'))
    elif sort_by == 'rated_books':
        user_stats.sort(key=lambda x: x['rated_books_count'], reverse=(order == 'desc'))
    elif sort_by == 'favorites':
        user_stats.sort(key=lambda x: x['favorite_books_count'], reverse=(order == 'desc'))

    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        html = render_to_string('users/members_list.html', {
            'user_stats': user_stats,
            'sort_by': sort_by,
            'order': order,
            'ajax': True,
        }, request=request)
        return JsonResponse({'html': html})

    context = {
        'user_stats': user_stats,
        'sort_by': sort_by,
        'order': order,
    }

    return render(request, 'users/members_list.html', context)

@login_required
@require_POST  # Только POST запросы!
def delete_avatar(request):
    """Удаляет аватар пользователя (только POST)"""
    user = request.user

    # Удаляем файл аватара
    if user.avatar:
        user.avatar.delete(save=False)
        user.avatar = None

    # Очищаем ссылку на аватар
    user.avatar_url = ''
    user.save()

    return redirect('edit_profile')