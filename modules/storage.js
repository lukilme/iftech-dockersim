import { notify } from './ui.js';

export function saveState() {
  const state = {
    savedAt: Date.now(),
  };
  try {
    localStorage.setItem('dockersim:state', JSON.stringify(state));
    notify('Sessão salva');
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
    notify('Sessão carregada');
    return data;
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
