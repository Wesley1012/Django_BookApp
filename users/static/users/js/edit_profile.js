

function deleteAvatar() {
    if (confirm('Удалить текущий аватар?')) {
        document.getElementById('delete-avatar-form').submit();
    }
}

// Переменные для кадрирования
let originalImage = null;
let cropX = 0, cropY = 0;
let isDragging = false;
let startX = 0, startY = 0;
let cropSize = 150; // Начальный размер
let canvasWidth = 0, canvasHeight = 0;

// Начало кадрирования
function startCrop(input) {
    if (input.files && input.files[0]) {
        const file = input.files[0];

        // Валидация
        if (file.size > 5 * 1024 * 1024) {
            alert('Файл слишком большой (макс. 5MB)');
            input.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            originalImage = new Image();
            originalImage.onload = function() {
                // Автоматически подбираем размер круга
                autoSizeCrop();
                setupCropCanvas();
            };
            originalImage.src = e.target.result;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// Автоматический подбор размера круга
function autoSizeCrop() {
    const img = originalImage;
    const minDimension = Math.min(img.width, img.height);

    // Размер круга = 70% от минимального измерения
    // Но не больше 250px и не меньше 100px
    cropSize = Math.min(250, Math.max(100, Math.floor(minDimension * 0.7)));

    console.log(`Авторазмер круга: ${cropSize}px (изображение: ${img.width}x${img.height})`);
}

// Настройка canvas для кадрирования
function setupCropCanvas() {
    const container = document.querySelector('.crop-container');
    const canvas = document.getElementById('crop-canvas');
    const ctx = canvas.getContext('2d');

    // Размеры canvas (максимум 500px)
    const maxSize = 500;
    let width = originalImage.width;
    let height = originalImage.height;

    // Масштабирование если изображение слишком большое
    if (width > maxSize || height > maxSize) {
        const ratio = Math.min(maxSize / width, maxSize / height);
        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);
    }

    canvasWidth = width;
    canvasHeight = height;
    canvas.width = width;
    canvas.height = height;

    // Отрисовка изображения
    ctx.drawImage(originalImage, 0, 0, width, height);

    // Начальные координаты кадрирования (по центру)
    cropX = Math.max(0, (width - cropSize) / 2);
    cropY = Math.max(0, (height - cropSize) / 2);

    // Показываем элементы кадрирования
    container.style.display = 'block';
    document.querySelector('.crop-preview').style.display = 'block';
    document.querySelector('.crop-controls').style.display = 'block';

    // Добавляем элементы управления размером
    addSizeControls();

    // Скрываем текущий аватар
    document.querySelector('#current-avatar').parentElement.style.display = 'none';

    // Рисуем область кадрирования
    drawCropArea();

    // Добавляем обработчики мыши
    canvas.addEventListener('mousedown', startDrag);
    canvas.addEventListener('mousemove', drag);
    canvas.addEventListener('mouseup', endDrag);
    canvas.addEventListener('mouseleave', endDrag);

    // Добавляем обработчики сенсорного ввода для мобильных
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd);
    canvas.addEventListener('touchcancel', handleTouchEnd);
}

// Добавляем кнопки изменения размера круга
function addSizeControls() {
    const controls = document.querySelector('.crop-controls');

    // Если кнопок еще нет - добавляем
    if (!document.getElementById('size-controls')) {
        const sizeControls = document.createElement('div');
        sizeControls.id = 'size-controls';
        sizeControls.className = 'mt-2 text-center';
        sizeControls.innerHTML = `
            <small class="me-2">Размер круга:</small>
            <div class="btn-group btn-group-sm">
                <button type="button" class="btn btn-outline-secondary" onclick="changeCropSize(-20)" title="Уменьшить">
                    <i class="bi bi-dash"></i>
                </button>
                <button type="button" class="btn btn-outline-secondary" disabled style="min-width: 60px;">
                    ${cropSize}px
                </button>
                <button type="button" class="btn btn-outline-secondary" onclick="changeCropSize(20)" title="Увеличить">
                    <i class="bi bi-plus"></i>
                </button>
            </div>
        `;
        controls.appendChild(sizeControls);
    }
}
// Обработчики сенсорного ввода
function handleTouchStart(e) {
    e.preventDefault(); // Предотвращаем прокрутку страницы
    const touch = e.touches[0];

    // Создаем псевдо-событие мыши из touch-события
    const mouseEvent = {
        target: e.target,
        clientX: touch.clientX,
        clientY: touch.clientY
    };

    startDrag(mouseEvent);
}

function handleTouchMove(e) {
    e.preventDefault(); // Предотвращаем прокрутку страницы

    if (!isDragging) return;

    const touch = e.touches[0];

    // Создаем псевдо-событие мыши из touch-события
    const mouseEvent = {
        target: e.target,
        clientX: touch.clientX,
        clientY: touch.clientY
    };

    drag(mouseEvent);
}

function handleTouchEnd(e) {
    e.preventDefault();
    endDrag();
}

// Изменение размера круга
function changeCropSize(delta) {
    const minSize = 50; // Минимальный размер
    const maxSize = Math.min(canvasWidth, canvasHeight) - 10; // Максимальный размер

    cropSize += delta;

    // Ограничиваем размер
    if (cropSize < minSize) cropSize = minSize;
    if (cropSize > maxSize) cropSize = maxSize;

    // Обновляем отображение размера
    const sizeDisplay = document.querySelector('#size-controls .btn-group .btn[disabled]');
    if (sizeDisplay) {
        sizeDisplay.textContent = `${cropSize}px`;
    }

    // Корректируем положение если круг выходит за границы
    cropX = Math.max(0, Math.min(cropX, canvasWidth - cropSize));
    cropY = Math.max(0, Math.min(cropY, canvasHeight - cropSize));

    drawCropArea();
}

// Рисование области кадрирования
function drawCropArea() {
    const canvas = document.getElementById('crop-canvas');
    const ctx = canvas.getContext('2d');
    const previewCanvas = document.getElementById('preview-canvas');
    const previewCtx = previewCanvas.getContext('2d');

    // Очищаем canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);

    // Затемняем ВСЁ
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Возвращаем нормальную яркость в области круга
    ctx.save();
    ctx.beginPath();
    ctx.arc(cropX + cropSize/2, cropY + cropSize/2, cropSize/2, 0, Math.PI * 2);
    ctx.clip(); // Ограничиваем область рисования кругом

    // Рисуем оригинальное изображение поверх затемнения
    ctx.globalCompositeOperation = 'source-over'; // Обычный режим наложения
    ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);

    ctx.restore();

    // Рисуем обводку круга
    ctx.beginPath();
    ctx.arc(cropX + cropSize/2, cropY + cropSize/2, cropSize/2, 0, Math.PI * 2);
    ctx.strokeStyle = '#007bff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Рисуем уголки для изменения размера
    drawResizeHandles(ctx);

    // Обновляем превью
    updatePreview();
}

