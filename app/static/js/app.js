// Открытие модального окна для добавления
document.querySelectorAll('#openAddForm, .floating-button').forEach(element => {
    element.addEventListener('click', function() {
        const activeTable = document.querySelector('.nav-item.active').dataset.table;
        const menu =  document.querySelector('.menu');
        const overlay = document.querySelector('.overlay');

        if (menu.classList.contains('active') || overlay.style.display == 'block') {
            menu.classList.remove('active');
            overlay.style.display = 'none';
        }

        fetch(`/api/add-form-fields?table=${activeTable}`)
            .then(response => response.json())
            .then(data => {
                if (data.columns && data.columns.length > 0) {
                    startFormWizard(data.columns, data.columns_translated, activeTable);
                } else {
                    alert('Нет доступных полей для добавления');
                }
            })
            .catch(error => console.error('Ошибка', error));
    });
});

// Обработка форм для полей
function startFormWizard(columns, columns_translated, activeTable) {
    let currentStep = 0;
    const formData = {};
    const modal = document.querySelector('.modal');
    const overlay = document.querySelector('.overlay');

    function showStep() {
        if (currentStep >= columns.length) {
            renderSummary();
            return;
        }

        const column = columns[currentStep];
        const column_translated = columns_translated[currentStep];
        modal.innerHTML = `
            <img class="close" src="${closeImgModal}" height="24" width="24">
            <h2>${column_translated}</h2>
            <form id="one-input-form">
                <div class="input-and-button">
                    ${column === 'STATUS' 
                        ? `<select class="status-select" autofocus required>
                                <option>Запланировано</option>
                                <option>В процессе</option>
                                <option>Завершено</option>
                            </select>
                            <button type="submit" class="button-on-input" style="display: block; cursor: pointer;">${currentStep === columns.length - 1 ? 'Сохранить' : 'Отправить'}</button>`
                        : (column === 'EXPLOITATION_DATE' || column === 'PLANNED_DATE' || column === 'RECEIVE_DATE')
                            ? `<div class="date-container"></div>
                                <button type="submit" class="button-on-input" style="display: block; cursor: pointer; align-self: flex-end; padding: 12px 20px;">${currentStep === columns.length - 1 ? 'Сохранить' : 'Отправить'}</button>`
                            : `<input type="text" id="input" autofocus required>`
                    }
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <div class="back-button">
                        <img src="${backImgModal}" height="24" width="24">
                        <span>Назад</span>
                    </div>
                    <div class="step-counter">
                        <span style="color: black; font-size: 30px; line-height: 28px;">0${currentStep + 1} </span>
                        / 0${columns.length}
                    </div>
                </div>
            </form>
        `;

        const backButton = document.querySelector('.back-button');
        if (currentStep <= 0) {
            backButton.querySelector('span').style.display = 'none';
            backButton.querySelector('img').style.display = 'none';
        }

        if (column === 'EXPLOITATION_DATE' || column === 'PLANNED_DATE' || column === 'RECEIVE_DATE') {
            const dateContainer = modal.querySelector('.date-container');
            const dateInput = createDateInputs();
            dateContainer.appendChild(dateInput);
        }

        // Установка фокуса на input
        const input = modal.querySelector('#input');
        if (input) {
            try {
                input.focus();

            } catch (e) {
                console.log(e);
            }
        }

        modal.querySelector('.back-button').addEventListener('click', () => {
            currentStep--;
            showStep();
        });

        modal.querySelector('form').addEventListener('submit', e => {
            e.preventDefault();
            
            let value;
            if (column === 'EXPLOITATION_DATE' || column === 'PLANNED_DATE' || column === 'RECEIVE_DATE') {
                const fullDateInput = e.target.querySelector('#full-date');
                value = fullDateInput.value.trim();
            } else {
                const inputElement = e.target.querySelector('input');
                const selectElement = e.target.querySelector('select');
                value = inputElement ? inputElement.value.trim() : selectElement.value.trim();
            }

            if (value) {
                formData[column] = value;
                currentStep++;
                showStep();
            }
        });

        modal.querySelector('.close').addEventListener('click', () => {
            modal.style.display = 'none';
            overlay.style.display = 'none';
            document.body.classList.remove('no-scroll');
        });
    }

    function renderSummary() {
        modal.innerHTML = `
            <div class="modal-header">
                <h2 style="margin: 0;">Проверьте и отредактируйте данные</h2>
                <img class="close" src="${closeImgModal}" height="24" width="24">
            </div>
            <form id="summary-form">
                <div class="modal-content">
                    ${columns.map((col, i) => {
                        const value = formData[col] || '';
                        return `
                            <div class="modal-field" data-column="${col}">
                                <label>${columns_translated[i]}</label>
                                ${col === 'STATUS' ? `
                                    <select class="status-select">
                                        <option ${value === 'Запланировано' ? 'selected' : ''}>Запланировано</option>
                                        <option ${value === 'В процессе' ? 'selected' : ''}>В процессе</option>
                                        <option ${value === 'Завершено' ? 'selected' : ''}>Завершено</option>
                                    </select>
                                ` : (col === 'EXPLOITATION_DATE' || col === 'PLANNED_DATE' || col === 'RECEIVE_DATE') ? `
                                    <div class="date-container" id="date-container-${i}"></div>
                                ` : `
                                    <input type="text" value="${value}">
                                `}
                            </div>
                        `;
                    }).join('')}
                </div>
                <div class="modal-actions">
                    <button type="button" class="back-button-modal">Назад</button>
                    <button type="submit" id="confirm-btn">Подтвердить</button>
                </div>
            </form>
        `;

        columns.forEach((col, i) => {
            if (col === 'EXPLOITATION_DATE' || col === 'PLANNED_DATE' || col === 'RECEIVE_DATE') {
                const container = modal.querySelector(`#date-container-${i}`);

                if (container) {
                    const dateInput = createDateInputs(formData[col]);
                    container.appendChild(dateInput);

                    // Обновляем formData при изменении даты
                    dateInput.addEventListener('change', () => {
                        const fullDate = dateInput.querySelector('#full-date').value;
                        formData[col] = fullDate;
                    });
                }
            }
        });

        modal.querySelectorAll('input:not([type="hidden"]), select').forEach((field, index) => {
            const col = columns[index];
            if (col && col !== 'EXPLOITATION_DATE' && col !== 'PLANNED_DATE' && col !== 'RECEIVE_DATE') {
                field.addEventListener('input', () => {
                    formData[col] = field.value;
                });
            }
        });

        console.log(formData, activeTable);

        modal.querySelector('.back-button-modal').addEventListener('click', () => {
            currentStep = columns.length - 1;
            showStep();
        });

        modal.querySelector('form').addEventListener('submit', e => {
            e.preventDefault();
            sendFormData(formData, activeTable);
            modal.style.display = 'none';
            overlay.style.display = 'none';
        });

        modal.querySelector('.close').addEventListener('click', () => {
            modal.style.display = 'none';
            overlay.style.display = 'none';
            document.body.classList.remove('no-scroll');
        });
    }

    modal.style.display = 'block';
    overlay.style.display = (modal.style.display === 'block') ? 'block' : 'none';
    document.body.classList.add('no-scroll');
    showStep();
}

