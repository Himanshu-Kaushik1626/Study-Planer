/**
 * Smart Study Planner - Main Logic
 * No frameworks, pure Vanilla JS.
 */

// --- STATE MANAGEMENT ---
const AppState = {
    subjects: [],
    tasks: [],
    schedule: [],
    theme: 'dark',
    user: 'Student'
};

const STORAGE_KEY = 'study_planner_data';

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    applyTheme();
    updateProfileUI(); // Update profile on load
    setupEventListeners();
    renderAll();
    updateDate();
});

// --- DATA PERSISTENCE ---
function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(AppState));
}

function loadData() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
        const parsed = JSON.parse(data);
        AppState.subjects = parsed.subjects || [];
        AppState.tasks = parsed.tasks || [];
        AppState.schedule = parsed.schedule || [];
        AppState.theme = parsed.theme || 'dark';
        AppState.user = parsed.user || 'Student'; // Default Name
    } else {
        // Default Data
        AppState.subjects = [
            { id: 1, name: 'Mathematics', color: '#ff007f' },
            { id: 2, name: 'Computer Science', color: '#00d4ff' }
        ];
    }
}

// --- NAVIGATION & ROUTING ---
function navigateTo(targetId) {
    // Remove active class from all
    document.querySelectorAll('.nav-links li').forEach(li => li.classList.remove('active'));
    document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));

    // Activate View
    document.getElementById(targetId).classList.add('active');

    // Activate Sidebar Link
    const activeLink = document.querySelector(`.nav-links li[data-target="${targetId}"]`);
    if (activeLink) activeLink.classList.add('active');

    // Update Header
    document.getElementById('page-title').textContent = targetId.charAt(0).toUpperCase() + targetId.slice(1);
}

function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-links li').forEach(item => {
        item.addEventListener('click', () => {
            const targetId = item.getAttribute('data-target');
            navigateTo(targetId);
        });
    });

    // Theme Toggle
    const themeToggleBtn = document.getElementById('theme-toggle');
    themeToggleBtn.addEventListener('click', toggleTheme);

    const settingsThemeToggle = document.getElementById('setting-theme-toggle');
    settingsThemeToggle.addEventListener('change', toggleTheme);

    // Forms
    document.getElementById('subject-form').addEventListener('submit', handleSubjectSubmit);
    document.getElementById('task-form').addEventListener('submit', handleTaskSubmit);
    document.getElementById('schedule-form').addEventListener('submit', handleScheduleSubmit);
    document.getElementById('profile-form').addEventListener('submit', handleProfileSubmit);

    // Modals
    window.onclick = function (event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = "none";
        }
    }

    // Reset Data
    document.getElementById('btn-reset-data').addEventListener('click', () => {
        if (confirm('WARNING: This will delete ALL your subjects, tasks, and settings. This action cannot be undone. \n\nAre you sure?')) {
            localStorage.removeItem(STORAGE_KEY);
            location.reload();
        }
    });

    // Export Data
    document.getElementById('btn-export-data').addEventListener('click', exportData);
    document.getElementById('btn-share').addEventListener('click', exportData);

    // Task Filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            renderTasks(e.target.dataset.filter);
        });
    });
}

