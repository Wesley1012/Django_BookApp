from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from .forms import BookSubmissionForm, BookSubmissionAdminForm, ReviewForm
from .models import BookSubmission, Book, Review, FavoriteBook
from django.shortcuts import get_object_or_404
from django.db import models
from django.db.models import Count, Avg, Sum, F, Q
from django.views.decorators.http import require_POST
from django.contrib.admin.views.decorators import staff_member_required
from django.utils.text import slugify


@login_required
def submit_book(request):
    """Пользователь предлагает книгу"""
    if request.method == 'POST':
        form = BookSubmissionForm(request.POST, request.FILES)

        if form.is_valid():
            # Сохраняем форму без коммита
            submission = form.save(commit=False)

            # Автоматически проставляем пользователя
            submission.submitted_by = request.user

            # Автоматически ставим статус "на рассмотрении"
            submission.status = 'pending'

            # Если не хотят оценивать - обнуляем оценки
            if not submission.want_rating:
                submission.plot_rating = 0
                submission.characters_rating = 0
                submission.style_rating = 0
                submission.originality_rating = 0
                submission.impression_rating = 0

            # Сохраняем в БД
            submission.save()

            # Сохраняем ManyToMany если есть (в данном случае нет)
            form.save_m2m()

            messages.success(request, '✅ Книга успешно предложена! Ожидайте проверки администратором.')
            return redirect('home')
        else:
            # Показываем ошибки формы
            messages.error(request, '❌ Пожалуйста, исправьте ошибки в форме.')
            for field, errors in form.errors.items():
                for error in errors:
                    messages.error(request, f'{field}: {error}')
    else:
        form = BookSubmissionForm()

    return render(request, 'books/submit_book.html', {'form': form})

@staff_member_required
def admin_submissions(request):
    """Список предложок на модерации"""
    submissions = BookSubmission.objects.filter(status='pending')
    return render(request, 'books/admin_submissions.html', {'submissions': submissions})


@staff_member_required
def edit_submission(request, submission_id):
    submission = get_object_or_404(BookSubmission, id=submission_id)

    if request.method == 'POST':
        action = request.POST.get('action')

        # БЫСТРОЕ ОДОБРЕНИЕ/ОТКЛОНЕНИЕ
        if action in ['approve', 'reject']:
            if action == 'approve':
                submission.status = 'approved'
                submission.save()

                # СОЗДАЕМ КНИГУ В ТОПЕ если еще нет
                if not hasattr(submission, 'book_in_top'):
                    book = Book.objects.create(
                        title=submission.title,
                        author=submission.author,
                        description=submission.description,
                        submission=submission,
                        cover_url=submission.cover_url,
                        genre=submission.genre,  # копируем жанр
                        is_active=True
                    )

                    # Копируем обложку если есть
                    if submission.cover:
                        book.cover.save(
                            submission.cover.name,
                            submission.cover.file,
                            save=True
                        )

                    # Рецензия из предложки
                    if submission.want_rating:
                        Review.objects.create(
                            book=book,
                            user=submission.submitted_by,
                            character_depth=submission.characters_rating,
                            idea_reveal=submission.plot_rating,
                            readability=submission.style_rating,
                            relevance=submission.originality_rating,
                            overall_impression=submission.impression_rating,
                            comment=submission.review or '',
                            is_from_submission=True
                        )

                    # Избранное
                    if submission.is_favorite:
                        FavoriteBook.objects.get_or_create(
                            user=submission.submitted_by,
                            book=book,
                            defaults={'note': 'Добавлено при предложке книги'}
                        )

                    messages.success(request, '✅ Книга одобрена и добавлена в ТОП!')
                else:
                    messages.info(request, 'ℹ️ Книга уже в ТОПе.')

            elif action == 'reject':
                submission.status = 'rejected'
                submission.save()
                messages.warning(request, '❌ Книга отклонена.')

            return redirect('books:admin_submissions')

        # ПОЛНАЯ ФОРМА РЕДАКТИРОВАНИЯ
        form = BookSubmissionAdminForm(request.POST, request.FILES, instance=submission)

        if form.is_valid():
            saved_submission = form.save(commit=False)

            if not saved_submission.want_rating:
                saved_submission.plot_rating = 0
                saved_submission.characters_rating = 0
                saved_submission.style_rating = 0
                saved_submission.originality_rating = 0
                saved_submission.impression_rating = 0

            saved_submission.save()
            messages.success(request, '💾 Изменения сохранены!')
            return redirect('books:admin_submissions')

    else:
        form = BookSubmissionAdminForm(instance=submission)

    return render(request, 'books/edit_submission.html', {
        'form': form,
        'submission': submission
    })


