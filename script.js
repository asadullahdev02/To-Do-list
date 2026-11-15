// DOM Elements
const taskInput = document.getElementById('task-input');
const prioritySelect = document.getElementById('priority-select');
const categorySelect = document.getElementById('category-select');
const dueDateInput = document.getElementById('due-date-input');
const addBtn = document.getElementById('add-btn');

const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search-btn');

const taskList = document.getElementById('task-list');
const emptyState = document.getElementById('empty-state');
const emptyText = document.getElementById('empty-text');
const filterBtns = document.querySelectorAll('.filter-btn');
const clearCompletedBtn = document.getElementById('clear-completed-btn');

const countAll = document.getElementById('count-all');
const countActive = document.getElementById('count-active');
const countCompleted = document.getElementById('count-completed');
const countHigh = document.getElementById('count-high');

const exportBtn = document.getElementById('export-btn');
const importFileInput = document.getElementById('import-file');

// State
let tasks = [];
let currentFilter = 'all';
let searchQuery = '';

// Load tasks from localStorage with backward-compatible migration
function loadTasks() {
  try {
    const saved = localStorage.getItem('smart_todo_tasks_v2') || localStorage.getItem('smart_todo_tasks');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Ensure all fields exist
      tasks = parsed.map((t) => ({
        id: t.id || Date.now().toString() + Math.random().toString(36).substr(2, 4),
        text: t.text || 'Untitled Task',
        completed: Boolean(t.completed),
        priority: t.priority || 'medium',
        category: t.category || 'General',
        dueDate: t.dueDate || '',
        createdAt: t.createdAt || new Date().toISOString(),
      }));
    }
  } catch (err) {
    console.error('Failed to parse localStorage tasks:', err);
    tasks = [];
  }
  renderTasks();
}

// Save tasks to localStorage
function saveTasks() {
  localStorage.setItem('smart_todo_tasks_v2', JSON.stringify(tasks));
  renderTasks();
}

// Format and check due date status
function getDueDateStatus(dueDateStr) {
  if (!dueDateStr) return null;
  const todayStr = new Date().toISOString().split('T')[0];
  const target = new Date(dueDateStr + 'T00:00:00');
  const today = new Date(todayStr + 'T00:00:00');

  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { label: `Overdue (${Math.abs(diffDays)}d ago)`, type: 'due-overdue' };
  }
  if (diffDays === 0) {
    return { label: 'Due Today', type: 'due-today' };
  }
  if (diffDays === 1) {
    return { label: 'Due Tomorrow', type: 'due-normal' };
  }
  const dateFormatted = target.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return { label: `Due ${dateFormatted}`, type: 'due-normal' };
}

// Add a new task
function addTask() {
  const text = taskInput.value.trim();
  if (!text) {
    taskInput.focus();
    return;
  }

  const newTask = {
    id: Date.now().toString(),
    text: text,
    completed: false,
    priority: prioritySelect.value || 'medium',
    category: categorySelect.value || 'General',
    dueDate: dueDateInput.value || '',
    createdAt: new Date().toISOString(),
  };

  tasks.unshift(newTask);
  taskInput.value = '';
  dueDateInput.value = '';
  taskInput.focus();
  saveTasks();
}

// Toggle task completion
function toggleTask(id) {
  tasks = tasks.map((task) =>
    task.id === id ? { ...task, completed: !task.completed } : task
  );
  saveTasks();
}

// Delete task
function deleteTask(id) {
  tasks = tasks.filter((task) => task.id !== id);
  saveTasks();
}

// Edit task inline
function editTask(id, textElement) {
  const currentText = textElement.textContent;
  const input = document.createElement('input');
  input.type = 'text';
  input.value = currentText;
  input.className = 'edit-input';

  textElement.replaceWith(input);
  input.focus();

  function finishEdit() {
    const updated = input.value.trim();
    if (updated) {
      tasks = tasks.map((t) => (t.id === id ? { ...t, text: updated } : t));
    }
    saveTasks();
  }

  input.addEventListener('blur', finishEdit);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') finishEdit();
    if (e.key === 'Escape') renderTasks();
  });
}

// Clear completed tasks
function clearCompleted() {
  const count = tasks.filter((t) => t.completed).length;
  if (count === 0) return;
  tasks = tasks.filter((t) => !t.completed);
  saveTasks();
}

