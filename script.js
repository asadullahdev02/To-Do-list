// Select DOM elements
const taskInput = document.getElementById('task-input');
const addBtn = document.getElementById('add-btn');
const taskList = document.getElementById('task-list');

// Add a new task
function addTask() {
  const taskText = taskInput.value.trim();
  if (taskText === '') {
    alert('Please enter a task!');
    return;
  }

  // Create task items
  const li = document.createElement('li');
  const span = document.createElement('span');
  span.textContent = taskText;

  // Toggle completed state on click
  span.addEventListener('click', function () {
    li.classList.toggle('completed');
  });

  // Create delete button
  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = 'Delete';
  deleteBtn.className = 'delete-btn';
  deleteBtn.addEventListener('click', function () {
    li.remove();
  });

  // Append elements to list
  li.appendChild(span);
  li.appendChild(deleteBtn);
  taskList.appendChild(li);

  // Clear input field
  taskInput.value = '';
  taskInput.focus();
}

// Event listeners for button click and Enter key
addBtn.addEventListener('click', addTask);
taskInput.addEventListener('keypress', function (event) {
  if (event.key === 'Enter') {
    addTask();
  }
});