function createDateInputs(existingDate) {
    let currentDate;
    if (existingDate) {
        const [day, month, year] = existingDate.split('.');
        currentDate = new Date(`${year}-${month}-${day}`);
    } else {
        currentDate = new Date();
    }

    const container = document.createElement('div');
    container.className = 'date-picker';

    // Генерация дней для разных месяцев и годов
    const generateDays = (year, month) => {
        const daysInMonth = new Date(year, month, 0).getDate();
        return Array.from({length: daysInMonth}, (_, i) => `
            <option value="${i+1}" ${i+1 === currentDate.getDate() ? 'selected' : ''}>${i+1}</option>
        `).join('');
    };

    container.innerHTML = `
        <div class="date-group">
            <label class="date-label">День</label>
            <select id="day" class="date-part">${generateDays(currentDate.getFullYear(), currentDate.getMonth() + 1)}</select>
        </div>
        <span class="date-separator">.</span>
        <div class="date-group">
            <label class="date-label">Месяц</label>
            <select id="month" class="date-part">
                ${Array.from({length: 12}, (_, i) => 
                    `<option value="${i+1}" ${i+1 === currentDate.getMonth() + 1 ? 'selected' : ''}>${i+1}</option>`
                ).join('')}
            </select>
        </div>
        <span class="date-separator">.</span>
        <div class="date-group">
            <label class="date-label">Год</label>
            <select id="year" class="date-part">
                ${Array.from({length: 211}, (_, i) => {
                    const year = 1990 + i;
                    return `<option value="${year}" ${year === currentDate.getFullYear() ? 'selected' : ''}>${year}</option>`;
                }).join('')}
            </select>
        </div>
        <input type="hidden" id="full-date" name="date">
    `;

    // Обновление дней при изменении месяца/года
    const updateDays = () => {
        const year = parseInt(container.querySelector('#year').value);
        const month = parseInt(container.querySelector('#month').value);
        const daySelect = container.querySelector('#day');
        const currentDay = parseInt(daySelect.value);
        
        daySelect.innerHTML = generateDays(year, month);
        
        // Сохраняем выбранный день если он существует в новом месяце
        daySelect.value = Math.min(currentDay, new Date(year, month, 0).getDate());
    };

    // Обновление полной даты
    const updateFullDate = () => {
        const day = container.querySelector('#day').value.padStart(2, '0');
        const month = container.querySelector('#month').value.padStart(2, '0');
        const year = container.querySelector('#year').value;
        container.querySelector('#full-date').value = `${day}.${month}.${year}`;
    };

    // Слушатели изменений
    container.querySelector('#month').addEventListener('change', () => {
        updateDays();
        updateFullDate();
    });

    container.querySelector('#year').addEventListener('change', () => {
        updateDays();
        updateFullDate();
    });

    container.querySelector('#day').addEventListener('change', updateFullDate);

    // Инициализация
    updateFullDate();

    return container;
}