// Рисуем ручки для изменения размера
function drawResizeHandles(ctx) {
    const handleSize = 8;
    const positions = [
        [cropX, cropY], // левый верхний
        [cropX + cropSize, cropY], // правый верхний
        [cropX, cropY + cropSize], // левый нижний
        [cropX + cropSize, cropY + cropSize] // правый нижний
    ];

    ctx.fillStyle = '#007bff';
    positions.forEach(([x, y]) => {
        ctx.fillRect(x - handleSize/2, y - handleSize/2, handleSize, handleSize);
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1;
        ctx.strokeRect(x - handleSize/2, y - handleSize/2, handleSize, handleSize);
    });
}

// Обновление превью
function updatePreview() {
    const previewCanvas = document.getElementById('preview-canvas');
    const previewCtx = previewCanvas.getContext('2d');

    previewCanvas.width = 100;
    previewCanvas.height = 100;

    // Создаем круглое превью
    previewCtx.save();
    previewCtx.beginPath();
    previewCtx.arc(50, 50, 50, 0, Math.PI * 2);
    previewCtx.clip();

    // Рисуем обрезанное изображение
    const sourceCanvas = document.getElementById('crop-canvas');
    previewCtx.drawImage(
        sourceCanvas,
        cropX, cropY, cropSize, cropSize, // source
        0, 0, 100, 100 // destination
    );

    previewCtx.restore();
}

