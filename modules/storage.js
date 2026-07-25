import { notify } from './ui.js';

function normalizeState(state) {
  if (!state) return null;
  return {
    ...state,
    containers: Array.isArray(state.containers) ? state.containers : [],
    images: Array.isArray(state.images) ? state.images : [],
    networks: Array.isArray(state.networks) ? state.networks : [],
    volumes: Array.isArray(state.volumes) ? state.volumes : [],
    cmdHistory: Array.isArray(state.cmdHistory) ? state.cmdHistory : [],
    historyIdx: typeof state.historyIdx === 'number' ? state.historyIdx : -1,
    currentChallenge: typeof state.currentChallenge === 'number' ? state.currentChallenge : 0,
    composedContainers: Array.isArray(state.composedContainers) ? state.composedContainers : [],
    usedPorts: Array.isArray(state.usedPorts) ? state.usedPorts : []
  };
}

export function saveState(state = null, options = {}) {
  try {
    const snapshot = normalizeState(state || {});
    const payload = {
      ...snapshot,
      savedAt: Date.now(),
      usedPorts: Array.isArray(snapshot?.usedPorts) ? snapshot.usedPorts : []
    };
    localStorage.setItem('dockersim:state', JSON.stringify(payload));
    if (!options.silent) {
      notify('Sessão salva');
    }
  } catch (err) {
    console.error('saveState error', err);
    notify('Erro ao salvar sessão');
  }
}

export function loadState() {
  try {
    const raw = localStorage.getItem('dockersim:state');
    if (!raw) return null;
    const data = JSON.parse(raw);
    return normalizeState(data);
  } catch (err) {
    console.error('loadState error', err);
    return null;
  }
}

export function resetAll() {
  try {
    localStorage.removeItem('dockersim:state');
    notify('Estado reiniciado');
    setTimeout(() => location.reload(), 300);
  } catch (err) {
    console.error('resetAll error', err);
    notify('Erro ao resetar');
  }
}

export default { saveState, loadState, resetAll };
