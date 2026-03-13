// Показ/скрытие секции оценок
const wantRatingCheckbox = document.getElementById('{{ form.want_rating.id_for_label }}');
const ratingSection = document.getElementById('ratingSection');

function toggleRatingSection() {
    ratingSection.style.display = wantRatingCheckbox.checked ? 'block' : 'none';
    if (!wantRatingCheckbox.checked) {
        // Сбрасываем все ползунки если оценки не нужны
        document.querySelectorAll('#ratingSection input[type="range"]').forEach(slider => {
            slider.value = 0;
            updateValue(slider.name.replace('_rating', ''), 0);
        });
        calculateTotal();
    }
}

// Обновление значения рядом с ползунком
function updateValue(type, value) {
    document.getElementById(type + '_value').textContent = value;
}

// Расчет общей оценки
function calculateTotal() {
    const sliders = document.querySelectorAll('#ratingSection input[type="range"]');
    let total = 0;

    sliders.forEach(slider => {
        total += parseInt(slider.value);
    });

    const avg = (total / 5).toFixed(1);
    document.getElementById('total_rating').textContent = avg;
    return avg;
}

// Инициализация
toggleRatingSection();
calculateTotal();
wantRatingCheckbox.addEventListener('change', toggleRatingSection);