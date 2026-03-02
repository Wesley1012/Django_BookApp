document.addEventListener('DOMContentLoaded', function() {
    const tableBody = document.getElementById('members-table-body');
    const table = document.getElementById('members-table');

    // Обработчики для кнопок сортировки
    document.querySelectorAll('.sort-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();

            const sortBy = this.dataset.sort;
            const currentOrder = this.dataset.currentOrder;

            // Определяем новый порядок
            const newOrder = currentOrder === 'desc' ? 'asc' : 'desc';

            // Показываем индикатор загрузки
            table.classList.add('table-loading');

            // Отправляем AJAX запрос
            fetch(`/users/members/?sort=${sortBy}&order=${newOrder}`, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
            .then(response => response.text())
            .then(html => {
                // Создаем временный элемент и парсим новую таблицу
                const temp = document.createElement('div');
                temp.innerHTML = html;
                const newTbody = temp.querySelector('#members-table-body');

                if (newTbody) {
                    tableBody.innerHTML = newTbody.innerHTML;
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
                    updateSortIcons(btn, btnSort === sortBy ? newOrder : null);
                });

                // Убираем индикатор загрузки
                table.classList.remove('table-loading');
            })
            .catch(error => {
                console.error('Error:', error);
                table.classList.remove('table-loading');
            });
        });
    });

    function updateSortIcons(btn, activeOrder) {
        const btnSort = btn.dataset.sort;
        // Убираем старую иконку
        btn.innerHTML = btn.innerHTML.replace(/<i.*?>.*?<\/i>/g, '').trim();

        // Если эта кнопка активна, добавляем иконку
        if (activeOrder) {
            const icon = activeOrder === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
            btn.innerHTML += ` <i class="fas ${icon}"></i>`;
        }
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const tableBody = document.getElementById('members-table-body');
    const table = document.getElementById('members-table');

    // Обработчики для кнопок сортировки
    document.querySelectorAll('.sort-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();

            const sortBy = this.dataset.sort;
            const currentOrder = this.dataset.currentOrder;

            // Определяем новый порядок
            const newOrder = currentOrder === 'desc' ? 'asc' : 'desc';

            // Показываем индикатор загрузки
            table.classList.add('table-loading');

            // Отправляем AJAX запрос
            fetch(window.location.pathname + `?sort=${sortBy}&order=${newOrder}`, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.html) {
                    // Создаем временный элемент и парсим новую таблицу
                    const temp = document.createElement('div');
                    temp.innerHTML = data.html;
                    const newTbody = temp.querySelector('#members-table-body');

                    if (newTbody) {
                        tableBody.innerHTML = newTbody.innerHTML;
                    }
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
                    updateSortIcons(btn, btnSort === sortBy ? newOrder : null);
                });

                // Убираем индикатор загрузки
                table.classList.remove('table-loading');
            })
            .catch(error => {
                console.error('Error:', error);
                table.classList.remove('table-loading');
            });
        });
    });

    function updateSortIcons(btn, activeOrder) {
        const btnSort = btn.dataset.sort;
        // Убираем старую иконку
        btn.innerHTML = btn.innerHTML.replace(/<i.*?>.*?<\/i>/g, '').trim();

        // Если эта кнопка активна, добавляем иконку
        if (activeOrder) {
            const icon = activeOrder === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
            btn.innerHTML += ` <i class="fas ${icon}"></i>`;
        }
    }
});