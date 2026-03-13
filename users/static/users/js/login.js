document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.querySelector('.login-form');
    const loginBtn = document.querySelector('.login-btn');
    const inputs = document.querySelectorAll('.login-form input');

    // Функция проверки заполненности полей
    function checkFormValidity() {
        let isFormValid = true;

        inputs.forEach(input => {
            if (input.value.trim() === '') {
                isFormValid = false;
            }
        });

        // Активируем/деактивируем кнопку
        if (isFormValid) {
            loginBtn.classList.add('active');
            loginBtn.disabled = false;
        } else {
            loginBtn.classList.remove('active');
            loginBtn.disabled = true;
        }
    }

    // Добавляем обработчики событий на все поля
    inputs.forEach(input => {
        input.addEventListener('input', checkFormValidity);
        input.addEventListener('blur', checkFormValidity);
    });

    // Обработчик отправки формы
    if (loginForm && loginBtn) {
        loginForm.addEventListener('submit', function(e) {
            if (!loginBtn.classList.contains('active')) {
                e.preventDefault();
                return false;
            }
            loginBtn.classList.add('loading');
            loginBtn.textContent = 'Вход...';
        });
    }

    // Проверяем при загрузке страницы
    checkFormValidity();
});