@staff_member_required
@require_POST
def approve_submission(request, submission_id):
    """Быстрое одобрение из списка"""
    submission = get_object_or_404(BookSubmission, id=submission_id)
    submission.status = 'approved'
    submission.save()

    # СОЗДАЕМ КНИГУ В ТОПЕ если еще нет
    if not hasattr(submission, 'book_in_top'):
        book = Book.objects.create(
            title=submission.title,
            author=submission.author,
            description=submission.description,
            submission=submission,
            cover_url=submission.cover_url,
            genre=submission.genre,  # копируем жанр
            is_active=True
        )

        # Копируем обложку если есть
        if submission.cover:
            book.cover.save(
                submission.cover.name,
                submission.cover.file,
                save=True
            )

        # Рецензия из предложки
        if submission.want_rating:
            Review.objects.create(
                book=book,
                user=submission.submitted_by,
                character_depth=submission.characters_rating,
                idea_reveal=submission.plot_rating,
                readability=submission.style_rating,
                relevance=submission.originality_rating,
                overall_impression=submission.impression_rating,
                comment=submission.review or '',
                is_from_submission=True
            )

        # Избранное
        if submission.is_favorite:
            FavoriteBook.objects.get_or_create(
                user=submission.submitted_by,
                book=book,
                defaults={'note': 'Добавлено при предложке книги'}
            )

    messages.success(request, f'✅ Книга "{submission.title}" одобрена!')
    return redirect('books:admin_submissions')


@staff_member_required
@require_POST
def reject_submission(request, submission_id):
    """Быстрое отклонение из списка"""
    submission = get_object_or_404(BookSubmission, id=submission_id)
    submission.status = 'rejected'
    submission.save()
    messages.warning(request, f'❌ Книга "{submission.title}" отклонена.')
    return redirect('books:admin_submissions')


# books/views.py (обновляем функцию top_books)

# books/views.py