function sendFormData(data, table) {
    fetch(`/api/add/${table}`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            const successMessage = document.querySelector('.success-message');

            // Вызов об успешной записи в БД
            showSuccessMessage(table, successMessage, "сохраненны");

            setTimeout(() => {
                successMessage.style.display = 'none';
                window.location.reload();
            }, 2000);
        } else {
            alert(result.error || 'Неизвестная ошибка');
        }
    })
    .catch(error => console.error('Ошибка:', error));
}

function showSuccessMessage(table, successMessage, messageType) {
    const h2Element = successMessage.querySelector('h2');
    const spanElement = document.createElement('span');

    spanElement.textContent = messageType;
    if (messageType === 'удалены') {
        spanElement.style.color = '#FF0000';
    } else {
        spanElement.style.color = '#3DADFF';
    }

    h2Element.textContent = `Данные успешно `;
    h2Element.appendChild(spanElement);
    h2Element.append(` в ${table}!`);
    
    successMessage.style.display = 'grid';
}

// Очистка поиска при перезагрузке
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    const clearButton = document.getElementById('clearSearch');

    if (searchInput.value.trim() !== '') {
        clearButton.style.display = 'block';
    } else {
        clearButton.style.display = 'none';
    }
});

// Очистка поиска при вводе текста
document.getElementById('searchInput').addEventListener('input', function() {
    const clearButton = document.getElementById('clearSearch');

    if (this.value.trim() !== '') {
        clearButton.style.display = 'block';
    } else {
        clearButton.style.display = 'none';
    }
});

document.getElementById('clearSearch').addEventListener('click', function() {
    document.getElementById('searchInput').value = '';
    this.style.display = 'none';
});

