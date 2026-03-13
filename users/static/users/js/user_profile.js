document.addEventListener('DOMContentLoaded', function() {
    // Настройки
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
            const prevBtn = document.createElement('button');
            prevBtn.className = 'btn btn-sm btn-outline-secondary';
            prevBtn.innerHTML = '&larr;';
            prevBtn.title = 'Предыдущая';
            prevBtn.onclick = () => goToPage(currentPage - 1);
            breadcrumbsContainer.appendChild(prevBtn);
        }

        if (currentPage > 2) {
            const firstBtn = document.createElement('button');
            firstBtn.className = 'btn btn-sm btn-outline-secondary';
            firstBtn.textContent = '1';
            firstBtn.onclick = () => goToPage(1);
            breadcrumbsContainer.appendChild(firstBtn);

            if (currentPage > 3) {
                const dots = document.createElement('span');
                dots.className = 'text-muted mx-1';
                dots.textContent = '...';
                breadcrumbsContainer.appendChild(dots);
            }
        }

        for (let i = Math.max(1, currentPage - 1); i <= Math.min(totalPages, currentPage + 1); i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = 'btn btn-sm ' + (i === currentPage ? 'btn-primary' : 'btn-outline-secondary');
            pageBtn.textContent = i;
            pageBtn.onclick = () => goToPage(i);
            breadcrumbsContainer.appendChild(pageBtn);
        }

        if (currentPage < totalPages - 1) {
            if (currentPage < totalPages - 2) {
                const dots = document.createElement('span');
                dots.className = 'text-muted mx-1';
                dots.textContent = '...';
                breadcrumbsContainer.appendChild(dots);
            }

            const lastBtn = document.createElement('button');
            lastBtn.className = 'btn btn-sm btn-outline-secondary';
            lastBtn.textContent = totalPages;
            lastBtn.onclick = () => goToPage(totalPages);
            breadcrumbsContainer.appendChild(lastBtn);
        }

        if (currentPage < totalPages) {
            const nextBtn = document.createElement('button');
            nextBtn.className = 'btn btn-sm btn-outline-secondary';
            nextBtn.innerHTML = '&rarr;';
            nextBtn.title = 'Следующая';
            nextBtn.onclick = () => goToPage(currentPage + 1);
            breadcrumbsContainer.appendChild(nextBtn);
        }
    }

    function goToPage(page) {
        if (page < 1 || page > totalPages) return;
        currentPage = page;
        favoriteItems.forEach(item => item.style.display = 'none');
        const startIndex = (page - 1) * ITEMS_PER_PAGE;
        const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);
        for (let i = startIndex; i < endIndex; i++) {
            if (favoriteItems[i]) {
                favoriteItems[i].style.display = 'block';
            }
        }
        statsElement.textContent = `(${page} из ${totalPages})`;
        createBreadcrumbs();
        document.querySelector('#favorites-container').scrollIntoView({
            behavior: 'smooth',
            block: 'nearest'
        });
    }

    goToPage(1);
});
    // Пагинация для таблицы Личный ТОП
function initTopBooksPagination() {
    const ITEMS_PER_PAGE = 5;
    const topItems = document.querySelectorAll('.top-book-item');
    const totalItems = topItems.length;

    if (totalItems <= ITEMS_PER_PAGE) {
        return; // Не показываем пагинацию если строк мало
    }

    const statsElement = document.getElementById('top-pagination-stats');
    statsElement.style.display = 'inline';
    statsElement.textContent = `(1 из ${Math.ceil(totalItems / ITEMS_PER_PAGE)})`;

    document.getElementById('top-pagination').style.display = 'block';

    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    let currentPage = 1;

    function showPage(page) {
        // Скрываем все строки
        topItems.forEach(item => item.style.display = 'none');

        // Показываем строки для текущей страницы
        const startIndex = (page - 1) * ITEMS_PER_PAGE;
        const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);

        for (let i = startIndex; i < endIndex; i++) {
            if (topItems[i]) {
                topItems[i].style.display = 'table-row';
            }
        }

        statsElement.textContent = `(${page} из ${totalPages})`;
        createTopBreadcrumbs(page);
    }

    function createTopBreadcrumbs(page) {
        const breadcrumbsContainer = document.getElementById('top-breadcrumbs');
        breadcrumbsContainer.innerHTML = '';

        if (page > 1) {
            const prevBtn = document.createElement('button');
            prevBtn.className = 'btn btn-sm btn-outline-secondary';
            prevBtn.innerHTML = '&larr;';
            prevBtn.title = 'Предыдущая';
            prevBtn.onclick = () => {
                currentPage--;
                showPage(currentPage);
            };
            breadcrumbsContainer.appendChild(prevBtn);
        }

        if (page > 2) {
            const firstBtn = document.createElement('button');
            firstBtn.className = 'btn btn-sm btn-outline-secondary';
            firstBtn.textContent = '1';
            firstBtn.onclick = () => {
                currentPage = 1;
                showPage(1);
            };
            breadcrumbsContainer.appendChild(firstBtn);

            if (page > 3) {
                const dots = document.createElement('span');
                dots.className = 'text-muted mx-1';
                dots.textContent = '...';
                breadcrumbsContainer.appendChild(dots);
            }
        }

        for (let i = Math.max(1, page - 1); i <= Math.min(totalPages, page + 1); i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = 'btn btn-sm ' + (i === page ? 'btn-primary' : 'btn-outline-secondary');
            pageBtn.textContent = i;
            pageBtn.onclick = () => {
                currentPage = i;
                showPage(i);
            };
            breadcrumbsContainer.appendChild(pageBtn);
        }

        if (page < totalPages - 1) {
            if (page < totalPages - 2) {
                const dots = document.createElement('span');
                dots.className = 'text-muted mx-1';
                dots.textContent = '...';
                breadcrumbsContainer.appendChild(dots);
            }

            const lastBtn = document.createElement('button');
            lastBtn.className = 'btn btn-sm btn-outline-secondary';
            lastBtn.textContent = totalPages;
            lastBtn.onclick = () => {
                currentPage = totalPages;
                showPage(totalPages);
            };
            breadcrumbsContainer.appendChild(lastBtn);
        }

        if (page < totalPages) {
            const nextBtn = document.createElement('button');
            nextBtn.className = 'btn btn-sm btn-outline-secondary';
            nextBtn.innerHTML = '&rarr;';
            nextBtn.title = 'Следующая';
            nextBtn.onclick = () => {
                currentPage++;
                showPage(currentPage);
            };
            breadcrumbsContainer.appendChild(nextBtn);
        }
    }

    // Инициализация
    showPage(1);
}

// Добавьте в существующий DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    // ... существующий код пагинации для избранных книг ...

    // Инициализация пагинации для таблицы ТОП
    initTopBooksPagination();
});
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