// Export tasks to JSON
function exportTasks() {
  if (tasks.length === 0) {
    alert('No tasks to export.');
    return;
  }
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(tasks, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `todo-backup-${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

// Import tasks from JSON file
function importTasks(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const imported = JSON.parse(e.target.result);
      if (Array.isArray(imported)) {
        // Merge without duplicate IDs
        const existingIds = new Set(tasks.map((t) => t.id));
        const newTasks = imported.filter((t) => !existingIds.has(t.id));
        tasks = [...newTasks, ...tasks];
        saveTasks();
        alert(`Successfully imported ${newTasks.length} task(s)!`);
      } else {
        alert('Invalid JSON file format.');
      }
    } catch {
      alert('Failed to read JSON backup file.');
    }
    importFileInput.value = '';
  };
  reader.readAsText(file);
}

// Render tasks based on filter & search
function renderTasks() {
  taskList.innerHTML = '';

  // Update Counters
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const active = total - completed;
  const high = tasks.filter((t) => t.priority === 'high' && !t.completed).length;

  countAll.textContent = total;
  countActive.textContent = active;
  countCompleted.textContent = completed;
  countHigh.textContent = high;

  // Filter tasks
  const filtered = tasks.filter((t) => {
    // Tab filter
    if (currentFilter === 'active' && t.completed) return false;
    if (currentFilter === 'completed' && !t.completed) return false;
    if (currentFilter === 'high' && t.priority !== 'high') return false;

    // Search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchText = t.text.toLowerCase().includes(query);
      const matchCat = t.category && t.category.toLowerCase().includes(query);
      if (!matchText && !matchCat) return false;
    }

    return true;
  });

  // Empty state check
  if (filtered.length === 0) {
    emptyState.classList.remove('hidden');
    if (searchQuery) {
      emptyText.textContent = `No tasks matching "${searchQuery}".`;
    } else if (currentFilter === 'active') {
      emptyText.textContent = 'All tasks completed! You are all caught up.';
    } else if (currentFilter === 'completed') {
      emptyText.textContent = 'No completed tasks yet.';
    } else if (currentFilter === 'high') {
      emptyText.textContent = 'No high-priority tasks right now.';
    } else {
      emptyText.textContent = 'No tasks found. Add a task above to get organized!';
    }
  } else {
    emptyState.classList.add('hidden');
  }

  // Build task items
  filtered.forEach((task) => {
    const li = document.createElement('li');
    if (task.completed) li.classList.add('completed');
    li.classList.add(`priority-border-${task.priority || 'medium'}`);

    // Checkbox indicator
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.completed;
    checkbox.className = 'task-checkbox';
    checkbox.addEventListener('change', () => toggleTask(task.id));

    // Content container
    const content = document.createElement('div');
    content.className = 'task-content';

    // Title / text span
    const textSpan = document.createElement('span');
    textSpan.textContent = task.text;
    textSpan.className = 'task-text';
    textSpan.title = 'Double-click to edit task';
    textSpan.addEventListener('dblclick', () => editTask(task.id, textSpan));
    content.appendChild(textSpan);

    // Metadata Row (Priority badge, category badge, due date)
    const metaRow = document.createElement('div');
    metaRow.className = 'task-meta-row';

    // Priority badge
    const priorityBadge = document.createElement('span');
    priorityBadge.className = `meta-badge meta-priority-${task.priority}`;
    priorityBadge.textContent =
      task.priority === 'high' ? 'High' : task.priority === 'low' ? 'Low' : 'Medium';
    metaRow.appendChild(priorityBadge);

    // Category badge
    if (task.category && task.category !== 'General') {
      const catBadge = document.createElement('span');
      catBadge.className = 'meta-badge meta-category';
      catBadge.textContent = task.category;
      metaRow.appendChild(catBadge);
    }

    // Due date badge
    if (task.dueDate && !task.completed) {
      const dueInfo = getDueDateStatus(task.dueDate);
      if (dueInfo) {
        const dueBadge = document.createElement('span');
        dueBadge.className = `meta-badge meta-due ${dueInfo.type}`;
        dueBadge.textContent = dueInfo.label;
        metaRow.appendChild(dueBadge);
      }
    }

    content.appendChild(metaRow);

    // Delete Button
    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = '&times;';
    deleteBtn.className = 'delete-btn';
    deleteBtn.title = 'Delete task';
    deleteBtn.addEventListener('click', () => deleteTask(task.id));

    li.appendChild(checkbox);
    li.appendChild(content);
    li.appendChild(deleteBtn);
    taskList.appendChild(li);
  });
}

// Event Listeners
addBtn.addEventListener('click', addTask);
taskInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addTask();
});

// Search input
searchInput.addEventListener('input', (e) => {
  searchQuery = e.target.value.trim();
  if (searchQuery) {
    clearSearchBtn.classList.remove('hidden');
  } else {
    clearSearchBtn.classList.add('hidden');
  }
  renderTasks();
});

clearSearchBtn.addEventListener('click', () => {
  searchInput.value = '';
  searchQuery = '';
  clearSearchBtn.classList.add('hidden');
  searchInput.focus();
  renderTasks();
});

// Filter buttons
filterBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    filterBtns.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderTasks();
  });
});

clearCompletedBtn.addEventListener('click', clearCompleted);
exportBtn.addEventListener('click', exportTasks);
importFileInput.addEventListener('change', importTasks);

// Initialize on page load
loadTasks();