// Перетаскивание области кадрирования
function startDrag(e) {
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Проверяем, кликнули ли внутри области кадрирования
    const distX = x - (cropX + cropSize/2);
    const distY = y - (cropY + cropSize/2);
    const distance = Math.sqrt(distX * distX + distY * distY);

    // Проверяем, кликнули ли на ручку изменения размера
    const handleSize = 8;
    const handles = [
        [cropX, cropY], // левый верхний
        [cropX + cropSize, cropY], // правый верхний
        [cropX, cropY + cropSize], // левый нижний
        [cropX + cropSize, cropY + cropSize] // правый нижний
    ];

    for (let [hx, hy] of handles) {
        if (Math.abs(x - hx) <= handleSize && Math.abs(y - hy) <= handleSize) {
            // Изменение размера
            isDragging = true;
            startX = x;
            startY = y;
            return;
        }
    }

    if (distance <= cropSize/2) {
        // Перемещение
        isDragging = true;
        startX = x - cropX;
        startY = y - cropY;
    }
}

function drag(e) {
    if (!isDragging) return;

    const canvas = document.getElementById('crop-canvas');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Определяем, меняем размер или перемещаем
    const handleSize = 8;
    const startHandleX = startX + cropX;
    const startHandleY = startY + cropY;

    // Если начали с угла - меняем размер
    if (Math.abs(startHandleX - cropX) <= handleSize && Math.abs(startHandleY - cropY) <= handleSize) {
        // Левый верхний угол
        const newSize = cropSize + (cropX - x);
        if (newSize >= 50 && newSize <= Math.min(canvasWidth, canvasHeight)) {
            cropSize = newSize;
            cropX = x;
            cropY = y;
        }
    } else if (Math.abs(startHandleX - (cropX + cropSize)) <= handleSize && Math.abs(startHandleY - cropY) <= handleSize) {
        // Правый верхний угол
        const newSize = x - cropX;
        if (newSize >= 50 && newSize <= Math.min(canvasWidth, canvasHeight)) {
            cropSize = newSize;
            cropY = y;
        }
    } else if (Math.abs(startHandleX - cropX) <= handleSize && Math.abs(startHandleY - (cropY + cropSize)) <= handleSize) {
        // Левый нижний угол
        const newSize = y - cropY;
        if (newSize >= 50 && newSize <= Math.min(canvasWidth, canvasHeight)) {
            cropSize = newSize;
            cropX = x;
        }
    } else if (Math.abs(startHandleX - (cropX + cropSize)) <= handleSize && Math.abs(startHandleY - (cropY + cropSize)) <= handleSize) {
        // Правый нижний угол
        const newSize = Math.min(x - cropX, y - cropY);
        if (newSize >= 50 && newSize <= Math.min(canvasWidth, canvasHeight)) {
            cropSize = newSize;
        }
    } else {
        // Перемещение
        cropX = Math.max(0, Math.min(x - startX, canvas.width - cropSize));
        cropY = Math.max(0, Math.min(y - startY, canvas.height - cropSize));
    }

    drawCropArea();

    // Обновляем отображение размера
    const sizeDisplay = document.querySelector('#size-controls .btn-group .btn[disabled]');
    if (sizeDisplay) {
        sizeDisplay.textContent = `${cropSize}px`;
    }
}

function endDrag() {
    isDragging = false;
}

// Применение кадрирования
function applyCrop() {
    const canvas = document.getElementById('crop-canvas');
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = cropSize;
    finalCanvas.height = cropSize;
    const ctx = finalCanvas.getContext('2d');

    // Создаем круглое изображение
    ctx.save();
    ctx.beginPath();
    ctx.arc(cropSize/2, cropSize/2, cropSize/2, 0, Math.PI * 2);
    ctx.clip();

    // Копируем область
    ctx.drawImage(canvas, cropX, cropY, cropSize, cropSize, 0, 0, cropSize, cropSize);
    ctx.restore();

    // Сохраняем как data URL (base64)
    const croppedImage = finalCanvas.toDataURL('image/png');

    // 1. Сохраняем в скрытое поле для отправки на сервер
    document.getElementById('cropped-avatar').value = croppedImage;

    // 2. Обновляем превью аватара
    const avatarImg = document.getElementById('current-avatar');
    if (!avatarImg || avatarImg.tagName !== 'IMG') {
        const avatarContainer = document.querySelector('#current-avatar').parentElement;
        avatarContainer.innerHTML = `<img id="current-avatar" src="${croppedImage}"
                                         style="width:100%;height:100%;object-fit:cover;">`;
    } else {
        avatarImg.src = croppedImage;
    }

    // 3. Сохраняем данные кадрирования для сервера (опционально)
    const cropCanvas = document.getElementById('crop-canvas');
    const scaleX = originalImage.width / cropCanvas.width;
    const scaleY = originalImage.height / cropCanvas.height;

    document.getElementById('crop-data').value = JSON.stringify({
        x: Math.round(cropX * scaleX),
        y: Math.round(cropY * scaleY),
        size: Math.round(cropSize * Math.min(scaleX, scaleY))
    });

    // 4. Скрываем элементы кадрирования
    cancelCrop();
}

