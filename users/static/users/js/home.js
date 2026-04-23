// static/js/home.js

// Эффект ripple для кнопок
document.addEventListener('DOMContentLoaded', function() {
    // Добавляем эффект ripple для всех кнопок с data-btneffects-first
    const buttons = document.querySelectorAll('[data-btneffects-first="btneffects-ripple"]');
    buttons.forEach(function(button) {
        // Добавляем элемент для эффекта если его нет
        if (!button.querySelector('.t-btn_effects')) {
            button.insertAdjacentHTML('beforeend', '<div class="t-btn_effects"></div>');
            const buttonEffect = button.querySelector('.t-btn_effects');

            // Определяем размер эффекта
            if (button.offsetWidth > 260) {
                buttonEffect.classList.add('t-btn_effects_md');
            }
            if (button.offsetWidth > 360) {
                buttonEffect.classList.remove('t-btn_effects_md');
                buttonEffect.classList.add('t-btn_effects_lg');
            }
        }
    });

    // Кнопка "наверх"
    const scrollTopBtn = document.querySelector('.t890__arrow');
    const scrollTopContainer = document.querySelector('.t890');

    if (scrollTopBtn && scrollTopContainer) {
        // Показывать/скрывать кнопку при прокрутке
        window.addEventListener('scroll', function() {
            if (window.pageYOffset > 300) {
                scrollTopContainer.style.display = 'block';
            } else {
                scrollTopContainer.style.display = 'none';
            }
        });

        // Плавный скролл наверх
        scrollTopBtn.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // Инициализация эффектов кнопок после загрузки
    setTimeout(function() {
        buttons.forEach(function(button) {
            const effectDiv = button.querySelector('.t-btn_effects');
            if (effectDiv && !effectDiv.hasAttribute('data-initialized')) {
                effectDiv.setAttribute('data-initialized', 'true');
            }
        });
    }, 1000);
});

