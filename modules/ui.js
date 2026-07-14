export function notify(message, timeout = 2000) {
  const el = document.getElementById('notification');
  if (!el) return;
  el.textContent = message;
  el.style.opacity = '1';
  setTimeout(() => { el.textContent = ''; el.style.opacity = ''; }, timeout);
}

export function toggleTheme() {
  const body = document.body;
  const current = body.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  body.setAttribute('data-theme', next);
  notify(`Tema: ${next}`);
}

export function switchView(view) {
  const panels = ['terminal-panel', 'editors-area', 'challenges-area', 'help-panel', 'dashboard'];
  panels.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.display = 'none';
  });

  if (view === 'terminal') {
    const t = document.getElementById('terminal-panel');
    const d = document.getElementById('dashboard');
    if (t) t.style.display = 'block';
    if (d) d.style.display = 'block';
  } else if (view === 'editors') {
    const e = document.getElementById('editors-area');
    if (e) e.style.display = 'block';
  } else if (view === 'challenges') {
    const c = document.getElementById('challenges-area');
    if (c) c.style.display = 'block';
  } else if (view === 'help') {
    const h = document.getElementById('help-panel');
    if (h) h.style.display = 'block';
  }

  document.querySelectorAll('.header-tab').forEach(btn => {
    const id = btn.id || '';
    btn.classList.toggle('active', id === `tab-${view}`);
  });
}

export function switchEditorTab(tab) {
  document.querySelectorAll('.editor-pane').forEach(p => p.classList.toggle('active', p.id === `pane-${tab}`));
  document.querySelectorAll('.editor-tab').forEach(btn => {
    const text = (btn.textContent || '').toLowerCase();
    btn.classList.toggle('active', (tab === 'dockerfile' && text.includes('dockerfile')) || (tab === 'compose' && text.includes('compose')));
  });
}

export function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) overlay.style.display = 'none';
}

export default {
  notify,
  toggleTheme,
  switchView,
  switchEditorTab,
  closeModal,
};
