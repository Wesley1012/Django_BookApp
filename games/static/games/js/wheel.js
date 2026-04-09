// static/games/js/wheel.js

// ========== ФУНКЦИЯ ДЛЯ ПОЛУЧЕНИЯ CSRF ТОКЕНА ==========
function getCsrfToken() {
    const cookieMatch = document.cookie.match(/csrftoken=([^;]+)/);
    if (cookieMatch && cookieMatch[1]) {
        return cookieMatch[1];
    }
    const tokenInput = document.querySelector('[name=csrfmiddlewaretoken]');
    if (tokenInput && tokenInput.value) {
        return tokenInput.value;
    }
    console.warn('CSRF token not found');
    return '';
}

// ========== УНИВЕРСАЛЬНАЯ ФУНКЦИЯ ДЛЯ POST ==========
async function postFormData(url, formData) {
    const csrfToken = getCsrfToken();
    formData.append('csrfmiddlewaretoken', csrfToken);

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'same-origin',
        body: formData
    });

    if (!response.ok) {
        const text = await response.text();
        console.error('Response error:', text.substring(0, 200));
        throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
}

// ========== КЛАСС КОЛЕСА (оставляем без изменений) ==========
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

            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath();

            ctx.fillStyle = segment.color;
            ctx.fill();
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.stroke();

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

        const spins = Math.floor(Math.random() * 10) + 5;
        const randomOffset = Math.random() * 360;
        this.spinAngle = spins * 360 + randomOffset;
        this.spinTime = 0;
        this.spinTimeTotal = Math.random() * 3000 + 4000;
        this.spinStartTime = Date.now();

        const spinButton = document.getElementById('spinButton');
        const spinText = document.getElementById('spinText');
        const spinSpinner = document.getElementById('spinSpinner');

        if (spinText) spinText.textContent = 'Вращается...';
        if (spinSpinner) spinSpinner.style.display = 'inline-block';
        if (spinButton) spinButton.disabled = true;

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
            this.isSpinning = false;
            const result = this.getResult();
            console.log('Spin ended, winner:', result);

            const spinButton = document.getElementById('spinButton');
            const spinText = document.getElementById('spinText');
            const spinSpinner = document.getElementById('spinSpinner');

            if (spinText) spinText.textContent = '🎯 Крутить колесо!';
            if (spinSpinner) spinSpinner.style.display = 'none';
            if (spinButton) spinButton.disabled = false;

            this.showResult(result);
            this.sendResult(result);
            return;
        }

        const easing = 1 - Math.pow(1 - this.spinTime / this.spinTimeTotal, 3);
        const angle = (this.spinAngle * easing) % 360;
        this.currentAngle = angle;
        this.drawWheel();

        this.animationFrame = requestAnimationFrame(() => this.spinAnimation());
    }

    getResult() {
        let angle = this.currentAngle % 360;
        if (angle < 0) angle += 360;
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
                resultDiv.innerHTML = `<strong>🏆 Победитель: ${segment.name}</strong>`;
                setTimeout(() => {
                    resultDiv.style.display = 'none';
                }, 5000);
            }
            resultDiv.style.display = 'block';
        }
    }

    async sendResult(segment) {
        const isElimination = document.getElementById('eliminationToggle')?.checked;

        const formData = new FormData();
        formData.append('theme_name', segment.name);
        formData.append('is_elimination', isElimination);

        try {
            const data = await postFormData(window.spinResultUrl, formData);
            if (data.success) {
                if (data.wheel_data && window.wheel) {
                    window.wheel.updateSegments(data.wheel_data);
                }
                if (data.eliminated) {
                    setTimeout(() => location.reload(), 5000);
                }
            }
        } catch (error) {
            console.error('Error sending result:', error);
        }
    }
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing wheel...');
    console.log('CSRF token exists:', !!getCsrfToken());

    if (window.wheelData) {
        window.wheel = new Wheel('wheelCanvas', window.wheelData);
        console.log('Wheel initialized');
    }

    // Кнопка вращения
    const spinButton = document.getElementById('spinButton');
    if (spinButton && window.wheel) {
        spinButton.addEventListener('click', () => window.wheel.spin());
    }

    // Сохранение скролла
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', () => {
            sessionStorage.setItem('wheelScroll', window.scrollY);
        });
    });

    const savedScroll = sessionStorage.getItem('wheelScroll');
    if (savedScroll) {
        window.scrollTo(0, parseInt(savedScroll));
        sessionStorage.removeItem('wheelScroll');
    }

    // Форма добавления темы
    const probSlider = document.getElementById('probSlider');
    const probNumber = document.getElementById('probNumber');
    const probValue = document.getElementById('probValue');

    if (probSlider && probNumber && probValue) {
        const updateProbDisplay = () => {
            const val = parseFloat(probSlider.value).toFixed(1);
            probNumber.value = val;
            probValue.textContent = val;
        };

        probSlider.addEventListener('input', updateProbDisplay);
        probNumber.addEventListener('input', function() {
            let val = parseFloat(this.value);
            if (isNaN(val)) val = 0;
            val = Math.min(100, Math.max(0, val));
            val = Math.round(val * 10) / 10;
            probSlider.value = val;
            probValue.textContent = val.toFixed(1);
        });
    }

    // Обновление вероятности тем
    document.querySelectorAll('.probability-update').forEach(slider => {
        const themeId = slider.dataset.themeId;
        const numberInput = document.querySelector(`.theme-probability-number[data-theme-id="${themeId}"]`);
        const probDisplay = slider.closest('.theme-item')?.querySelector('.theme-probability');

        if (!numberInput) return;

        let timeoutId;
        const update = async (value) => {
            const val = parseFloat(value).toFixed(1);
            slider.value = val;
            numberInput.value = val;
            if (probDisplay) probDisplay.textContent = val + '%';

            clearTimeout(timeoutId);
            timeoutId = setTimeout(async () => {
                const formData = new FormData();
                formData.append('theme_id', themeId);
                formData.append('probability', val);

                try {
                    const data = await postFormData(window.updateProbabilityUrl, formData);
                    if (data.success && data.wheel_data && window.wheel) {
                        window.wheel.updateSegments(data.wheel_data);
                    }
                } catch (error) {
                    console.error('Error updating probability:', error);
                }
            }, 500);
        };

        slider.addEventListener('input', e => update(e.target.value));
        numberInput.addEventListener('input', e => update(e.target.value));
    });

    // Bootstrap tabs
    if (typeof bootstrap !== 'undefined') {
        document.querySelectorAll('[data-bs-toggle="tab"]').forEach(tab => {
            tab.addEventListener('click', e => {
                e.preventDefault();
                new bootstrap.Tab(tab).show();
            });
        });
    }
});