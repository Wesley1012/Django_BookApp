from django.db import models
from django.contrib.auth import get_user_model
from django.templatetags.static import static
from django.utils.text import slugify

User = get_user_model()


class BookSubmission(models.Model):
    """Модель для предложки книги от пользователя"""
    STATUS_CHOICES = [
        ('pending', 'На рассмотрении'),
        ('approved', 'Одобрено'),
        ('rejected', 'Отклонено'),
    ]

    # Основные данные
    GENRE_CHOICES = [
        ('fiction', 'Художественная литература'),
        ('classic', 'Классика'),
        ('fantasy', 'Фэнтези'),
        ('scifi', 'Научная фантастика'),
        ('detective', 'Детектив'),
        ('thriller', 'Триллер'),
        ('romance', 'Любовный роман'),
        ('short_story', 'Рассказ'),
        ('novella', 'Повесть'),
        ('historical', 'Исторический'),
        ('adventure', 'Приключения'),
        ('horror', 'Ужасы'),
        ('mystery', 'Мистика'),
        ('drama', 'Драма'),
        ('comedy', 'Комедия'),
        ('biography', 'Биография'),
        ('philosophy', 'Философия'),
        ('psychology', 'Психология'),
        ('history', 'История'),
        ('science', 'Наука'),
        ('popular_science', 'Научно-популярная литература'),
        ('nonfiction', 'Нон-фикшн'),
        ('poetry', 'Поэзия'),
        ('children', 'Детская'),
        ('young_adult', 'Для подростков'),
        ('self_help', 'Саморазвитие'),
        ('comic', 'Комикс'),
        ('manga', 'Манга'),
        ('fanfiction', 'Фанфик'),
        ('erotica', 'Эротика'),
        ('other', 'Другое'),
    ]

    # Основные данные
    title = models.CharField(max_length=200, verbose_name="Название книги")
    author = models.CharField(max_length=200, verbose_name="Автор")
    description = models.TextField(verbose_name="Описание")
    review = models.TextField(blank=True, verbose_name="Рецензия пользователя")

    # ЖАНРЫ (множественный выбор)
    genre = models.CharField(  # ДОБАВЬ
        max_length=50,
        choices=GENRE_CHOICES,
        blank=True,
        verbose_name='Жанр',
    )

    # Обложка
    cover = models.ImageField(upload_to='book_covers/submissions/', blank=True, null=True, verbose_name="Обложка")
    cover_url = models.URLField(blank=True, verbose_name="Ссылка на обложку")

    # Оценки (старая система - только для предложки)
    plot_rating = models.IntegerField(
        default=0,  # ВАЖНО: default=0
        verbose_name="Сюжет (0-10)"
    )
    characters_rating = models.IntegerField(
        default=0,
        verbose_name="Персонажи (0-10)"
    )
    style_rating = models.IntegerField(
        default=0,
        verbose_name="Стиль (0-10)"
    )
    originality_rating = models.IntegerField(
        default=0,
        verbose_name="Оригинальность (0-10)"
    )
    impression_rating = models.IntegerField(
        default=0,
        verbose_name="Впечатление (0-10)"
    )

    # Флаги
    want_rating = models.BooleanField(default=False, verbose_name="Хочу оценить")
    is_favorite = models.BooleanField(
        default=False,
        verbose_name="Любимая книга пользователя",
        help_text="Пользователь отметил как любимую (видно админу)"
    )

    # Системные поля
    submitted_by = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="Предложил")
    submitted_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата предложки")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name="Статус")

    def __str__(self):
        return f"{self.title} ({self.author}) - {self.get_status_display()}"

    @property
    def total_rating(self):
        """Общая оценка из предложки"""
        if self.want_rating:
            ratings = [
                self.plot_rating,
                self.characters_rating,
                self.style_rating,
                self.originality_rating,
                self.impression_rating
            ]
            # Считаем ВСЕ оценки, включая нули
            # 0 - это тоже оценка (нулевая)
            return sum(ratings) / len(ratings)
        return 0

    def get_cover_display(self):
        """Возвращает обложку"""
        if self.cover and hasattr(self.cover, 'url'):
            return self.cover.url
        elif self.cover_url:
            return self.cover_url
        return static('books/img/no_image.png')

    class Meta:
        verbose_name = "Предложка книги"
        verbose_name_plural = "Предложки книг"
        ordering = ['-submitted_at']



