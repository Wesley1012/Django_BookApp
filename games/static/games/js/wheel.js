// static/games/js/wheel.js

// ========== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ==========
// Они будут получены из window объекта, который мы передадим из шаблона

// ========== КЛАСС КОЛЕСА ==========
class Wheel {
    constructor(canvasId, segments) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error('Canvas not found:', canvasId);
            return;
        }
        this.ctx = this.canvas.getContext('2d');
        this.segments = segments || [];
        this.isSpinning = false;
        this.currentAngle = 0;

        // Параметры вращения как в примере
        this.spinAngle = 0;
        this.spinTime = 0;
        this.spinTimeTotal = 0;
        this.spinStartTime = null;
        this.animationFrame = null;

        this.init();
    }

    init() {
        this.drawWheel();
    }

    drawWheel() {
        if (!this.segments || this.segments.length === 0) {
            this.drawEmptyWheel();
            return;
        }

        const ctx = this.ctx;
        const canvas = this.canvas;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 20;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        let startAngle = this.currentAngle * Math.PI / 180;

        this.segments.forEach(segment => {
            const segmentAngle = segment.angle * Math.PI / 180;
            const endAngle = startAngle + segmentAngle;

            // Рисуем сектор
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath();

            // Заливка цветом
            ctx.fillStyle = segment.color;
            ctx.fill();

            // Обводка
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Текст (увеличенный шрифт)
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(startAngle + segmentAngle / 2);
            ctx.textAlign = 'center';
            ctx.fillStyle = '#000';
            ctx.font = 'bold 32px Arial';

            let text = segment.name;
            if (text.length > 12) {
                text = text.substring(0, 10) + '..';
            }

            ctx.fillText(text, radius * 0.7, 12);
            ctx.restore();

            startAngle = endAngle;
        });

        // Рисуем центральную точку как в примере
        ctx.beginPath();
        ctx.arc(centerX, centerY, 12, 0, 2 * Math.PI);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    drawEmptyWheel() {
        const ctx = this.ctx;
        const canvas = this.canvas;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 20;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fillStyle = '#f0f0f0';
        ctx.fill();
        ctx.strokeStyle = '#ccc';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#999';
        ctx.font = '18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Добавьте темы', centerX, centerY);

        // Центральная точка
        ctx.beginPath();
        ctx.arc(centerX, centerY, 12, 0, 2 * Math.PI);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.strokeStyle = '#ccc';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    updateSegments(newSegments) {
        this.segments = newSegments;
        this.drawWheel();
    }

    spin() {
        if (this.isSpinning) return;
        if (!this.segments || this.segments.length === 0) {
            alert('Добавьте темы для вращения!');
            return;
        }

        console.log('Spin started');
        this.isSpinning = true;

        // Как в примере: случайное количество оборотов (5-15 полных)
        const spins = Math.floor(Math.random() * 10) + 5;
        // Случайное смещение для результата
        const randomOffset = Math.random() * 360;

        // Общий угол вращения: полные обороты + случайное смещение
        this.spinAngle = spins * 360 + randomOffset;
        this.spinTime = 0;
        this.spinTimeTotal = Math.random() * 3000 + 4000; // 4-7 секунд как в примере
        this.spinStartTime = Date.now();

        // Меняем текст кнопки
        const spinButton = document.getElementById('spinButton');
        const spinText = document.getElementById('spinText');
        const spinSpinner = document.getElementById('spinSpinner');

        if (spinText) spinText.textContent = 'Вращается...';
        if (spinSpinner) spinSpinner.style.display = 'inline-block';
        if (spinButton) spinButton.disabled = true;

        // Скрываем предыдущий результат
        const resultDiv = document.getElementById('result');
        if (resultDiv) {
            resultDiv.style.display = 'none';
        }
        this.spinAnimation();
    }

    spinAnimation() {
        const now = Date.now();
        this.spinTime = now - this.spinStartTime;

        if (this.spinTime >= this.spinTimeTotal) {
            // Конец вращения
            this.isSpinning = false;

            // Определяем результат (берем текущий угол)
            const result = this.getResult();
            console.log('Spin ended, winner:', result);

            // Обновляем UI
            const spinButton = document.getElementById('spinButton');
            const spinText = document.getElementById('spinText');
            const spinSpinner = document.getElementById('spinSpinner');

            if (spinText) spinText.textContent = '🎯 Крутить колесо!';
            if (spinSpinner) spinSpinner.style.display = 'none';
            if (spinButton) spinButton.disabled = false;

            // Показываем результат
            this.showResult(result);

            // Отправляем результат на сервер
            this.sendResult(result);

            return;
        }

        // Плавное замедление как в примере (easing)
        const easing = this.easeOutCubic(this.spinTime / this.spinTimeTotal);
        const angle = (this.spinAngle * easing) % 360;
        this.currentAngle = angle;
        this.drawWheel();

        this.animationFrame = requestAnimationFrame(() => this.spinAnimation());
    }

    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    getResult() {
        let angle = this.currentAngle % 360;
        if (angle < 0) angle += 360;

        // В canvas 0 градусов - справа
        // Стрелка сверху - это 90 градусов в canvas
        const arrowAngle = (450 - angle) % 360;

        let currentAngle = 0;
        for (const segment of this.segments) {
            if (arrowAngle >= currentAngle && arrowAngle < currentAngle + segment.angle) {
                return segment;
            }
            currentAngle += segment.angle;
        }

        return this.segments[this.segments.length - 1];
    }

    showResult(segment) {
        const resultDiv = document.getElementById('result');
        const isElimination = document.getElementById('eliminationToggle')?.checked;

        if (resultDiv) {
            if (isElimination) {
                resultDiv.className = 'alert alert-warning';
                resultDiv.innerHTML = `
                    <strong>🎯 Выбывает: ${segment.name}</strong>
                    <br>
                    <small class="text-muted">Тема отправлена в выбывшие</small>
                `;
            } else {
                resultDiv.className = 'alert alert-success';
                resultDiv.innerHTML = `
                    <strong>🏆 Победитель: ${segment.name}</strong>
                `;
                // В обычном режиме скрываем через 5 секунд
                setTimeout(() => {
                    resultDiv.style.display = 'none';
                }, 5000);
            }
            resultDiv.style.display = 'block';
        }
    }

    sendResult(segment) {
        const isElimination = document.getElementById('eliminationToggle')?.checked;

        const formData = new FormData();
        formData.append('theme_name', segment.name);
        formData.append('is_elimination', isElimination);
        formData.append('csrfmiddlewaretoken', window.csrftoken);

        fetch(window.spinResultUrl, {
            method: 'POST',
            body: formData,
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                if (data.wheel_data && window.wheel) {
                    window.wheel.updateSegments(data.wheel_data);
                }
                if (data.eliminated) {
                    setTimeout(() => location.reload(), 5000);
                }
            }
        });
    }
}

