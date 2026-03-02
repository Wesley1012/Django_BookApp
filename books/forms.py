# books/forms.py
from django import forms
from .models import BookSubmission, Review


class BookSubmissionForm(forms.ModelForm):

    GENRE_CHOICES = BookSubmission.GENRE_CHOICES

    genre = forms.ChoiceField(
        choices=BookSubmission.GENRE_CHOICES,
        widget=forms.Select(attrs={'class': 'form-select'}),
        label="Жанр",
        required=True
    )

    class Meta:
        model = BookSubmission
        fields = [
            'title', 'author', 'description', 'review',
            'cover', 'cover_url', 'genre',
            'plot_rating', 'characters_rating', 'style_rating',
            'originality_rating', 'impression_rating',
            'is_favorite', 'want_rating'
        ]

        widgets = {
            'genre': forms.Select(attrs={
                'class': 'form-control'
            }),

            'title': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Название книги'
            }),
            'author': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Автор книги'
            }),
            'description': forms.Textarea(attrs={
                'rows': 4,
                'class': 'form-control',
                'placeholder': 'Краткое описание сюжета'
            }),
            'review': forms.Textarea(attrs={
                'rows': 3,
                'class': 'form-control',
                'placeholder': 'Ваша личная рецензия (необязательно)'
            }),
            'cover': forms.FileInput(attrs={
                'class': 'form-control'
            }),
            'cover_url': forms.URLInput(attrs={
                'class': 'form-control',
                'placeholder': 'https://example.com/cover.jpg'
            }),
            'plot_rating': forms.NumberInput(attrs={
                'class': 'form-control rating-input',
                'min': '0',
                'max': '10',
                'placeholder': '0-10'
            }),
            'characters_rating': forms.NumberInput(attrs={
                'class': 'form-control rating-input',
                'min': '0',
                'max': '10',
                'placeholder': '0-10'
            }),
            'style_rating': forms.NumberInput(attrs={
                'class': 'form-control rating-input',
                'min': '0',
                'max': '10',
                'placeholder': '0-10'
            }),
            'originality_rating': forms.NumberInput(attrs={
                'class': 'form-control rating-input',
                'min': '0',
                'max': '10',
                'placeholder': '0-10'
            }),
            'impression_rating': forms.NumberInput(attrs={
                'class': 'form-control rating-input',
                'min': '0',
                'max': '10',
                'placeholder': '0-10'
            }),
            'want_rating': forms.CheckboxInput(attrs={
                'class': 'form-check-input',
                'id': 'want_rating_checkbox'
            }),
            'is_favorite': forms.CheckboxInput(attrs={
                'class': 'form-check-input'
            }),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Если нужно установить начальное значение
        # (для новых предложок не нужно, только для редактирования)

    def save(self, commit=True):
        submission = super().save(commit=False)
        # genre сохранится автоматически через ModelForm
        if commit:
            submission.save()
        return submission


# books/forms.py

# books/forms.py

class BookSubmissionAdminForm(forms.ModelForm):
    """Упрощенная форма для админа"""

    class Meta:
        model = BookSubmission
        fields = [
            'title', 'author', 'description', 'genre',
            'cover', 'cover_url', 'review',
        ]
        widgets = {
            'title': forms.TextInput(attrs={'class': 'form-control'}),
            'author': forms.TextInput(attrs={'class': 'form-control'}),
            'description': forms.Textarea(attrs={'rows': 5, 'class': 'form-control'}),
            'genre': forms.Select(attrs={'class': 'form-control'}),
            'cover': forms.FileInput(attrs={'class': 'form-control'}),
            'cover_url': forms.URLInput(attrs={'class': 'form-control'}),
            'review': forms.Textarea(attrs={'rows': 3, 'class': 'form-control'}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['cover'].required = False
        self.fields['cover_url'].required = False


# books/forms.py

class ReviewForm(forms.ModelForm):
    """Форма для рецензии (без обязательных оценок)"""

    class Meta:
        model = Review
        fields = [
            'character_depth',
            'idea_reveal',
            'readability',
            'relevance',
            'overall_impression',
            'comment'
        ]
        widgets = {
            'character_depth': forms.NumberInput(attrs={
                'type': 'range',
                'min': 0,
                'max': 10,
                'class': 'form-range rating-slider',
                'data-field': 'character_depth'
            }),
            'idea_reveal': forms.NumberInput(attrs={
                'type': 'range',
                'min': 0,
                'max': 10,
                'class': 'form-range rating-slider',
                'data-field': 'idea_reveal'
            }),
            'readability': forms.NumberInput(attrs={
                'type': 'range',
                'min': 0,
                'max': 10,
                'class': 'form-range rating-slider',
                'data-field': 'readability'
            }),
            'relevance': forms.NumberInput(attrs={
                'type': 'range',
                'min': 0,
                'max': 10,
                'class': 'form-range rating-slider',
                'data-field': 'relevance'
            }),
            'overall_impression': forms.NumberInput(attrs={
                'type': 'range',
                'min': 0,
                'max': 10,
                'class': 'form-range rating-slider',
                'data-field': 'overall_impression'
            }),
            'comment': forms.Textarea(attrs={
                'rows': 4,
                'class': 'form-control',
                'placeholder': 'Ваша рецензия на книгу...'
            })
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Делаем все поля необязательными
        for field in ['character_depth', 'idea_reveal', 'readability', 'relevance', 'overall_impression']:
            self.fields[field].required = False
            self.fields[field].widget.attrs.update({
                'oninput': f"document.getElementById('{field}_value').textContent = this.value || '?'"
            })