// Поиск с дебаунсером
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    let timeoutId;

    searchInput.addEventListener('input', function(e) {
        clearTimeout(timeoutId);

        timeoutId = setTimeout(() => {
            performSearch(e.target.value);
        }, 300);
    });

    function performSearch(query) {
        const url = new URL(window.location.href);
        url.searchParams.set('search', query);

        // Обновляем url
        history.replaceState(null, '', url.toString());

        fetch(url)
            .then(response => response.text())
            .then(html => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const newTable = doc.querySelector('#tableContainer').innerHTML;
                document.getElementById('tableContainer').innerHTML = newTable;
            })
            .catch(error => console.error('Error:', error));
    }
});

// Ленивая загрузка картинок
document.addEventListener("DOMContentLoaded", function() {
    const images = document.querySelectorAll("img[data-src]");
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute("data-src");
                observer.unobserve(img);
            }
        });
    });

    images.forEach(img => imageObserver.observe(img));
});

// Открытие меню на мобильных устройствах
const menuImg = document.querySelector('.menu-sidebar');
const itemForm = document.querySelector('.item-form');
const modalForm = document.querySelector('.modal');
const menu =  document.querySelector('.menu');
const overlay = document.querySelector('.overlay');
const closeImg = document.querySelector('#closeImg')
const closeForm = document.querySelector('.close-form');

function openMenu() {
    menu.classList.add('active');
    overlay.style.display = 'block';
    document.body.classList.add('no-scroll');
}

function closeMenu() {
    if (itemForm.style.display === 'block' || modalForm.style.display === 'block') {
        itemForm.style.display = 'none';
        modalForm.style.display = 'none';
    }
    menu.classList.remove('active');
    overlay.style.display = 'none';
    document.body.classList.remove('no-scroll');
}

menuImg.addEventListener('click', openMenu);
closeImg.addEventListener('click', closeMenu);
closeForm.addEventListener('click', closeMenu);
overlay.addEventListener('click', closeMenu);

// Управление тенью при скроле в item-data
document.querySelectorAll('.list-item').forEach(container => {
    const scrollItem = container.querySelector('.item-data');

    scrollItem.addEventListener('scroll', function() {
        const scrollLeft = this.scrollLeft;
        const maxScroll = this.scrollWidth - this.clientWidth;

        if (scrollLeft <= 0) {
            this.classList.add('scroll-start');
            this.classList.remove('scroll-middle');
        } else if (scrollLeft >= maxScroll) {
            this.classList.add('scroll-end');
            this.classList.remove('scroll-middle');
        } else {
            this.classList.add('scroll-middle');
            this.classList.remove('scroll-start', 'scroll-end');
        }
    });

    const event = new Event('scroll');
    scrollItem.dispatchEvent(event);
});

// Горизонтальный скролл перетаскиванием по .item-data
const itemDataElements = document.querySelectorAll('.item-data');

itemDataElements.forEach(element => {
    let isDown = false;
    let startX;
    let scrollLeft;
    let isDragging = false;

    element.addEventListener('mousedown', (e) => {
        isDown = true;
        startX = e.pageX - element.offsetLeft;
        scrollLeft = element.scrollLeft;
        element.style.cursor = 'grabbing';
        isDragging = false;
    });

    element.addEventListener('mouseleave', () => {
        isDown = false;
        element.style.cursor = 'grab';
    });

    element.addEventListener('mouseup', () => {
        isDown = false;
        element.style.cursor = 'grab';
        // Если был драг, предотвращаем клик
        if (isDragging) {
            e.preventDefault();
            e.stopPropagation();
        }
        isDragging = false;
    });

    element.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        isDragging = true;
        e.preventDefault();
        const x = e.pageX - element.offsetLeft;
        const walk = x - startX;
        element.scrollLeft = scrollLeft - walk;
    });

    // Отменяем клик, если был драг
    element.addEventListener('click', (e) => {
        if (isDragging) {
            e.preventDefault();
            e.stopPropagation();
        }
    });
});

