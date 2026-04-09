document.addEventListener('DOMContentLoaded', function() {
    const sortSelect = document.getElementById('sortSelect');
    const sortOrderBtn = document.getElementById('sortOrderBtn');
    const tableContainer = document.querySelector('.table-responsive');
    const tableBody = document.querySelector('tbody');

    // Получаем текущие параметры
    const searchParams = new URLSearchParams(window.location.search);
    const searchQuery = searchParams.get('search') || '';
    const currentStatus = searchParams.get('status') || 'all';
    const ratingType = searchParams.get('rating_type') || 'all';  // Добавляем rating_type

    function updateTable(sortBy, order) {
        const scrollPosition = window.scrollY;
        tableContainer.style.opacity = '0.5';

        let url = window.location.pathname + `?sort=${sortBy}&order=${order}`;
        if (searchQuery) {
            url += `&search=${encodeURIComponent(searchQuery)}`;
        }
        if (currentStatus && currentStatus !== 'all') {
            url += `&status=${currentStatus}`;
        }
        if (ratingType && ratingType !== 'all') {  // Добавляем rating_type
            url += `&rating_type=${ratingType}`;
        }

        fetch(url, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => response.text())
        .then(html => {
            const temp = document.createElement('div');
            temp.innerHTML = html;
            const newTbody = temp.querySelector('tbody');

            if (newTbody) {
                tableBody.innerHTML = newTbody.innerHTML;
            }

            updateSortIcons(sortBy, order);
            tableContainer.style.opacity = '1';
            window.scrollTo(0, scrollPosition);
        })
        .catch(error => {
            console.error('Error:', error);
            tableContainer.style.opacity = '1';
        });
    }

    function updateSortIcons(sortBy, order) {
        document.querySelectorAll('.table-dark th a i').forEach(icon => icon.remove());

        const activeLink = document.querySelector(`.table-dark th a[href*="sort=${sortBy}"]`);
        if (activeLink) {
            const icon = document.createElement('i');
            icon.className = `fas fa-sort-${order === 'desc' ? 'down' : 'up'} ms-1`;
            activeLink.appendChild(icon);
        }
    }

    sortSelect.addEventListener('change', function() {
        const sortBy = this.value;
        const order = 'desc';
        updateTable(sortBy, order);

        const newUrl = new URL(window.location);
        newUrl.searchParams.set('sort', sortBy);
        newUrl.searchParams.set('order', order);
        if (searchQuery) newUrl.searchParams.set('search', searchQuery);
        if (currentStatus && currentStatus !== 'all') newUrl.searchParams.set('status', currentStatus);
        if (ratingType && ratingType !== 'all') newUrl.searchParams.set('rating_type', ratingType);
        window.history.pushState({}, '', newUrl);
    });

    sortOrderBtn.addEventListener('click', function() {
        const currentUrl = new URL(window.location.href);
        const currentOrder = currentUrl.searchParams.get('order') || 'desc';
        const newOrder = currentOrder === 'desc' ? 'asc' : 'desc';
        const sortBy = currentUrl.searchParams.get('sort') || 'total';

        updateTable(sortBy, newOrder);

        const newUrl = new URL(window.location);
        newUrl.searchParams.set('sort', sortBy);
        newUrl.searchParams.set('order', newOrder);
        if (searchQuery) newUrl.searchParams.set('search', searchQuery);
        if (currentStatus && currentStatus !== 'all') newUrl.searchParams.set('status', currentStatus);
        if (ratingType && ratingType !== 'all') newUrl.searchParams.set('rating_type', ratingType);
        window.history.pushState({}, '', newUrl);
    });

    // Анимация для строк таблицы
    const tableRows = document.querySelectorAll('tbody tr');
    tableRows.forEach((row, index) => {
        row.style.animation = `fadeIn 0.3s ease ${index * 0.05}s both`;
    });
});