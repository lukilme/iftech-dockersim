export function clearTerminal() {
  const out = document.getElementById('terminal-output');
  if (out) out.innerHTML = '';
}

export function appendLine(text) {
  const out = document.getElementById('terminal-output');
  if (!out) return;
  const div = document.createElement('div');
  div.textContent = text;
  out.appendChild(div);
  out.scrollTop = out.scrollHeight;
}

function handleCommand(cmd) {
  appendLine('Comando simulado: ' + cmd);
}

export function initTerminal() {
  const input = document.getElementById('terminal-input');
  if (!input) return;
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const v = input.value.trim();
      if (!v) return;
      appendLine('$ ' + v);
      handleCommand(v);
      input.value = '';
    }
  });
}

export default { clearTerminal, appendLine, initTerminal };