// Отмена кадрирования
function cancelCrop() {
    document.querySelector('.crop-container').style.display = 'none';
    document.querySelector('.crop-preview').style.display = 'none';
    document.querySelector('.crop-controls').style.display = 'none';
    document.querySelector('#current-avatar').parentElement.style.display = 'block';

    // Удаляем элементы управления размером
    const sizeControls = document.getElementById('size-controls');
    if (sizeControls) {
        sizeControls.remove();
    }

    document.getElementById('avatar-file').value = '';
}

// Остальные функции остаются без изменений...
function previewAvatarUrl(input) {
    if (input.value && input.value.startsWith('http')) {
        // Создаем временное изображение для проверки
        const tempImg = new Image();

        tempImg.onload = function() {
            // Обновляем аватар
            const avatarImg = document.getElementById('current-avatar');
            if (avatarImg && avatarImg.tagName === 'IMG') {
                avatarImg.src = input.value;
            } else {
                const avatarContainer = document.querySelector('#current-avatar').parentElement;
                avatarContainer.innerHTML = `<img id="current-avatar" src="${input.value}"
                                             style="width:100%;height:100%;object-fit:cover;">`;
            }

            // Скрываем элементы кадрирования если они были открыты
            cancelCrop();

            // Очищаем поле файла
            document.getElementById('avatar-file').value = '';

            // Очищаем данные кадрирования
            document.getElementById('crop-data').value = '';
            document.getElementById('cropped-avatar').value = '';

            // Показываем кнопку удаления если была скрыта
            const deleteBtn = document.querySelector('button[onclick="deleteAvatar()"]');
            if (deleteBtn) {
                deleteBtn.style.display = 'inline-block';
            }
        };

        tempImg.onerror = function() {
            alert('Не удалось загрузить изображение по этой ссылке. Проверьте URL.');
            input.value = '';
        };

        // Устанавливаем кросс-ориджин для загрузки изображений с других доменов
        tempImg.crossOrigin = 'anonymous';
        tempImg.src = input.value;
    } else if (input.value === '') {
        // Если поле очищено - показываем дефолтный аватар
        const avatarContainer = document.querySelector('#current-avatar').parentElement;
        avatarContainer.innerHTML = `
            <div class="w-100 h-100 bg-light d-flex align-items-center justify-content-center">
                <span style="font-size: 4rem;">👤</span>
            </div>
        `;
    }
}
function cropUrlImage(url) {
    const tempImg = new Image();
    tempImg.crossOrigin = 'anonymous';

    tempImg.onload = function() {
        originalImage = tempImg;
        autoSizeCrop();
        setupCropCanvas();
    };

    tempImg.onerror = function() {
        alert('Не удалось загрузить изображение для кадрирования');
    };

    tempImg.src = url;
}

