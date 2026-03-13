document.addEventListener('DOMContentLoaded', function() {
    // AJAX сортировка без перезагрузки
    document.querySelectorAll('.sort-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();

            const sortBy = this.dataset.sort;
            const currentOrder = this.dataset.currentOrder;

            // Определяем новый порядок: если текущий desc, то следующий asc, и наоборот
            const newOrder = currentOrder === 'desc' ? 'asc' : 'desc';

            // Показываем индикатор загрузки
            const tbody = document.getElementById('topBooksBody');
            const oldContent = tbody.innerHTML;
            tbody.style.opacity = '0.5';

            // Отправляем AJAX запрос
            fetch(window.location.pathname + `?sort=${sortBy}&order=${newOrder}`, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
            .then(response => response.text())
            .then(html => {
                // Создаем временный элемент и парсим новую таблицу
                const temp = document.createElement('div');
                temp.innerHTML = html;
                const newTbody = temp.querySelector('#topBooksBody');

                if (newTbody) {
                    tbody.innerHTML = newTbody.innerHTML;
                }

                // Обновляем data-current-order для всех кнопок
                document.querySelectorAll('.sort-btn').forEach(btn => {
                    const btnSort = btn.dataset.sort;
                    if (btnSort === sortBy) {
                        btn.dataset.currentOrder = newOrder;
                    } else {
                        // Для остальных кнопок сбрасываем на desc (как в топе)
                        btn.dataset.currentOrder = 'desc';
                    }

                    // Обновляем иконки
                    updateButtonIcon(btn, btnSort === sortBy ? newOrder : null);
                });

                tbody.style.opacity = '1';
            })
            .catch(error => {
                console.error('Error:', error);
                tbody.innerHTML = oldContent;
                tbody.style.opacity = '1';
            });
        });
    });

    function updateButtonIcon(btn, activeOrder) {
        const btnSort = btn.dataset.sort;
        // Убираем старую иконку
        btn.innerHTML = btn.innerHTML.replace(/<i.*?>.*?<\/i>/g, '').trim();

        // Если эта кнопка активна, добавляем иконку
        if (activeOrder) {
            const icon = activeOrder === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
            btn.innerHTML += ` <i class="fas ${icon} ms-1"></i>`;
        }
    }
});
document.addEventListener('DOMContentLoaded', function() {
    const ITEMS_PER_PAGE = 3;
    const favoriteItems = document.querySelectorAll('.favorite-item');
    const totalItems = favoriteItems.length;

    if (totalItems <= ITEMS_PER_PAGE) {
        favoriteItems.forEach(item => item.style.display = 'block');
        return;
    }

    const statsElement = document.getElementById('pagination-stats');
    statsElement.style.display = 'inline';
    statsElement.textContent = `(1 из ${Math.ceil(totalItems / ITEMS_PER_PAGE)})`;

    document.getElementById('breadcrumb-pagination').style.display = 'block';

    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    let currentPage = 1;

    function createBreadcrumbs() {
        const breadcrumbsContainer = document.getElementById('breadcrumbs');
        breadcrumbsContainer.innerHTML = '';

        if (currentPage > 1) {
            addButton('&larr;', () => goToPage(currentPage - 1), 'btn-outline-secondary');
        }

        if (currentPage > 2) {
            addButton('1', () => goToPage(1), 'btn-outline-secondary');
            if (currentPage > 3) addDots();
        }

        for (let i = Math.max(1, currentPage - 1); i <= Math.min(totalPages, currentPage + 1); i++) {
            addButton(i, () => goToPage(i), i === currentPage ? 'btn-primary' : 'btn-outline-secondary');
        }

        if (currentPage < totalPages - 1) {
            if (currentPage < totalPages - 2) addDots();
            addButton(totalPages, () => goToPage(totalPages), 'btn-outline-secondary');
        }

        if (currentPage < totalPages) {
            addButton('&rarr;', () => goToPage(currentPage + 1), 'btn-outline-secondary');
        }
    }

    function addButton(text, onclick, className) {
        const btn = document.createElement('button');
        btn.className = `btn btn-sm ${className}`;
        btn.innerHTML = text;
        btn.onclick = onclick;
        document.getElementById('breadcrumbs').appendChild(btn);
    }

    function addDots() {
        const dots = document.createElement('span');
        dots.className = 'text-muted mx-1';
        dots.textContent = '...';
        document.getElementById('breadcrumbs').appendChild(dots);
    }

    function goToPage(page) {
        if (page < 1 || page > totalPages) return;
        currentPage = page;

        favoriteItems.forEach(item => item.style.display = 'none');

        const startIndex = (page - 1) * ITEMS_PER_PAGE;
        const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);

        for (let i = startIndex; i < endIndex; i++) {
            if (favoriteItems[i]) favoriteItems[i].style.display = 'block';
        }

        statsElement.textContent = `(${page} из ${totalPages})`;
        createBreadcrumbs();
    }

    goToPage(1);
});
    // Пагинация для таблицы ТОП книг
