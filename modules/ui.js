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
  const allViews = ['terminal-view', 'editors-view', 'dashboard-view'];
  allViews.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add('hidden');
  });

  if (view === 'terminal') {
    const t = document.getElementById('terminal-view');
    if (t) t.classList.remove('hidden');
  } else if (view === 'editors') {
    const e = document.getElementById('editors-view');
    if (e) e.classList.remove('hidden');
  } else if (view === 'dashboard') {
    const d = document.getElementById('dashboard-view');
    if (d) d.classList.remove('hidden');
  } else if (view === 'help') {
    const h = document.getElementById('help-sidebar');
    if (h) h.classList.remove('hidden');
  }

  // Toggle header tabs (ids starting with tab-)
  document.querySelectorAll('[id^="tab-"]').forEach(btn => {
    btn.classList.toggle('active', btn.id === `tab-${view}`);
  });
}

export function switchEditorTab(tab) {
  // Show/hide editor panes by id (pane-dockerfile, pane-compose)
  document.querySelectorAll('[id^="pane-"]').forEach(p => {
    p.classList.toggle('hidden', p.id !== `pane-${tab}`);
  });

  // Toggle editor tab active state (ids like editor-tab-dockerfile)
  document.querySelectorAll('[id^="editor-tab-"]').forEach(btn => {
    btn.classList.toggle('active', btn.id === `editor-tab-${tab}`);
  });
}

export function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) overlay.classList.add('hidden');
}

export function closeHelpPanel() {
  const h = document.getElementById('help-sidebar');
  if (h) h.classList.add('hidden');
}

export default {
  notify,
  toggleTheme,
  switchView,
  switchEditorTab,
  closeModal,
  closeHelpPanel,
};