// ========== ОСНОВНОЙ КОД ==========
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing wheel...');

    // Проверяем, что все глобальные переменные доступны
    console.log('wheelData:', window.wheelData);
    console.log('csrftoken:', window.csrftoken);

    // Инициализация колеса
    if (window.wheelData) {
        window.wheel = new Wheel('wheelCanvas', window.wheelData);
        console.log('Wheel initialized');
    }

    // КНОПКА ВРАЩЕНИЯ
    const spinButton = document.getElementById('spinButton');
    if (spinButton && window.wheel) {
        spinButton.addEventListener('click', function() {
            window.wheel.spin();
        });
    }

    // СОХРАНЕНИЕ СКРОЛЛА
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', function() {
            sessionStorage.setItem('wheelScroll', window.scrollY);
        });
    });

    const savedScroll = sessionStorage.getItem('wheelScroll');
    if (savedScroll) {
        window.scrollTo(0, parseInt(savedScroll));
        sessionStorage.removeItem('wheelScroll');
    }

    // ФОРМА ДОБАВЛЕНИЯ
    const probSlider = document.getElementById('probSlider');
    const probNumber = document.getElementById('probNumber');
    const probValue = document.getElementById('probValue');

    if (probSlider && probNumber && probValue) {
        const initialValue = probSlider.value;
        probNumber.value = initialValue;
        probValue.textContent = parseFloat(initialValue).toFixed(1);

        probSlider.addEventListener('input', function() {
            const val = parseFloat(this.value).toFixed(1);
            probNumber.value = val;
            probValue.textContent = val;
        });

        probNumber.addEventListener('input', function() {
            let val = parseFloat(this.value);
            if (isNaN(val)) val = 0;
            if (val < 0) val = 0;
            if (val > 100) val = 100;
            val = Math.round(val * 10) / 10;

            probSlider.value = val;
            probValue.textContent = val.toFixed(1);
        });
    }

    // ИНИЦИАЛИЗАЦИЯ ЗНАЧЕНИЙ ТЕМ
    function initializeThemeValues() {
        document.querySelectorAll('#activeThemesList .theme-item').forEach(themeItem => {
            const slider = themeItem.querySelector('.probability-update');
            const numberInput = themeItem.querySelector('.theme-probability-number');
            const probDisplay = themeItem.querySelector('.theme-probability');

            if (slider && numberInput) {
                const currentValue = slider.getAttribute('value');

                slider.value = currentValue;
                numberInput.value = parseFloat(currentValue).toFixed(1);
                if (probDisplay) {
                    probDisplay.textContent = parseFloat(currentValue).toFixed(1) + '%';
                }
            }
        });
    }

    initializeThemeValues();

    // ОБРАБОТЧИКИ ДЛЯ ТЕМ
    document.querySelectorAll('.probability-update').forEach(slider => {
        const themeId = slider.dataset.themeId;
        const numberInput = document.querySelector(`.theme-probability-number[data-theme-id="${themeId}"]`);
        const probDisplay = slider.closest('.theme-item').querySelector('.theme-probability');

        if (slider && numberInput) {
            function updateProbability(value) {
                const val = parseFloat(value).toFixed(1);

                slider.value = val;
                numberInput.value = val;
                if (probDisplay) probDisplay.textContent = val + '%';

                clearTimeout(window['probTimeout_' + themeId]);
                window['probTimeout_' + themeId] = setTimeout(() => {
                    const formData = new FormData();
                    formData.append('theme_id', themeId);
                    formData.append('probability', val);
                    formData.append('csrfmiddlewaretoken', window.csrftoken);

                    fetch(window.updateProbabilityUrl, {
                        method: 'POST',
                        body: formData,
                        headers: { 'X-Requested-With': 'XMLHttpRequest' }
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success && data.wheel_data && window.wheel) {
                            window.wheel.updateSegments(data.wheel_data);
                        }
                    });
                }, 500);
            }

            slider.addEventListener('input', function() {
                updateProbability(this.value);
            });

            numberInput.addEventListener('input', function() {
                let val = parseFloat(this.value);
                if (isNaN(val)) val = 0;
                if (val < 0) val = 0;
                if (val > 100) val = 100;
                val = Math.round(val * 10) / 10;

                updateProbability(val);
            });
        }
    });

    // ТОГГЛ РЕЖИМА НАВЫБЫВАНИЕ
    const eliminationToggle = document.getElementById('eliminationToggle');
    if (eliminationToggle) {
        eliminationToggle.addEventListener('change', function() {
            const formData = new FormData();
            formData.append('action', 'toggle_elimination');
            formData.append('csrfmiddlewaretoken', window.csrftoken);

            fetch(window.location.href, {
                method: 'POST',
                body: formData,
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            })
            .then(response => {
                if (response.ok) {
                    location.reload();
                }
            });
        });
    }

    // СБРОС НАВЫБЫВАНИЯ
    const resetBtn = document.getElementById('resetEliminationBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', function() {
            const formData = new FormData();
            formData.append('action', 'reset_elimination');
            formData.append('csrfmiddlewaretoken', window.csrftoken);

            fetch(window.location.href, {
                method: 'POST',
                body: formData,
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            })
            .then(response => {
                if (response.ok) {
                    location.reload();
                }
            });
        });
    }

    // БУТСТРАП ТАБЫ
    if (typeof bootstrap !== 'undefined') {
        const tabTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tab"]'));
        tabTriggerList.forEach(tabTriggerEl => {
            tabTriggerEl.addEventListener('click', function(e) {
                e.preventDefault();
                new bootstrap.Tab(this).show();
            });
        });
    }
});