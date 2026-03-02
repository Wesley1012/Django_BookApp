// JavaScript для сортировки и поиска
document.addEventListener('DOMContentLoaded', function() {
    const sortSelect = document.getElementById('sortSelect');
    const sortOrderBtn = document.getElementById('sortOrderBtn');
    const tableContainer = document.querySelector('.table-responsive');
    const tableBody = document.querySelector('tbody');

    // Получаем текущие параметры поиска
    const searchParams = new URLSearchParams(window.location.search);
    const searchQuery = searchParams.get('search') || '';

    // Функция для обновления таблицы через AJAX
    function updateTable(sortBy, order) {
        // Сохраняем позицию скролла относительно таблицы
        const tableTop = tableContainer.getBoundingClientRect().top;
        const scrollPosition = window.scrollY;
        const offsetFromTable = tableTop; // сколько пикселей от верха до таблицы

        // Показываем индикатор загрузки
        tableContainer.style.opacity = '0.5';

        // Формируем URL с параметрами
        let url = window.location.pathname + `?sort=${sortBy}&order=${order}`;
        if (searchQuery) {
            url += `&search=${encodeURIComponent(searchQuery)}`;
        }

        // Отправляем AJAX запрос
        fetch(url, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => response.text())
        .then(html => {
            // Создаем временный элемент и парсим новую таблицу
            const temp = document.createElement('div');
            temp.innerHTML = html;

            // Находим новый tbody
            const newTbody = temp.querySelector('tbody');
            if (newTbody) {
                tableBody.innerHTML = newTbody.innerHTML;
            }

            // Обновляем иконки сортировки в заголовках
            updateSortIcons(sortBy, order);

            // Убираем индикатор загрузки
            tableContainer.style.opacity = '1';

            // Восстанавливаем позицию скролла
            // Прокручиваем к тому же месту, где была таблица
            const newTableTop = tableContainer.getBoundingClientRect().top;
            window.scrollTo(0, scrollPosition - offsetFromTable + newTableTop);
        })
        .catch(error => {
            console.error('Error:', error);
            tableContainer.style.opacity = '1';
        });
    }

    // Функция обновления иконок сортировки
    function updateSortIcons(sortBy, order) {
        // Убираем все иконки
        document.querySelectorAll('.table-dark th a i').forEach(icon => icon.remove());

        // Добавляем иконку к активному заголовку
        const activeLink = document.querySelector(`.table-dark th a[href*="sort=${sortBy}"]`);
        if (activeLink) {
            const icon = document.createElement('i');
            icon.className = `fas fa-sort-${order === 'desc' ? 'down' : 'up'} ms-1`;
            activeLink.appendChild(icon);
        }
    }

    // Обработчик выбора сортировки
    sortSelect.addEventListener('change', function() {
        const sortBy = this.value;
        const order = 'desc'; // Дефолтный порядок
        updateTable(sortBy, order);

        // Обновляем URL в адресной строке без перезагрузки
        const newUrl = new URL(window.location);
        newUrl.searchParams.set('sort', sortBy);
        newUrl.searchParams.set('order', order);
        if (searchQuery) {
            newUrl.searchParams.set('search', searchQuery);
        }
        window.history.pushState({}, '', newUrl);
    });

    // Обработчик изменения порядка
    sortOrderBtn.addEventListener('click', function() {
        const currentUrl = new URL(window.location.href);
        const currentOrder = currentUrl.searchParams.get('order') || 'desc';
        const newOrder = currentOrder === 'desc' ? 'asc' : 'desc';
        const sortBy = currentUrl.searchParams.get('sort') || 'total';

        updateTable(sortBy, newOrder);

        // Обновляем URL в адресной строке без перезагрузки
        const newUrl = new URL(window.location);
        newUrl.searchParams.set('sort', sortBy);
        newUrl.searchParams.set('order', newOrder);
        if (searchQuery) {
            newUrl.searchParams.set('search', searchQuery);
        }
        window.history.pushState({}, '', newUrl);
    });

    // Автофокус на поле поиска
    const searchInput = document.getElementById('search_query');
    if (searchInput && !searchQuery) {
        searchInput.focus();
    }

    // Быстрый сброс поиска по Escape
    if (searchInput) {
        searchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && this.value) {
                window.location.href = "{% url 'books:top_books' %}";
            }
        });
    }

    // Анимация для строк таблицы
    const tableRows = document.querySelectorAll('tbody tr');
    tableRows.forEach((row, index) => {
        row.style.animation = `fadeIn 0.3s ease ${index * 0.05}s both`;
    });
});