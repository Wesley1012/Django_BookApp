from django import forms
from .models import WheelTheme, WheelConfiguration

class WheelThemeForm(forms.ModelForm):
    class Meta:
        model = WheelTheme
        fields = ['name', 'probability', 'color']
        widgets = {
            'probability': forms.NumberInput(attrs={
                'min': 0.1,
                'max': 100,
                'step': 0.1,
                'class': 'form-control'
            }),
            'color': forms.TextInput(attrs={'type': 'color', 'class': 'form-control'}),
        }

class WheelConfigurationForm(forms.ModelForm):
    class Meta:
        model = WheelConfiguration
        fields = ['name', 'mode', 'sectors_count', 'spin_duration']
        widgets = {
            'sectors_count': forms.NumberInput(attrs={'min': 3, 'max': 50}),
            'spin_duration': forms.NumberInput(attrs={'min': 1, 'max': 60}),
        }