// Обнови поле URL чтобы можно было кадрировать
function previewAvatarUrl(input) {
    if (input.value && input.value.startsWith('http')) {
        // Создаем временное изображение для проверки
        const tempImg = new Image();
        tempImg.crossOrigin = 'anonymous';

        tempImg.onload = function() {
            // Обновляем превью
            const avatarImg = document.getElementById('current-avatar');
            if (avatarImg && avatarImg.tagName === 'IMG') {
                avatarImg.src = input.value;
            } else {
                const avatarContainer = document.querySelector('#current-avatar').parentElement;
                avatarContainer.innerHTML = `<img id="current-avatar" src="${input.value}"
                                             style="width:100%;height:100%;object-fit:cover;">`;
            }

            // Добавляем кнопку "Кадрировать" для URL фото
            addCropButtonForUrl(input.value);

            // Очищаем поле файла
            document.getElementById('avatar-file').value = '';

            // Очищаем предыдущие данные кадрирования
            document.getElementById('crop-data').value = '';
            document.getElementById('cropped-avatar').value = '';
        };

        tempImg.onerror = function() {
            alert('Не удалось загрузить изображение по этой ссылке. Проверьте URL.');
            input.value = '';
        };

        tempImg.src = input.value;
    } else if (input.value === '') {
        // Если поле очищено
        const avatarContainer = document.querySelector('#current-avatar').parentElement;
        avatarContainer.innerHTML = `
            <div class="w-100 h-100 bg-light d-flex align-items-center justify-content-center">
                <span style="font-size: 4rem;">👤</span>
            </div>
        `;

        // Убираем кнопку кадрирования если была
        removeUrlCropButton();
    }
}

// Добавляем кнопку кадрирования для URL фото
function addCropButtonForUrl(url) {
    // Убираем старую кнопку если есть
    removeUrlCropButton();

    // Создаем новую кнопку
    const urlContainer = document.querySelector('input[name="avatar_url"]').parentElement;
    const cropButton = document.createElement('button');
    cropButton.type = 'button';
    cropButton.className = 'btn btn-sm btn-outline-primary mt-2';
    cropButton.innerHTML = '✂️ Кадрировать это фото';
    cropButton.onclick = function() {
        cropUrlImage(url);
    };
    cropButton.id = 'url-crop-button';

    urlContainer.appendChild(cropButton);
}

// Убираем кнопку кадрирования для URL
function removeUrlCropButton() {
    const existingButton = document.getElementById('url-crop-button');
    if (existingButton) {
        existingButton.remove();
    }
}

// В функции cancelCrop добавь удаление кнопки URL кадрирования
function cancelCrop() {
    document.querySelector('.crop-container').style.display = 'none';
    document.querySelector('.crop-preview').style.display = 'none';
    document.querySelector('.crop-controls').style.display = 'none';
    document.querySelector('#current-avatar').parentElement.style.display = 'block';

    // Удаляем элементы управления размером
    const sizeControls = document.getElementById('size-controls');
    if (sizeControls) {
        sizeControls.remove();
    }

    // Удаляем кнопку кадрирования для URL если была
    removeUrlCropButton();

    document.getElementById('avatar-file').value = '';
}
function cropCurrentUrlImage() {
    const urlInput = document.getElementById('avatar-url-input');
    const url = urlInput.value;

    if (!url || !url.startsWith('http')) {
        alert('Введите корректную ссылку на изображение');
        return;
    }

    cropUrlImage(url);
}
// Простая версия - только предпросмотр без кадрирования
function previewAvatarUrl(input) {
    const url = input.value.trim();

    if (!url) {
        // Поле пустое
        const avatarContainer = document.querySelector('#current-avatar').parentElement;
        avatarContainer.innerHTML = `
            <div class="w-100 h-100 bg-light d-flex align-items-center justify-content-center">
                <span style="font-size: 4rem;">👤</span>
            </div>
        `;
        return;
    }

    if (!url.startsWith('http')) {
        alert('Введите корректный URL');
        return;
    }

    // Просто устанавливаем src, браузер сам попробует загрузить
    const avatarImg = document.getElementById('current-avatar');

    if (avatarImg && avatarImg.tagName === 'IMG') {
        avatarImg.src = url;
    } else {
        const avatarContainer = document.querySelector('#current-avatar').parentElement;
        avatarContainer.innerHTML = `
            <img id="current-avatar" src="${url}"
                 style="width:100%;height:100%;object-fit:cover;"
                 onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\"w-100 h-100 bg-light d-flex align-items-center justify-content-center\"><span style=\"font-size:4rem;\">👤</span></div>'; alert('Не удалось загрузить изображение');">
        `;
    }

    // Очищаем поле файла
    document.getElementById('avatar-file').value = '';

    // Очищаем данные кадрирования (для URL не поддерживаем кадрирование)
    document.getElementById('crop-data').value = '';
    document.getElementById('cropped-avatar').value = '';

    // Скрываем элементы кадрирования если они были открыты
    cancelCrop();
}