document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    const registerBtn = document.getElementById('registerBtn');
    const inputs = document.querySelectorAll('.register-form input');

    // Функция проверки заполненности полей
    function checkFormValidity() {
        let allFilled = true;

        inputs.forEach(input => {
            if (input.value.trim() === '') {
                allFilled = false;
            }
        });

        if (allFilled) {
            registerBtn.classList.add('active');
            registerBtn.disabled = false;
        } else {
            registerBtn.classList.remove('active');
            registerBtn.disabled = true;
        }
    }

    // Добавляем обработчики на все поля
    inputs.forEach(input => {
        input.addEventListener('input', checkFormValidity);
        input.addEventListener('blur', checkFormValidity);
    });

    // Проверяем при загрузке
    checkFormValidity();
});