// DOM Elements
const taskInput = document.getElementById('task-input');
const addBtn = document.getElementById('add-btn');
const taskList = document.getElementById('task-list');
const emptyState = document.getElementById('empty-state');
const filterBtns = document.querySelectorAll('.filter-btn');
const clearCompletedBtn = document.getElementById('clear-completed-btn');

const countAll = document.getElementById('count-all');
const countActive = document.getElementById('count-active');
const countCompleted = document.getElementById('count-completed');

// State
let tasks = [];
let currentFilter = 'all';

// Load tasks from localStorage
function loadTasks() {
  try {
    const saved = localStorage.getItem('smart_todo_tasks');
    if (saved) {
      tasks = JSON.parse(saved);
    }
  } catch (err) {
    console.error('Failed to parse localStorage tasks:', err);
    tasks = [];
  }
  renderTasks();
}

// Save tasks to localStorage
function saveTasks() {
  localStorage.setItem('smart_todo_tasks', JSON.stringify(tasks));
  renderTasks();
}

// Add a new task
function addTask() {
  const text = taskInput.value.trim();
  if (!text) {
    alert('Please enter a task description.');
    taskInput.focus();
    return;
  }

  const newTask = {
    id: Date.now().toString(),
    text: text,
    completed: false,
    createdAt: new Date().toISOString(),
  };

  tasks.unshift(newTask);
  taskInput.value = '';
  taskInput.focus();
  saveTasks();
}

// Toggle completed state
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
function editTask(id, spanElement) {
  const currentText = spanElement.textContent;
  const input = document.createElement('input');
  input.type = 'text';
  input.value = currentText;
  input.className = 'edit-input';

  spanElement.replaceWith(input);
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

// Clear all completed tasks
function clearCompleted() {
  tasks = tasks.filter((t) => !t.completed);
  saveTasks();
}

// Render tasks based on filter
function renderTasks() {
  taskList.innerHTML = '';

  // Update counts
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const active = total - completed;

  countAll.textContent = total;
  countActive.textContent = active;
  countCompleted.textContent = completed;

  // Filter tasks
  const filtered = tasks.filter((t) => {
    if (currentFilter === 'active') return !t.completed;
    if (currentFilter === 'completed') return t.completed;
    return true;
  });

  // Empty state check
  if (filtered.length === 0) {
    emptyState.classList.remove('hidden');
  } else {
    emptyState.classList.add('hidden');
  }

  // Build task items
  filtered.forEach((task) => {
    const li = document.createElement('li');
    if (task.completed) li.classList.add('completed');

    // Checkbox indicator
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.completed;
    checkbox.className = 'task-checkbox';
    checkbox.addEventListener('change', () => toggleTask(task.id));

    // Text span
    const span = document.createElement('span');
    span.textContent = task.text;
    span.className = 'task-text';
    span.title = 'Double-click to edit';
    span.addEventListener('dblclick', () => editTask(task.id, span));

    // Delete Button
    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = '&times;';
    deleteBtn.className = 'delete-btn';
    deleteBtn.title = 'Delete task';
    deleteBtn.addEventListener('click', () => deleteTask(task.id));

    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(deleteBtn);
    taskList.appendChild(li);
  });
}

// Event Listeners
addBtn.addEventListener('click', addTask);
taskInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addTask();
});

filterBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    filterBtns.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderTasks();
  });
});

clearCompletedBtn.addEventListener('click', clearCompleted);

// Initialize on page load
loadTasks();
