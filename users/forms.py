from django.contrib.auth import get_user_model
from django.contrib.auth.forms import UserCreationForm
from django import forms
from django.utils.translation import gettext_lazy as _



User = get_user_model()

class UserCreationForm(UserCreationForm):
    first_name = forms.CharField(
        label=_("Имя"),
        max_length=254,
        required=True)

    last_name = forms.CharField(
        label=_("Фамилия"),
        max_length=254,
        required=True)

    email = forms.EmailField(
        label=_("Email"),
        max_length=254,
        widget=forms.EmailInput(attrs={"autocomplete": "email"}),
    )


    class Meta(UserCreationForm.Meta):
        model = User
        fields = ("first_name", "last_name", "email", "password1", "password2")


class ProfileUpdateForm(forms.ModelForm):
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email', 'avatar', 'avatar_url', 'bio']
        widgets = {
            'bio': forms.Textarea(attrs={'rows': 4, 'placeholder': 'Расскажите немного о себе...'}),
            'avatar_url': forms.URLInput(attrs={'placeholder': 'https://example.com/avatar.jpg'}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['email'].widget.attrs['readonly'] = True
        self.fields['email'].help_text = "Email нельзя изменить"