// --- PROFILE ---
function updateProfileUI() {
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(AppState.user)}&background=random`;
    document.querySelector('.user-profile img').src = avatarUrl;
    document.getElementById('profile-name').value = AppState.user;
}

function handleProfileSubmit(e) {
    e.preventDefault();
    const newName = document.getElementById('profile-name').value;
    if (newName.trim()) {
        AppState.user = newName;
        saveData();
        updateProfileUI();
        closeModal('profile-modal');
    }
}

// --- THEME ---
function applyTheme() {
    document.documentElement.setAttribute('data-theme', AppState.theme);
    const icon = document.querySelector('#theme-toggle i');
    icon.className = AppState.theme === 'dark' ? 'bx bxs-sun' : 'bx bxs-moon';
    document.getElementById('setting-theme-toggle').checked = AppState.theme === 'dark';
}

function toggleTheme() {
    AppState.theme = AppState.theme === 'dark' ? 'light' : 'dark';
    applyTheme();
    saveData();
}

// --- RENDERING ---
function renderAll() {
    renderDashboard();
    renderSubjects();
    renderTasks();
    renderSchedule();
    renderAnalytics();
}

function updateDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date').textContent = new Date().toLocaleDateString('en-US', options);
}

// --- DASHBOARD ---
function renderDashboard() {
    document.getElementById('stat-subjects').textContent = AppState.subjects.length;
    const pendingTasks = AppState.tasks.filter(t => !t.completed).length;
    const completedTasks = AppState.tasks.filter(t => t.completed).length;
    document.getElementById('stat-tasks-pending').textContent = pendingTasks;
    document.getElementById('stat-tasks-done').textContent = completedTasks;

    // Next Up (Schedule)
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const todaySchedule = AppState.schedule.filter(s => s.day === today).sort((a, b) => a.time.localeCompare(b.time));

    const scheduleList = document.getElementById('today-schedule-list');
    scheduleList.innerHTML = '';
    if (todaySchedule.length === 0) {
        scheduleList.innerHTML = '<div class="empty-state">No classes today. Enjoy!</div>';
    } else {
        todaySchedule.forEach(item => {
            const subject = AppState.subjects.find(s => s.id == item.subjectId);
            const div = document.createElement('div');
            div.className = 'schedule-item';
            div.style.borderLeft = `4px solid ${subject ? subject.color : '#ccc'}`;
            div.style.padding = '8px 12px';
            div.style.marginBottom = '8px';
            div.style.background = 'rgba(255,255,255,0.05)';
            div.innerHTML = `<strong>${item.time}</strong> - ${subject ? subject.name : 'Unknown'}`;
            scheduleList.appendChild(div);
        });
    }

    // Upcoming Tasks
    const upcomingList = document.getElementById('upcoming-tasks-list');
    upcomingList.innerHTML = '';
    const pending = AppState.tasks.filter(t => !t.completed)
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
        .slice(0, 3);

    if (pending.length === 0) {
        upcomingList.innerHTML = '<li class="empty-state">No upcoming tasks!</li>';
    } else {
        pending.forEach(task => {
            const subject = AppState.subjects.find(s => s.id == task.subjectId);
            const li = document.createElement('li');
            li.style.display = 'flex';
            li.style.justifyContent = 'space-between';
            li.style.padding = '8px 0';
            li.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
            li.innerHTML = `
                <span>${task.title} <small style="color:${subject?.color}">• ${subject?.name}</small></span>
                <span style="font-size:0.8rem; color:${getDueDateColor(task.dueDate)}">${new Date(task.dueDate).toLocaleDateString()}</span>
            `;
            upcomingList.appendChild(li);
        });
    }
}

// --- SUBJECTS ---
function renderSubjects() {
    const grid = document.getElementById('subjects-grid');
    grid.innerHTML = '';

    AppState.subjects.forEach(sub => {
        const card = document.createElement('div');
        card.className = 'subject-card';
        card.style.setProperty('--subject-color', sub.color);
        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <h4 style="font-size:1.2rem; color:${sub.color}">${sub.name}</h4>
                <button onclick="deleteSubject(${sub.id})" style="color:var(--text-secondary); background:none;"><i class='bx bxs-trash'></i></button>
            </div>
            <p style="font-size:0.9rem; color:var(--text-secondary)">
                Tasks: ${AppState.tasks.filter(t => t.subjectId == sub.id).length} | 
                Classes: ${AppState.schedule.filter(s => s.subjectId == sub.id).length}
            </p>
        `;
        grid.appendChild(card);
    });

    // Populate Select Dropdowns
    updateSubjectDropdowns();
}

function handleSubjectSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('subject-name').value;
    const color = document.getElementById('subject-color').value;

    const newSubject = {
        id: Date.now(),
        name,
        color
    };

    AppState.subjects.push(newSubject);
    saveData();
    renderSubjects();
    renderDashboard();
    renderAnalytics(); // Updates bar chart if needed (subject list changed)
    closeModal('subject-modal');
    e.target.reset();
}

function deleteSubject(id) {
    if (confirm('Delete this subject and all associated tasks?')) {
        AppState.subjects = AppState.subjects.filter(s => s.id != id);
        AppState.tasks = AppState.tasks.filter(t => t.subjectId != id);
        AppState.schedule = AppState.schedule.filter(s => s.subjectId != id);
        saveData();
        renderAll();
    }
}

function updateSubjectDropdowns() {
    const opts = AppState.subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
    document.getElementById('task-subject').innerHTML = opts;
    document.getElementById('schedule-subject').innerHTML = opts;
}

// --- TASKS ---
// --- TASKS (GRID VIEW) ---
function renderTasks(filter = 'all') {
    const container = document.getElementById('tasks-list');
    container.innerHTML = '';
    container.className = 'tasks-grid'; // Ensure grid class is applied

    let tasks = AppState.tasks;
    if (filter === 'pending') tasks = tasks.filter(t => !t.completed);
    if (filter === 'completed') tasks = tasks.filter(t => t.completed);

    tasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    if (tasks.length === 0) {
        container.innerHTML = '<div class="empty-state" style="grid-column: 1/-1;">No tasks found. Add a task to get started!</div>';
        return;
    }

    tasks.forEach(task => {
        const subject = AppState.subjects.find(s => s.id == task.subjectId);
        const card = document.createElement('div');
        card.className = `task-card-grid ${task.completed ? 'completed' : ''}`;
        if (subject) card.style.setProperty('--subject-color', subject.color);

        // Handle Description
        const description = task.description ? `<p class="task-desc">${task.description}</p>` : '<p class="task-desc" style="font-style:italic; opacity:0.5;">No description provided.</p>';

        card.innerHTML = `
            <div class="task-card-header">
                <div style="flex:1; min-width:0;">
                    <span class="task-badge">${subject ? subject.name : 'General'}</span>
                    <h4 class="task-card-title">${task.title}</h4>
                </div>
                <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask(${task.id})" title="Mark as Done" style="margin-left:10px;">
            </div>
            
            ${description}
            
            <div class="task-card-footer">
                <div class="task-due" style="color:${getDueDateColor(task.dueDate)}">
                    <i class='bx bx-time'></i> ${new Date(task.dueDate).toLocaleDateString()}
                </div>
                <button onclick="deleteTask(${task.id})" style="background:none; color:var(--text-secondary); transition:color 0.2s;" title="Delete Task">
                    <i class='bx bxs-trash'></i>
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

function handleTaskSubmit(e) {
    e.preventDefault();
    const title = document.getElementById('task-title').value;
    const desc = document.getElementById('task-desc').value;
    const subjectId = document.getElementById('task-subject').value;
    const dueDate = document.getElementById('task-due').value;

    const newTask = {
        id: Date.now(),
        title,
        description: desc, // Store description
        subjectId,
        dueDate,
        completed: false
    };

    AppState.tasks.push(newTask);
    saveData();
    renderTasks();
    renderDashboard();
    renderAnalytics();
    closeModal('task-modal');
    e.target.reset();
}

function toggleTask(id) {
    const task = AppState.tasks.find(t => t.id == id);
    if (task) {
        task.completed = !task.completed;
        saveData();
        renderTasks(); // Re-render to update UI state
        renderDashboard();
        renderAnalytics();
    }
}

function deleteTask(id) {
    if (confirm('Delete task?')) {
        AppState.tasks = AppState.tasks.filter(t => t.id != id);
        saveData();
        renderTasks();
        renderDashboard();
        renderAnalytics();
    }
}

function getDueDateColor(dateStr) {
    const daysLeft = (new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24);
    if (daysLeft < 0) return 'red'; // Overdue
    if (daysLeft < 2) return 'var(--neon-warning)'; // Urgent
    return 'var(--text-secondary)';
}

// --- FOCUS TIMER ---
let timerInterval;
let totalTime = 25 * 60;
let timerTime = totalTime;
let isTimerRunning = false;
function startTimer() {
    if (isTimerRunning) return;

    isTimerRunning = true;
    const circle = document.querySelector('.progress-ring__circle');

    // Safety check: Initialization if missing
    if (circle && !circle.getAttribute('stroke-dasharray')) {
        const radius = circle.r.baseVal.value;
        const circumference = radius * 2 * Math.PI;
        circle.style.strokeDasharray = `${circumference} ${circumference}`;
    }

    timerInterval = setInterval(() => {
        if (timerTime > 0) {
            timerTime--;
            updateTimerDisplay();
        } else {
            pauseTimer();
            // Could add Audio here
            alert("Time's up! Focus session complete.");
            resetTimer();
        }
    }, 1000);
}

function pauseTimer() {
    isTimerRunning = false;
    clearInterval(timerInterval);
}

function resetTimer() {
    pauseTimer();
    timerTime = totalTime;
    updateTimerDisplay();
}

function toggleTimer() {
    if (isTimerRunning) {
        pauseTimer();
    } else {
        startTimer();
    }
}

function setTimerMode(minutes) {
    pauseTimer();
    totalTime = minutes * 60;
    timerTime = totalTime;
    updateTimerDisplay();

    // Reset active buttons visually
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    // Attempt to set active class on clicked element
    if (event && event.target) {
        event.target.classList.add('active');
    }
}

function setCustomTime() {
    const input = document.getElementById('custom-time-input');
    const minutes = parseInt(input.value);

    if (minutes > 0) {
        setTimerMode(minutes);
        input.value = '';
    } else {
        alert("Please enter a valid number of minutes.");
    }
}

function updateTimerDisplay() {
    const m = Math.floor(timerTime / 60);
    const s = timerTime % 60;
    const display = document.getElementById('timer-text');
    if (display) display.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

    // Update Circle
    const circle = document.querySelector('.progress-ring__circle');
    if (circle) {
        const radius = circle.r.baseVal.value;
        const circumference = radius * 2 * Math.PI;

        // Ensure circle is styled
        if (!circle.style.strokeDasharray) {
            circle.style.strokeDasharray = `${circumference} ${circumference}`;
        }

        const offset = circumference - ((totalTime - timerTime) / totalTime) * circumference;
        circle.style.strokeDashoffset = offset;
    }
}

// --- SCHEDULE ---
function renderSchedule() {
    // Simple list view for now, effectively enhanced in full version
    // Here we can build a proper grid if needed, or list by day
    // For this prototype, let's categorize by Day
    const container = document.getElementById('timetable-grid');
    container.innerHTML = '';

    // Group by day
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    days.forEach(day => {
        const dayClasses = AppState.schedule.filter(s => s.day === day).sort((a, b) => a.time.localeCompare(b.time));
        if (dayClasses.length > 0) {
            const dayCol = document.createElement('div');
            dayCol.className = 'day-column';
            dayCol.innerHTML = `<h4 style="margin-bottom:10px; color:var(--text-primary); border-bottom:1px solid var(--neon-blue); padding-bottom:5px;">${day}</h4>`;

            dayClasses.forEach(cls => {
                const sub = AppState.subjects.find(s => s.id == cls.subjectId);
                const item = document.createElement('div');
                item.style.background = 'rgba(255,255,255,0.05)';
                item.style.padding = '8px';
                item.style.marginBottom = '5px';
                item.style.borderRadius = '6px';
                item.style.borderLeft = `3px solid ${sub ? sub.color : '#fff'}`;
                item.innerHTML = `
                    <div style="font-weight:bold; font-size:0.9rem;">${cls.time}</div>
                    <div style="font-size:0.85rem;">${sub ? sub.name : 'Unknown'}</div>
                    <div style="font-size:0.7rem; color:#aaa;">${cls.duration} mins</div>
                    <button onclick="deleteSchedule(${cls.id})" style="font-size:0.7rem; color:red; float:right; background:none;">X</button>
                    <div style="clear:both;"></div>
                `;
                dayCol.appendChild(item);
            });
            container.appendChild(dayCol);
        }
    });

    // Adjust Grid style dynamically
    container.style.gridTemplateColumns = `repeat(auto-fit, minmax(150px, 1fr))`;
}

function handleScheduleSubmit(e) {
    e.preventDefault();
    const subjectId = document.getElementById('schedule-subject').value;
    const day = document.getElementById('schedule-day').value;
    const time = document.getElementById('schedule-time').value;
    const duration = document.getElementById('schedule-duration').value;

    const newClass = {
        id: Date.now(),
        subjectId,
        day,
        time,
        duration
    };

    AppState.schedule.push(newClass);
    saveData();
    renderSchedule();
    renderDashboard();
    closeModal('schedule-modal');
    e.target.reset();
}

function deleteSchedule(id) {
    if (confirm('Remove this class?')) {
        AppState.schedule = AppState.schedule.filter(s => s.id != id);
        saveData();
        renderSchedule();
        renderDashboard();
    }
}

// --- ANALYTICS ---
function renderAnalytics() {
    // 1. Completion Rate Pie (Donut)
    const total = AppState.tasks.length;
    let percentage = 0;

    if (total > 0) {
        const completed = AppState.tasks.filter(t => t.completed).length;
        percentage = Math.round((completed / total) * 100);

        document.getElementById('completion-chart').style.background = `
            conic-gradient(
                var(--neon-green) 0% ${percentage}%, 
                var(--card-bg) ${percentage}% 100%
            )
        `;
    } else {
        document.getElementById('completion-chart').style.background = 'var(--card-bg)';
    }

    document.getElementById('completion-text').textContent = `${percentage}%`;

    // 2. Tasks by Subject Bar Chart
    const barContainer = document.getElementById('subject-chart-container');
    barContainer.innerHTML = '';

    // Calculate counts
    const subjectCounts = AppState.subjects.map(sub => {
        const count = AppState.tasks.filter(t => t.subjectId == sub.id).length;
        return { name: sub.name, color: sub.color, count };
    }).filter(item => item.count > 0); // Only show subjects with tasks

    const maxCount = Math.max(...subjectCounts.map(s => s.count), 1); // Avoid div by zero

    if (subjectCounts.length === 0) {
        barContainer.innerHTML = '<div class="empty-state">No tasks to analyze yet!</div>';
    } else {
        subjectCounts.forEach(item => {
            const width = Math.round((item.count / maxCount) * 100);

            const row = document.createElement('div');
            row.className = 'bar-row';
            row.innerHTML = `
                <div class="bar-label" title="${item.name}">${item.name}</div>
                <div class="bar-track">
                    <div class="bar-fill" style="width: ${width}%; background: ${item.color}"></div>
                </div>
                <div class="bar-value">${item.count}</div>
            `;
            barContainer.appendChild(row);
        });
    }
}

// --- UTILS ---
function openModal(id) {
    document.getElementById(id).style.display = 'flex';
}
function closeModal(id) {
    document.getElementById(id).style.display = 'none';
}

// Expose openModal to window for button onclicks
window.openModal = openModal;
window.closeModal = closeModal;
window.deleteSubject = deleteSubject;
window.deleteTask = deleteTask;
window.toggleTask = toggleTask;
window.deleteSchedule = deleteSchedule;
window.navigateTo = navigateTo;
// Timer Functions
window.startTimer = startTimer;
window.pauseTimer = pauseTimer;
window.resetTimer = resetTimer;
window.toggleTimer = toggleTimer;
window.setTimerMode = setTimerMode;
window.setCustomTime = setCustomTime;

function exportData() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(AppState));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "study_planner_backup.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}
window.exportData = exportData;
