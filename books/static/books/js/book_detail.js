document.addEventListener('DOMContentLoaded', function() {
    // Обновление значений ползунков
    const sliders = document.querySelectorAll('.rating-slider');
    sliders.forEach(slider => {
        const field = slider.dataset.field;
        const valueSpan = document.getElementById(field + '_value');
        if (valueSpan) {
            valueSpan.textContent = slider.value;

            slider.addEventListener('input', function() {
                valueSpan.textContent = this.value;
            });
        }
    });
});
    document.addEventListener('DOMContentLoaded', function() {
    // Функция для расчета и обновления общего балла
    window.updateTotalScore = function() {
        const character = parseFloat(document.getElementById('character_depth')?.value) || 0;
        const idea = parseFloat(document.getElementById('idea_reveal')?.value) || 0;
        const readability = parseFloat(document.getElementById('readability')?.value) || 0;
        const relevance = parseFloat(document.getElementById('relevance')?.value) || 0;
        const impression = parseFloat(document.getElementById('overall_impression')?.value) || 0;

        const total = (character + idea + readability + relevance + impression) / 5;
        document.getElementById('total_score_display').textContent = total.toFixed(1);
    };

    // Обновление значений ползунков
    const sliders = document.querySelectorAll('.rating-slider');
    sliders.forEach(slider => {
        const field = slider.dataset.field;
        const valueSpan = document.getElementById(field + '_value');
        if (valueSpan) {
            valueSpan.textContent = slider.value;

            slider.addEventListener('input', function() {
                valueSpan.textContent = this.value;
                updateTotalScore(); // Обновляем общий балл при изменении
            });
        }
    });

    // Первоначальный расчет
    updateTotalScore();
});