function initTopBooksPagination() {
    const ITEMS_PER_PAGE = 5;
    const topItems = document.querySelectorAll('.top-book-item');
    const totalItems = topItems.length;

    if (totalItems <= ITEMS_PER_PAGE) {
        topItems.forEach(item => item.style.display = 'table-row');
        return;
    }

    const statsElement = document.getElementById('top-pagination-stats');
    statsElement.style.display = 'inline';
    statsElement.textContent = `(1 из ${Math.ceil(totalItems / ITEMS_PER_PAGE)})`;

    document.getElementById('top-pagination').style.display = 'block';

    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    let currentPage = 1;

    function createTopBreadcrumbs() {
        const breadcrumbsContainer = document.getElementById('top-breadcrumbs');
        breadcrumbsContainer.innerHTML = '';

        if (currentPage > 1) {
            addTopButton('&larr;', () => goToTopPage(currentPage - 1), 'btn-outline-secondary');
        }

        if (currentPage > 2) {
            addTopButton('1', () => goToTopPage(1), 'btn-outline-secondary');
            if (currentPage > 3) addTopDots();
        }

        for (let i = Math.max(1, currentPage - 1); i <= Math.min(totalPages, currentPage + 1); i++) {
            addTopButton(i, () => goToTopPage(i), i === currentPage ? 'btn-primary' : 'btn-outline-secondary');
        }

        if (currentPage < totalPages - 1) {
            if (currentPage < totalPages - 2) addTopDots();
            addTopButton(totalPages, () => goToTopPage(totalPages), 'btn-outline-secondary');
        }

        if (currentPage < totalPages) {
            addTopButton('&rarr;', () => goToTopPage(currentPage + 1), 'btn-outline-secondary');
        }
    }

    function addTopButton(text, onclick, className) {
        const btn = document.createElement('button');
        btn.className = `btn btn-sm ${className}`;
        btn.innerHTML = text;
        btn.onclick = onclick;
        document.getElementById('top-breadcrumbs').appendChild(btn);
    }

    function addTopDots() {
        const dots = document.createElement('span');
        dots.className = 'text-muted mx-1';
        dots.textContent = '...';
        document.getElementById('top-breadcrumbs').appendChild(dots);
    }

    function goToTopPage(page) {
        if (page < 1 || page > totalPages) return;
        currentPage = page;

        topItems.forEach(item => item.style.display = 'none');

        const startIndex = (page - 1) * ITEMS_PER_PAGE;
        const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);

        for (let i = startIndex; i < endIndex; i++) {
            if (topItems[i]) topItems[i].style.display = 'table-row';
        }

        statsElement.textContent = `(${page} из ${totalPages})`;
        createTopBreadcrumbs();
    }

    goToTopPage(1);
}

// Добавьте вызов функции в существующий DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    // Существующая пагинация для избранных книг
    // ... ваш существующий код ...

    // Новая пагинация для ТОП книг
    initTopBooksPagination();
});