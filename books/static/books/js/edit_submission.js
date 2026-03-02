// Предпросмотр обложки при выборе файла
document.getElementById('id_cover').addEventListener('change', function(e) {
    if (this.files && this.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            // Создаем или обновляем изображение предпросмотра
            let preview = document.getElementById('cover-preview');
            if (!preview) {
                preview = document.createElement('img');
                preview.id = 'cover-preview';
                preview.style.maxHeight = '150px';
                preview.className = 'img-thumbnail mt-2';
                this.parentNode.appendChild(preview);
            }
            preview.src = e.target.result;
        }.bind(this);
        reader.readAsDataURL(this.files[0]);
    }
});