def top_books(request):
    # Получаем все активные книги
    books = Book.objects.filter(is_active=True).prefetch_related('reviews')

    # ПОИСК
    search_query = request.GET.get('search', '').strip()

    if search_query:
        search_query_lower = search_query.lower()
        all_books = list(books)
        filtered_books = []

        for book in all_books:
            title_lower = book.title.lower()
            author_lower = book.author.lower()
            if search_query_lower in title_lower or search_query_lower in author_lower:
                filtered_books.append(book)

        book_ids = [book.id for book in filtered_books]
        books = Book.objects.filter(id__in=book_ids)

    # Сортировка
    sort_by = request.GET.get('sort', 'total')
    order = request.GET.get('order', 'desc')

    # Аннотации
    books = books.annotate(
        reviews_count=Count('reviews', filter=Q(
            Q(reviews__character_depth__isnull=False) |
            Q(reviews__idea_reveal__isnull=False) |
            Q(reviews__readability__isnull=False) |
            Q(reviews__relevance__isnull=False) |
            Q(reviews__overall_impression__isnull=False)
        )),
        avg_character=Avg('reviews__character_depth'),
        avg_idea=Avg('reviews__idea_reveal'),
        avg_readability=Avg('reviews__readability'),
        avg_relevance=Avg('reviews__relevance'),
        avg_impression=Avg('reviews__overall_impression'),
    )

    # Общий балл
    books = books.annotate(
        total_avg=(
                          F('avg_character') + F('avg_idea') + F('avg_readability') +
                          F('avg_relevance') + F('avg_impression')
                  ) / 5
    )

    # Применяем сортировку
    order_prefix = '' if order == 'asc' else '-'
    sort_fields = {
        'title': 'title',
        'author': 'author',
        'genre': 'genre',
        'reviews': 'reviews_count',
        'character': 'avg_character',
        'idea': 'avg_idea',
        'readability': 'avg_readability',
        'relevance': 'avg_relevance',
        'impression': 'avg_impression',
        'total': 'total_avg',
    }
    sort_field = sort_fields.get(sort_by, 'total_avg')
    books = books.order_by(f'{order_prefix}{sort_field}')

    # Если это AJAX запрос - возвращаем только таблицу
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return render(request, 'books/partials/top_books_table.html', {
            'books': books,
            'search_query': search_query,
        })

    # Обычный запрос - полная страница
    next_order = 'asc' if order == 'desc' else 'desc'
    sort_options = [
        {'value': 'total', 'label': 'Общий балл'},
        {'value': 'title', 'label': 'Название'},
        {'value': 'author', 'label': 'Автор'},
        {'value': 'genre', 'label': 'Жанр'},
        {'value': 'reviews', 'label': 'Количество оценок'},
        {'value': 'character', 'label': 'Прописанность персонажей'},
        {'value': 'idea', 'label': 'Раскрытие идеи'},
        {'value': 'readability', 'label': 'Читаемость'},
        {'value': 'relevance', 'label': 'Актуальность'},
        {'value': 'impression', 'label': 'Впечатление'},
    ]

    context = {
        'books': books,
        'sort_by': sort_by,
        'order': order,
        'next_order': next_order,
        'sort_options': sort_options,
        'search_query': search_query,
    }

    return render(request, 'books/top_books.html', context)


# books/views.py

def book_detail(request, book_id):
    """Страница книги с оценками и рецензиями"""
    book = get_object_or_404(Book, id=book_id, is_active=True)

    # Рецензии пользователя (если есть)
    user_review = None
    if request.user.is_authenticated:
        user_review = Review.objects.filter(book=book, user=request.user).first()

    # Все рецензии к книге
    all_reviews = book.reviews.all().select_related('user').order_by('-created_at')

    # Для таблицы оценок - только те, у которых есть оценки
    reviews_with_ratings = [r for r in all_reviews if r.has_rating]

    # Для блока рецензий - только те, у которых есть текст
    reviews_with_comments = [r for r in all_reviews if r.comment]

    # Средние оценки (только на основе тех, у кого есть оценки)
    if reviews_with_ratings:
        avg_scores = {
            'avg_character': sum(r.character_depth for r in reviews_with_ratings) / len(reviews_with_ratings),
            'avg_idea': sum(r.idea_reveal for r in reviews_with_ratings) / len(reviews_with_ratings),
            'avg_readability': sum(r.readability for r in reviews_with_ratings) / len(reviews_with_ratings),
            'avg_relevance': sum(r.relevance for r in reviews_with_ratings) / len(reviews_with_ratings),
            'avg_impression': sum(r.overall_impression for r in reviews_with_ratings) / len(reviews_with_ratings),
        }
        total_avg = sum(avg_scores.values()) / 5
    else:
        avg_scores = {}
        total_avg = None

    context = {
        'book': book,
        'user_review': user_review,
        'user_has_reviewed': user_review is not None,
        'is_favorite': FavoriteBook.objects.filter(user=request.user.id,
                                                   book=book).exists() if request.user.is_authenticated else False,
        'review_form': ReviewForm(instance=user_review),
        'reviews_with_ratings': reviews_with_ratings,
        'reviews_with_comments': reviews_with_comments,
        'avg_scores': avg_scores,
        'total_avg': total_avg,
        'reviews_count': len(reviews_with_ratings),
    }

    return render(request, 'books/book_detail.html', context)


