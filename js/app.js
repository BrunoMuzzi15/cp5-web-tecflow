const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

const sidebar = $('#sidebar');
const overlay = $('#overlay');

$('#menu-button').addEventListener('click', () => {
  sidebar.classList.remove('-translate-x-full');
  overlay.classList.remove('hidden');
});
function closeSidebar() {
  sidebar.classList.add('-translate-x-full');
  overlay.classList.add('hidden');
}
overlay.addEventListener('click', closeSidebar);
$$('.nav-item').forEach(link => link.addEventListener('click', () => {
  $$('.nav-item').forEach(item => item.classList.toggle('active', item === link));
  closeSidebar();
}));

$('#user-button').addEventListener('click', () => $('#user-menu').classList.toggle('hidden'));
document.addEventListener('click', event => {
  if (!$('#user-button').contains(event.target) && !$('#user-menu').contains(event.target)) {
    $('#user-menu').classList.add('hidden');
  }
});

let theme = localStorage.getItem('techflow-theme') || 'system';
function applyTheme() {
  const dark = theme === 'dark' || (theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
  $('#theme-label').textContent = theme[0].toUpperCase() + theme.slice(1);
  localStorage.setItem('techflow-theme', theme);
}
applyTheme();
$('#theme-button').addEventListener('click', () => {
  theme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
  applyTheme();
});
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (theme === 'system') applyTheme();
});

const modal = $('#project-modal');
const form = $('#project-form');
function openModal() {
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  $('input[name="name"]', form).focus();
}
function closeModal() {
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}
$('#open-modal').addEventListener('click', openModal);
$('#close-modal').addEventListener('click', closeModal);
$('#cancel-modal').addEventListener('click', closeModal);
modal.addEventListener('click', event => { if (event.target === modal) closeModal(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape') { closeModal(); closeSidebar(); } });

const dateInput = $('input[name="deadline"]', form);
const today = new Date();
dateInput.min = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

function validateField(field) {
  const label = field.closest('.form-label');
  const error = $('.error-message', label);
  let message = '';
  if (field.required && !field.value.trim()) message = 'Este campo é obrigatório.';
  else if (field.name === 'name' && field.value.trim().length < 3) message = 'Digite pelo menos 3 caracteres.';
  else if (field.name === 'description' && field.value.trim().length < 10) message = 'Digite pelo menos 10 caracteres.';
  else if (field.name === 'deadline' && field.value < dateInput.min) message = 'Escolha uma data válida.';
  label.classList.toggle('invalid', Boolean(message));
  label.classList.toggle('valid', !message && Boolean(field.value.trim()));
  error.textContent = message;
  return !message;
}
$$('input, select, textarea', form).forEach(field => {
  field.addEventListener('blur', () => validateField(field));
  field.addEventListener('input', () => {
    if (field.closest('.form-label').classList.contains('invalid') || field.value) validateField(field);
  });
  field.addEventListener('change', () => validateField(field));
});

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}
function addProject(data) {
  const card = document.createElement('article');
  card.className = 'project-card';
  card.dataset.status = 'Em andamento';
  card.dataset.name = data.name;
  card.innerHTML = `
    <div class="project-banner bg-indigo-100 dark:bg-indigo-950"><div><p class="text-sm font-semibold text-indigo-700 dark:text-indigo-300">${escapeHTML(data.category.toUpperCase())}</p><h4 class="text-xl font-bold text-indigo-950 dark:text-white">${escapeHTML(data.name)}</h4></div></div>
    <div class="p-4"><div class="mb-3 flex items-center justify-between"><span class="status status-progress">Em andamento</span><span class="text-sm">0%</span></div><div class="progress"><div class="h-full w-0 rounded-full bg-indigo-600"></div></div><p class="mt-3 text-sm text-gray-500 dark:text-gray-400">${escapeHTML(data.description)}</p><p class="mt-4 text-xs text-gray-500">Responsável: ${escapeHTML(data.owner)}</p><p class="mt-2 text-xs text-gray-500">Prioridade: ${escapeHTML(data.priority)} | Prazo: ${escapeHTML(data.deadline.split('-').reverse().join('/'))}</p></div>`;
  $('#project-grid').prepend(card);
  $('#active-count').textContent = Number($('#active-count').textContent) + 1;
  applyFilters();
}
function showMessage(message, type) {
  const box = $('#form-message');
  box.textContent = message;
  box.className = 'mb-4 rounded-lg p-3 text-sm ' + (type === 'error' ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-200' : 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-200');
}
form.addEventListener('submit', event => {
  event.preventDefault();
  const fields = $$('input, select, textarea', form);
  if (!fields.map(validateField).every(Boolean)) {
    showMessage('Verifique os campos destacados.', 'error');
    return;
  }
  const values = Object.fromEntries(new FormData(form).entries());
  addProject(values);
  showMessage('Projeto criado com sucesso.', 'success');
  $('#submit-button').disabled = true;
  setTimeout(() => {
    closeModal();
    form.reset();
    $$('.form-label', form).forEach(label => label.classList.remove('valid', 'invalid'));
    $$('.error-message', form).forEach(error => error.textContent = '');
    $('#form-message').classList.add('hidden');
    $('#submit-button').disabled = false;
  }, 900);
});

let selectedStatus = 'Todos';
function applyFilters() {
  const query = $('#search').value.toLocaleLowerCase('pt-BR').trim();
  let count = 0;
  $$('.project-card', $('#project-grid')).forEach(card => {
    const matchesStatus = selectedStatus === 'Todos' || card.dataset.status === selectedStatus;
    const matchesText = card.dataset.name.toLocaleLowerCase('pt-BR').includes(query);
    const visible = matchesStatus && matchesText;
    card.classList.toggle('hidden', !visible);
    if (visible) count++;
  });
  $('#empty-message').classList.toggle('hidden', count > 0);
}
$('#search').addEventListener('input', applyFilters);
$('#filter').addEventListener('change', event => {
  selectedStatus = event.target.value;
  applyFilters();
});


// Navegação entre as seções do dashboard.
const observedSections = ['dashboard', 'projetos', 'equipes', 'tarefas'];
const sectionObserver = new IntersectionObserver(entries => {
  const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
  if (!visible) return;
  $$('.nav-item').forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${visible.target.id}`));
}, { rootMargin: '-10% 0px -70% 0px', threshold: [0, 0.2, 0.5] });
observedSections.forEach(id => { const section = document.getElementById(id); if (section) sectionObserver.observe(section); });

// Tarefas: marcar como concluída, atualizar contagem e adicionar novas tarefas.
function updateTaskSummary() {
  const checks = $$('.task-check', $('#task-list'));
  const completed = checks.filter(check => check.checked).length;
  $('#task-summary').textContent = `${completed} de ${checks.length} concluídas`;
  $('#pending-count').textContent = String(checks.length - completed).padStart(2, '0');
}
$('#task-list').addEventListener('change', event => {
  if (event.target.matches('.task-check')) updateTaskSummary();
});
$('#task-form').addEventListener('submit', event => {
  event.preventDefault();
  const input = $('#new-task');
  const name = input.value.trim();
  if (name.length < 3) { input.focus(); return; }
  const label = document.createElement('label');
  label.className = 'task-row';
  label.innerHTML = `<input type="checkbox" class="task-check"><span><strong>${escapeHTML(name)}</strong><small>Nova tarefa · Não atribuída</small></span><span class="task-priority">Nova</span>`;
  $('#task-list').append(label);
  input.value = '';
  updateTaskSummary();
});
updateTaskSummary();