// Обработчик клика по элементу списка
document.querySelectorAll('.list-item').forEach(item => {
    item.addEventListener('click', function(e) {
        const entryId = this.dataset.id;
        const activeTable = document.querySelector('.nav-item.active').dataset.table;

        document.body.classList.add('no-scroll');

        fetch(`/api/${activeTable}/${entryId}`)
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    alert(data.error);
                    return;
                }
                showItemForm(data, activeTable);
            });
    });
});

function showItemForm(data, table) {
    const form = document.querySelector('.item-form');
    const content = document.querySelector('.form-content');
    const overlay = document.querySelector('.overlay');

    content.innerHTML = '';
    Object.entries(data).forEach(([key, value]) => {
        const field = document.createElement('div');
        field.classList.add('form-field');
        field.innerHTML = `
            <label>${key}</label>
            <input type="text" value="${value}" ${key === 'id' ? 'readonly' : ''}>
        `;
        content.appendChild(field);
    });

    form.style.display = 'block';
    overlay.style.display = 'block';

    const submitButton = form.querySelector('.btn-edit');
    const formFields = form.querySelectorAll('.form-field input, .form-field textarea, .form-field select');
    let hasChanges = false;

    formFields.forEach(field => {
        field.addEventListener('input', () => {
            hasChanges = true;
            updateSubmitButton();
        });
    });

    function updateSubmitButton() {
        if (hasChanges) {
            submitButton.classList.add('active-button');
            submitButton.querySelector('#changeGray').style.display = 'none';
            submitButton.querySelector('#changeWhite').style.display = 'block';
        } else {
            submitButton.classList.remove('active-button');
            submitButton.querySelector('#changeGray').style.display = 'block';
            submitButton.querySelector('#changeWhite').style.display = 'none';
        }
    }

    form.querySelector('.close-form').onclick = function() {
        form.style.display = 'none';
        overlay.style.display = 'none';
    }
    form.querySelector('.btn-delete').onclick = () => deleteEntry(data.ID, table);
    form.querySelector('.btn-edit').onclick = (event) => {
        const button = event.currentTarget;

        if (button.classList.contains('active-button') && event.target.closest('.btn-edit')) {
            editEntry(data.ID, table);
        }
    };
}

function deleteEntry(id, table) {
    console.log(id, table);

    const successMessage = document.querySelector('.success-message');

    if (confirm('Вы уверены, что хотите удалить запись?')) {
        fetch(`/api/delete/${table}/${id}`, { method: 'DELETE' })
            .then(response => {
                if(response.ok) {
                    closeMenu();
                    showSuccessMessage(table, successMessage, "удалены");
                    setTimeout(() => {
                        window.location.reload(true);
                    }, 2000);
                }
            });
    }
}

function editEntry(id, table) {
    const formData = {};
    const inputs = document.querySelectorAll('.form-field input');
    const successMessage = document.querySelector('.success-message');

    inputs.forEach(input => {
        if (input) {
            formData[input.previousElementSibling.textContent] = input.value;
        }
    });

    if (confirm('Вы уверены, что хотите изменить запись?')) {
        fetch(`/api/update/${table}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                closeMenu();
                showSuccessMessage(table, successMessage, "сохраненны");
                setTimeout(() => window.location.reload(), 2000);
            }
        })
    }
}

// Заметки floating-container
function  initializeNotes() {
    const notesPanel = document.getElementById('notesPanel');
    const notesTextarea = notesPanel.querySelector('textarea');

    notesTextarea.value = localStorage.getItem('inventory_notes') || '';

    notesTextarea.addEventListener('input', () => {
        localStorage.setItem('inventory_notes', notesTextarea.value);
    });

    function toggleNotes() {
        notesPanel.style.display = notesPanel.style.display === 'block' ? 'none' : 'block';
    }
}
// document.addEventListener('DOMContentLoaded', initializeNotes);