@login_required
def add_review(request, book_id):
    """Добавить или обновить рецензию/оценку"""
    book = get_object_or_404(Book, id=book_id, is_active=True)
    existing_review = Review.objects.filter(book=book, user=request.user).first()

    if request.method == 'POST':
        # Сохраняем оценку
        if 'save_rating' in request.POST:
            if existing_review:
                # Обновляем существующую запись
                existing_review.character_depth = request.POST.get('character_depth')
                existing_review.idea_reveal = request.POST.get('idea_reveal')
                existing_review.readability = request.POST.get('readability')
                existing_review.relevance = request.POST.get('relevance')
                existing_review.overall_impression = request.POST.get('overall_impression')
                # Комментарий НЕ ТРОГАЕМ
                existing_review.save()
                messages.success(request, '✅ Оценка сохранена!')
            else:
                # Создаем новую запись
                Review.objects.create(
                    book=book,
                    user=request.user,
                    character_depth=request.POST.get('character_depth'),
                    idea_reveal=request.POST.get('idea_reveal'),
                    readability=request.POST.get('readability'),
                    relevance=request.POST.get('relevance'),
                    overall_impression=request.POST.get('overall_impression'),
                    comment=''  # Пустой комментарий
                )
                messages.success(request, '✅ Оценка сохранена!')

            return redirect('books:book_detail', book_id=book.id)

        # Сохраняем рецензию
        elif 'save_comment' in request.POST:
            comment = request.POST.get('comment', '').strip()

            if existing_review:
                # Обновляем существующую запись
                existing_review.comment = comment
                existing_review.is_edited = True
                # Оценки НЕ ТРОГАЕМ
                existing_review.save()
                messages.success(request, '✅ Рецензия обновлена!')
            else:
                # Создаем новую запись
                Review.objects.create(
                    book=book,
                    user=request.user,
                    comment=comment,
                    character_depth=None,
                    idea_reveal=None,
                    readability=None,
                    relevance=None,
                    overall_impression=None
                )
                messages.success(request, '✅ Рецензия опубликована!')

            return redirect('books:book_detail', book_id=book.id)

    return redirect('books:book_detail', book_id=book.id)


@login_required
def delete_rating(request, book_id):
    """Удалить только оценки"""
    book = get_object_or_404(Book, id=book_id)

    if request.method == 'POST':
        review = get_object_or_404(Review, book=book, user=request.user)
        review.character_depth = None
        review.idea_reveal = None
        review.readability = None
        review.relevance = None
        review.overall_impression = None
        review.save()
        messages.success(request, '✅ Оценки удалены! Рецензия сохранена.')

    return redirect('books:book_detail', book_id=book.id)


@login_required
def delete_comment(request, book_id):
    """Удалить только рецензию"""
    book = get_object_or_404(Book, id=book_id)

    if request.method == 'POST':
        review = get_object_or_404(Review, book=book, user=request.user)
        review.comment = ''
        review.save()
        messages.success(request, '✅ Рецензия удалена! Оценки сохранены.')

    return redirect('books:book_detail', book_id=book.id)



@login_required
def toggle_favorite(request, book_id):
    """Добавить/удалить книгу из избранного"""
    book = get_object_or_404(Book, id=book_id, is_active=True)

    favorite, created = FavoriteBook.objects.get_or_create(
        user=request.user,
        book=book
    )

    if not created:
        # Если уже в избранном - удаляем
        favorite.delete()
        messages.success(request, f'Книга "{book.title}" удалена из избранного')
        is_favorite = False
    else:
        messages.success(request, f'Книга "{book.title}" добавлена в избранное!')
        is_favorite = True

    # Возвращаем JSON для AJAX или редирект
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        from django.http import JsonResponse
        return JsonResponse({
            'is_favorite': is_favorite,
            'book_id': book_id
        })

    return redirect('books:book_detail', book_id=book.id)



