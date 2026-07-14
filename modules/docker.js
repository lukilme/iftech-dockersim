import { notify } from './ui.js';

export function buildDockerfile() {
  const name = document.getElementById('df-image-name')?.value || 'minha-app';
  const tag = document.getElementById('df-image-tag')?.value || 'latest';
  const df = document.getElementById('dockerfile-editor')?.value || '';
  notify(`Construindo imagem ${name}:${tag} (simulado)`);
  console.log('Dockerfile (simulado):', { name, tag, df });
}

export function composeUp() {
  notify('docker compose up (simulado)');
  console.log('compose up (simulado)');
}

export function composeDown() {
  notify('docker compose down (simulado)');
  console.log('compose down (simulado)');
}

export default { buildDockerfile, composeUp, composeDown };
