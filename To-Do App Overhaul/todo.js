$(document).ready(() => {
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let colorIndex = parseInt(localStorage.getItem('colorIndex')) || 0;
    const colors = ['color-1', 'color-2', 'color-3'];
    $('#form-container').addClass(colors[colorIndex]);
    loadTasks();
    $('#add').on('click', () => {
        const task = $('#new-task').val().trim();
        const startDate = $('#new-start-date').val();
        const endDate = $('#new-end-date').val();
        if (task && startDate && endDate) {
            const newTask = {
                id: Date.now(),
                task,
                startDate,
                endDate,
                completed: false,
                color: colors[colorIndex]
            };
            tasks.push(newTask);
            localStorage.setItem('tasks', JSON.stringify(tasks));
            colorIndex = (colorIndex + 1) % 3;
            localStorage.setItem('colorIndex', colorIndex);
            $('#form-container').removeClass(colors.join(' ')).addClass(colors[colorIndex]);
            $('#new-task').val('');
            $('#new-start-date').val('');
            $('#new-end-date').val('');
            addStickyNote(newTask);
        }
    });
    $('#sort-notes').on('change', () => {
        const sortBy = $('#sort-notes').val();
        tasks.sort((a, b) => {
            if (sortBy === 'start') return new Date(a.startDate) - new Date(b.startDate);
            if (sortBy === 'deadline') return new Date(a.endDate) - new Date(b.endDate);
            if (sortBy === 'complete') return a.completed - b.completed;
            return 0;
        });
        $('#board').empty();
        tasks.forEach(task => addStickyNote(task));
    });
    function addStickyNote(task) {
        const formatDate = (dateStr) => {
            const date = new Date(dateStr);
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${month}/${day}`;
        };
        const startFormatted = formatDate(task.startDate);
        const endFormatted = formatDate(task.endDate);
        const note = $(`
            <div class="sticky-note ${task.color} fade-in" data-id="${task.id}">
                <div class="note-content p-2">
                    <div class="d-flex justify-content-between align-items-start">
                        <strong>Task:</strong>
                        <div class="buttons">
                            <button class="btn btn-sm btn-success complete-btn me-1">✓</button>
                            <button class="btn btn-sm btn-danger delete-btn">X</button>
                        </div>
                    </div>
                    <p>${task.task}</p>
                    <div class="row">
                        <div class="col-6">Start: ${startFormatted}</div>
                        <div class="col-6">Deadline: ${endFormatted}</div>
                    </div>
                    <div class="completed-overlay ${task.completed ? 'visible' : ''}"></div>
                </div>
            </div>
        `);
        note.find('.complete-btn').on('click', () => {
            if (!task.completed) {
                task.completed = true;
                localStorage.setItem('tasks', JSON.stringify(tasks));
                note.find('.completed-overlay').addClass('visible');
            }
        });
        note.find('.delete-btn').on('click', () => {
            note.addClass('fade-out');
            setTimeout(() => {
                tasks = tasks.filter(t => t.id !== task.id);
                localStorage.setItem('tasks', JSON.stringify(tasks));
                note.remove();
            }, 500);
        });
        $('#board').append(note);
    }
    function loadTasks() {
        $('#board').empty();
        tasks.forEach(task => addStickyNote(task));
    }
});