class Book(models.Model):
    """Модель для книг в ТОПе клуба"""
    title = models.CharField(max_length=200, verbose_name="Название")
    author = models.CharField(max_length=200, verbose_name="Автор")
    description = models.TextField(verbose_name="Описание", blank=True)

    # Жанры (ManyToMany)
    genre = models.CharField(
        max_length=50,
        choices=BookSubmission.GENRE_CHOICES,
        blank=True,
        null=True
    )

    # Связь с предложкой (для истории)
    submission = models.OneToOneField(
        BookSubmission,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='book_in_top',
        verbose_name="Исходная предложка"
    )

    # Обложка
    cover = models.ImageField(
        upload_to='book_covers/top/',
        blank=True,
        null=True,
        verbose_name="Обложка"
    )
    cover_url = models.URLField(
        blank=True,
        verbose_name="Ссылка на обложку"
    )

    # Статус
    is_active = models.BooleanField(
        default=True,
        verbose_name="Показывать в ТОПе"
    )

    added_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Дата добавления в ТОП"
    )

    def __str__(self):
        return f"{self.title} - {self.author}"

    def get_cover_display(self):
        """Возвращает обложку"""
        if self.cover and hasattr(self.cover, 'url'):
            return self.cover.url
        elif self.cover_url:
            return self.cover_url
        elif self.submission:
            return self.submission.get_cover_display()
        return static('books/img/no_image.png')

    class Meta:
        verbose_name = "Книга в ТОПе"
        verbose_name_plural = "Книги в ТОПе"
        ordering = ['-added_at']


# books/models.py

# books/models.py

class Review(models.Model):
    """Модель для оценок и рецензий книг в ТОПе"""
    book = models.ForeignKey(
        Book,
        on_delete=models.CASCADE,
        related_name='reviews',
        verbose_name="Книга"
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='book_reviews',
        verbose_name="Пользователь"
    )

    # Критерии оценки (могут быть пустыми)
    character_depth = models.IntegerField(
        choices=[(i, f"{i}") for i in range(0, 11)],
        verbose_name="Прописанность персонажей",
        null=True,
        blank=True,
        default=None
    )
    idea_reveal = models.IntegerField(
        choices=[(i, f"{i}") for i in range(0, 11)],
        verbose_name="Раскрытие авторской идеи",
        null=True,
        blank=True,
        default=None
    )
    readability = models.IntegerField(
        choices=[(i, f"{i}") for i in range(0, 11)],
        verbose_name="Читаемость",
        null=True,
        blank=True,
        default=None
    )
    relevance = models.IntegerField(
        choices=[(i, f"{i}") for i in range(0, 11)],
        verbose_name="Актуальность",
        null=True,
        blank=True,
        default=None
    )
    overall_impression = models.IntegerField(
        choices=[(i, f"{i}") for i in range(0, 11)],
        verbose_name="Общее впечатление",
        null=True,
        blank=True,
        default=None
    )

    # Рецензия
    comment = models.TextField(
        blank=True,
        verbose_name="Рецензия пользователя"
    )

    # Флаги
    is_from_submission = models.BooleanField(
        default=False,
        verbose_name="Рецензия из предложки"
    )
    is_edited = models.BooleanField(
        default=False,
        verbose_name="Редактировалась"
    )

    # Даты
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} → {self.book.title}"

    @property
    def has_rating(self):
        """Есть ли хотя бы одна оценка"""
        return any([
            self.character_depth is not None,
            self.idea_reveal is not None,
            self.readability is not None,
            self.relevance is not None,
            self.overall_impression is not None
        ])

    @property
    def total_score(self):
        """Средний балл только если есть оценки"""
        if not self.has_rating:
            return None
        scores = [s for s in [
            self.character_depth,
            self.idea_reveal,
            self.readability,
            self.relevance,
            self.overall_impression
        ] if s is not None]
        return sum(scores) / len(scores) if scores else None

    class Meta:
        unique_together = ['book', 'user']
        ordering = ['-created_at']


class FavoriteBook(models.Model):
    """Модель для избранных книг пользователя"""
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='favorite_books',
        verbose_name="Пользователь"
    )
    book = models.ForeignKey(
        Book,
        on_delete=models.CASCADE,
        related_name='favorited_by',
        verbose_name="Книга"
    )

    # Можно добавить заметку
    note = models.TextField(
        blank=True,
        verbose_name="Заметка пользователя",
        help_text="Почему добавил в избранное"
    )

    added_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата добавления")

    def __str__(self):
        return f"{self.user.username} ❤️ {self.book.title}"

    class Meta:
        verbose_name = "Избранная книга"
        verbose_name_plural = "Избранные книги"
        unique_together = ['user', 'book']  # Уникальная пара пользователь-книга
        ordering = ['-added_at']


