import { toggleTheme, switchView, switchEditorTab, closeModal } from './modules/ui.js';
import { clearTerminal, initTerminal } from './modules/terminal.js';
import { buildDockerfile, composeUp, composeDown } from './modules/docker.js';
import { saveState, loadState, resetAll } from './modules/storage.js';

// Expose functions to global scope so existing inline handlers keep working
window.toggleTheme = toggleTheme;
window.switchView = switchView;
window.switchEditorTab = switchEditorTab;
window.closeModal = closeModal;
window.clearTerminal = clearTerminal;
window.buildDockerfile = buildDockerfile;
window.composeUp = composeUp;
window.composeDown = composeDown;
window.saveState = saveState;
window.resetAll = resetAll;

// Initialize interactive parts
document.addEventListener('DOMContentLoaded', () => {
  initTerminal();
  // try to load previous state (no-op if none)
  try { loadState(); } catch (err) { console.warn(err); }
});

export {
  toggleTheme,
  switchView,
  switchEditorTab,
  closeModal,
  clearTerminal,
  buildDockerfile,
  composeUp,
  composeDown,
  saveState,
  loadState,
  resetAll,
};

export default null;
// ============================================================
// ESTADO GLOBAL
// ============================================================
const STATE = {
  containers: [],
  images: [],
  networks: [
    { id: genId(), name: 'bridge', driver: 'bridge', subnet: '172.17.0.0/16', internal: true },
    { id: genId(), name: 'host', driver: 'host', subnet: 'host', internal: true },
    { id: genId(), name: 'none', driver: 'null', subnet: 'none', internal: true }
  ],
  volumes: [],
  cmdHistory: [],
  historyIdx: -1,
  currentChallenge: 0,
  composedContainers: [],
  usedPorts: new Set(),
  cpuAnimInterval: null
};

// Imagens conhecidas simuladas
const KNOWN_IMAGES = {
  'nginx': { size: '142MB', tag: 'latest', layers: 7 },
  'nginx:latest': { size: '142MB', tag: 'latest', layers: 7 },
  'nginx:alpine': { size: '23MB', tag: 'alpine', layers: 4 },
  'mysql': { size: '544MB', tag: 'latest', layers: 12 },
  'mysql:latest': { size: '544MB', tag: 'latest', layers: 12 },
  'mysql:8.0': { size: '533MB', tag: '8.0', layers: 11 },
  'postgres': { size: '379MB', tag: 'latest', layers: 9 },
  'postgres:latest': { size: '379MB', tag: 'latest', layers: 9 },
  'redis': { size: '117MB', tag: 'latest', layers: 6 },
  'redis:alpine': { size: '28MB', tag: 'alpine', layers: 5 },
  'alpine': { size: '7.33MB', tag: 'latest', layers: 1 },
  'ubuntu': { size: '77.9MB', tag: 'latest', layers: 3 },
  'ubuntu:22.04': { size: '77.9MB', tag: '22.04', layers: 3 },
  'node': { size: '994MB', tag: 'latest', layers: 10 },
  'node:18': { size: '992MB', tag: '18', layers: 10 },
  'node:alpine': { size: '175MB', tag: 'alpine', layers: 7 },
  'python': { size: '1.01GB', tag: 'latest', layers: 9 },
  'python:3.11': { size: '1.01GB', tag: '3.11', layers: 9 },
  'python:alpine': { size: '52MB', tag: 'alpine', layers: 6 },
  'mongo': { size: '698MB', tag: 'latest', layers: 11 },
  'httpd': { size: '168MB', tag: 'latest', layers: 8 },
  'debian': { size: '124MB', tag: 'latest', layers: 2 },
  'busybox': { size: '4.86MB', tag: 'latest', layers: 1 },
  'hello-world': { size: '13.3kB', tag: 'latest', layers: 1 },
  'traefik': { size: '157MB', tag: 'latest', layers: 5 },
  'wordpress': { size: '615MB', tag: 'latest', layers: 14 },
};

// Logs simulados por imagem
const SIMULATED_LOGS = {
  nginx: [
    '2024/01/15 10:00:01 [notice] 1#1: using the "epoll" event method',
    '2024/01/15 10:00:01 [notice] 1#1: nginx/1.25.3',
    '2024/01/15 10:00:01 [notice] 1#1: start worker processes',
    '172.17.0.1 - - [15/Jan/2024:10:00:05 +0000] "GET / HTTP/1.1" 200 615 "-" "Mozilla/5.0"',
    '172.17.0.1 - - [15/Jan/2024:10:00:12 +0000] "GET /favicon.ico HTTP/1.1" 404 555'
  ],
  mysql: [
    '2024-01-15T10:00:01.234Z 0 [System] [MY-010931] [Server] /usr/sbin/mysqld: ready for connections.',
    '2024-01-15T10:00:01.235Z 0 [System] [MY-011323] [Server] X Plugin ready for connections.',
    '2024-01-15T10:00:05.001Z 8 [Note] [MY-010454] [Repl] New primary detected with server id 1',
    'mbind: Operation not permitted'
  ],
  postgres: [
    '2024-01-15 10:00:01.234 UTC [1] LOG:  starting PostgreSQL 16.1 on x86_64-pc-linux-gnu',
    '2024-01-15 10:00:01.235 UTC [1] LOG:  listening on IPv4 address "0.0.0.0", port 5432',
    '2024-01-15 10:00:01.890 UTC [1] LOG:  database system is ready to accept connections'
  ],
  redis: [
    '1:C 15 Jan 2024 10:00:01.234 # oO0OoO0OoO0Oo Redis is starting oO0OoO0OoO0Oo',
    '1:C 15 Jan 2024 10:00:01.234 # Redis version=7.2.3, bits=64',
    '1:C 15 Jan 2024 10:00:01.235 * monotonic clock: POSIX clock_gettime',
    '1:M 15 Jan 2024 10:00:01.236 * Ready to accept connections tcp'
  ],
  default: [
    'Container iniciado com sucesso.',
    'Serviço pronto para receber conexões.',
    'Aguardando requisições...'
  ]
};

// Exec outputs simulados
const EXEC_OUTPUTS = {
  'bash': '# Prompt bash simulado (ambiente isolado)\nroot@container:/app#',
  'sh': '/ #',
  'ls': 'app  bin  dev  etc  home  lib  media  mnt  opt  proc  root  run  sbin  srv  sys  tmp  usr  var',
  'pwd': '/app',
  'whoami': 'root',
  'cat /etc/os-release': 'NAME="Ubuntu"\nVERSION="22.04.3 LTS (Jammy Jellyfish)"\nID=ubuntu',
  'ps aux': 'USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND\nroot         1  0.0  0.1   4236  3456 ?        Ss   10:00   0:00 sh\nroot        12  0.0  0.0   4236  1024 pts/0    R+   10:05   0:00 ps aux',
  'df -h': 'Filesystem      Size  Used Avail Use% Mounted on\noverlay         100G   15G   85G  15% /\ntmpfs            64M     0   64M   0% /dev\n/dev/sda1       100G   15G   85G  15% /etc/hosts',
  'env': 'PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin\nHOME=/root\nTERM=xterm',
  'hostname': 'container-sim',
  'uname -a': 'Linux container-sim 5.15.0-1041-aws #46-Ubuntu SMP Mon Aug 28 18:04:46 UTC 2023 x86_64 x86_64 x86_64 GNU/Linux',
  'date': new Date().toUTCString(),
  'ifconfig': 'eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500\n  inet 172.17.0.2  netmask 255.255.0.0  broadcast 172.17.255.255\n  ether 02:42:ac:11:00:02  txqueuelen 0  (Ethernet)',
  'curl localhost': '<!DOCTYPE html><html><body><h1>Welcome to nginx!</h1></body></html>',
  'mysql -u root -p': 'Enter password: \nWelcome to the MySQL monitor.\nmysql>',
  'redis-cli ping': 'PONG',
  'python3 --version': 'Python 3.11.6',
  'node --version': 'v18.19.0',
  'npm --version': '10.2.3',
};

// ============================================================
// UTILS
// ============================================================
function genId(len = 12) {
  const chars = '0123456789abcdef';
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function shortId(id) { return id.slice(0, 12); }

function randomName() {
  const adj = ['elegant', 'bold', 'swift', 'bright', 'gentle', 'happy', 'zealous', 'jolly', 'stoic', 'brave'];
  const nouns = ['newton', 'darwin', 'curie', 'turing', 'tesla', 'lovelace', 'euler', 'gauss', 'bohr', 'feynman'];
  return adj[Math.floor(Math.random() * adj.length)] + '_' + nouns[Math.floor(Math.random() * nouns.length)];
}

function parseImage(rawImage) {
  if (!rawImage) return null;
  const parts = rawImage.split(':');
  return { name: parts[0], tag: parts[1] || 'latest', full: rawImage.includes(':') ? rawImage : rawImage + ':latest' };
}

function findContainer(nameOrId) {
  return STATE.containers.find(c =>
    c.name === nameOrId ||
    c.id === nameOrId ||
    c.id.startsWith(nameOrId) ||
    shortId(c.id) === nameOrId
  );
}

function findImage(nameOrId) {
  return STATE.images.find(img =>
    img.name === nameOrId ||
    img.full === nameOrId ||
    img.id === nameOrId ||
    img.id.startsWith(nameOrId) ||
    (nameOrId.includes(':') ? img.full === nameOrId : img.name === nameOrId)
  );
}

function findNetwork(nameOrId) {
  return STATE.networks.find(n => n.name === nameOrId || n.id === nameOrId || n.id.startsWith(nameOrId));
}

function findVolume(name) {
  return STATE.volumes.find(v => v.name === name);
}

function getCpuPct() { return Math.floor(Math.random() * 30) + 1; }

// ============================================================
// TERMINAL OUTPUT
// ============================================================
const out = document.getElementById('terminal-output');

function termLine(text, cls = 'term-output') {
  if (!text && text !== '') return;
  const lines = String(text).split('\n');
  lines.forEach(line => {
    const div = document.createElement('div');
    div.className = `term-line ${cls}`;
    div.textContent = line;
    out.appendChild(div);
  });
  out.scrollTop = out.scrollHeight;
}

function termPromptLine(cmd) {
  const div = document.createElement('div');
  div.className = 'term-line';
  div.innerHTML = `<span class="term-prompt">estudante@docker:~$</span> <span class="term-cmd">${escHtml(cmd)}</span>`;
  out.appendChild(div);
  out.scrollTop = out.scrollHeight;
}

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ============================================================
// COMMAND PARSER
// ============================================================
function parseArgs(input) {
  const tokens = [];
  let current = '';
  let inSingle = false, inDouble = false;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (ch === "'" && !inDouble) { inSingle = !inSingle; continue; }
    if (ch === '"' && !inSingle) { inDouble = !inDouble; continue; }
    if (ch === ' ' && !inSingle && !inDouble) {
      if (current) tokens.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  if (current) tokens.push(current);
  return tokens;
}

function extractFlags(tokens) {
  const flags = {};
  const positional = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.startsWith('--')) {
      const eq = t.indexOf('=');
      if (eq !== -1) {
        flags[t.slice(2, eq)] = t.slice(eq + 1);
      } else {
        const next = tokens[i + 1];
        if (next && !next.startsWith('-')) {
          flags[t.slice(2)] = next;
          i++;
        } else {
          flags[t.slice(2)] = true;
        }
      }
    } else if (t.startsWith('-') && t.length === 2) {
      const next = tokens[i + 1];
      if (['-p','-v','-e','--name','--network','-m','--cpus','-u'].includes(t) || next && !next.startsWith('-')) {
        if (next && !next.startsWith('-')) { flags[t.slice(1)] = next; i++; }
        else { flags[t.slice(1)] = true; }
      } else {
        flags[t.slice(1)] = true;
      }
    } else if (t.startsWith('-') && t.length > 2 && !t.startsWith('--')) {
      // Combined flags like -it, -di
      t.slice(1).split('').forEach(f => flags[f] = true);
    } else {
      positional.push(t);
    }
  }
  return { flags, positional };
}

// ============================================================
// DOCKER COMMANDS
// ============================================================

function cmdPull(args) {
  if (!args.length) { termLine('Uso: docker pull <imagem>', 'term-error'); return; }
  const raw = args[0];
  const img = parseImage(raw);
  const key = img.full;
  const knownKey = Object.keys(KNOWN_IMAGES).find(k => k === raw || k === img.name || k === img.full);

  if (findImage(raw) || findImage(img.name)) {
    termLine(`${img.full}: Imagem já existe no cache local.`, 'term-warn');
    return;
  }

  termLine(`Pulling from library/${img.name}`, 'term-info');
  const meta = knownKey ? KNOWN_IMAGES[knownKey] : { size: `${Math.floor(Math.random()*500)+50}MB`, tag: img.tag, layers: Math.floor(Math.random()*10)+3 };
  const layerCount = meta.layers || 5;

  let delay = 0;
  for (let i = 0; i < layerCount; i++) {
    const layerId = genId(12);
    setTimeout(() => {
      termLine(`${layerId.slice(0,12)}: Pull complete`, 'term-dim');
    }, delay);
    delay += 120 + Math.random() * 80;
  }

  setTimeout(() => {
    termLine(`Digest: sha256:${genId(64)}`, 'term-dim');
    termLine(`Status: Downloaded newer image for ${img.name}:${img.tag}`, 'term-success');
    termLine(`docker.io/library/${img.name}:${img.tag}`, 'term-dim');

    STATE.images.push({
      id: genId(12),
      name: img.name,
      tag: img.tag,
      full: `${img.name}:${img.tag}`,
      size: meta.size,
      layers: meta.layers || 5,
      created: new Date().toISOString()
    });
    refreshUI();
  }, delay + 200);
}

function cmdImages() {
  if (!STATE.images.length) {
    termLine('REPOSITORY   TAG       IMAGE ID   CREATED   SIZE', 'term-bold');
    termLine('(nenhuma imagem local)', 'term-dim');
    return;
  }
  termLine('REPOSITORY          TAG       IMAGE ID       CREATED          SIZE', 'term-bold');
  STATE.images.forEach(img => {
    const repo = img.name.padEnd(20);
    const tag = img.tag.padEnd(10);
    const id = shortId(img.id).padEnd(15);
    const created = 'Há pouco       '.padEnd(17);
    termLine(`${repo}${tag}${id}${created}${img.size}`);
  });
}

function cmdRun(args) {
  if (!args.length) { termLine('Uso: docker run [opções] <imagem> [comando]', 'term-error'); return; }

  const { flags, positional } = extractFlags(args);

  // Collect all -p, -v, -e (multiple instances)
  const allPorts = [];
  const allVolumes = [];
  const allEnv = [];

  // Re-scan raw args for multiple -p/-v/-e
  for (let i = 0; i < args.length; i++) {
    if ((args[i] === '-p' || args[i] === '--publish') && args[i+1]) { allPorts.push(args[++i]); }
    else if ((args[i] === '-v' || args[i] === '--volume') && args[i+1]) { allVolumes.push(args[++i]); }
    else if ((args[i] === '-e' || args[i] === '--env') && args[i+1]) { allEnv.push(args[++i]); }
  }

  const imageName = positional[0];
  if (!imageName) { termLine('Erro: nome da imagem é obrigatório', 'term-error'); return; }

  const img = parseImage(imageName);

  // Auto-pull if not in local images
  let localImg = findImage(imageName) || findImage(img.name);
  if (!localImg) {
    const knownKey = Object.keys(KNOWN_IMAGES).find(k => k === imageName || k === img.name || k === img.full);
    if (!knownKey) {
      termLine(`Unable to find image '${imageName}' locally`, 'term-output');
      termLine(`Error response from daemon: pull access denied for ${img.name}, repository does not exist or may require 'docker login'`, 'term-error');
      return;
    }
    termLine(`Unable to find image '${imageName}' locally`, 'term-output');
    const meta = KNOWN_IMAGES[knownKey];
    STATE.images.push({
      id: genId(12), name: img.name, tag: img.tag,
      full: `${img.name}:${img.tag}`, size: meta.size, layers: meta.layers || 5,
      created: new Date().toISOString()
    });
    localImg = STATE.images[STATE.images.length - 1];
    termLine(`${img.tag}: Pulling from library/${img.name}`, 'term-info');
    termLine(`Digest: sha256:${genId(64)}`, 'term-dim');
    termLine(`Status: Downloaded newer image for ${img.name}:${img.tag}`, 'term-success');
  }

  // Check name conflict
  const cName = flags['name'] || flags['n'] || randomName();
  if (findContainer(cName)) {
    termLine(`Error response from daemon: Conflict. The container name "/${cName}" is already in use. Use "docker rm" to remove it.`, 'term-error');
    return;
  }

  // Check port conflicts
  for (const p of allPorts) {
    const hostPort = p.split(':')[0];
    if (STATE.usedPorts.has(hostPort)) {
      termLine(`Error response from daemon: driver failed programming external connectivity on endpoint ${cName}: Bind for 0.0.0.0:${hostPort} failed: port is already allocated`, 'term-error');
      return;
    }
  }

  // Determine network
  const netName = flags['network'] || 'bridge';
  let net = findNetwork(netName);
  if (!net) {
    termLine(`Error response from daemon: network ${netName} not found`, 'term-error');
    return;
  }

  // Register ports
  allPorts.forEach(p => { const hp = p.split(':')[0]; STATE.usedPorts.add(hp); });

  // Process volumes
  allVolumes.forEach(v => {
    const vName = v.split(':')[0];
    if (!vName.startsWith('/') && !findVolume(vName)) {
      STATE.volumes.push({ name: vName, path: `/var/lib/docker/volumes/${vName}/_data`, created: new Date().toISOString() });
    }
  });

  const id = genId(64);
  const container = {
    id, name: cName,
    image: localImg.full,
    imageName: img.name,
    status: 'running',
    ports: allPorts,
    network: netName,
    volumes: allVolumes,
    env: allEnv,
    cpu: getCpuPct(),
    created: new Date().toISOString(),
    detached: !!(flags['d'] || flags['detach']),
    logs: generateLogs(img.name)
  };

  STATE.containers.push(container);

  if (container.detached) {
    termLine(id, 'term-success');
  } else {
    const logsToShow = SIMULATED_LOGS[img.name] || SIMULATED_LOGS.default;
    logsToShow.forEach(l => termLine(l, 'term-output'));
  }

  refreshUI();
  checkChallenges();
}

function cmdPs(showAll) {
  const list = showAll ? STATE.containers : STATE.containers.filter(c => c.status === 'running');
  termLine('CONTAINER ID   IMAGE           COMMAND   CREATED       STATUS         PORTS                   NAMES', 'term-bold');
  if (!list.length) {
    termLine('(nenhum container)', 'term-dim');
    return;
  }
  list.forEach(c => {
    const sid = shortId(c.id).padEnd(15);
    const img = c.image.padEnd(16);
    const cmd = '"entrypoint"  '.padEnd(10);
    const created = 'Há pouco   '.padEnd(14);
    const status = (c.status === 'running' ? `Up ${Math.floor(Math.random()*60)+1} seconds` : 'Exited (0) 1 second ago').padEnd(23);
    const ports = (c.ports.join(', ')).padEnd(24);
    termLine(`${sid}${img}${cmd}${created}${status}${ports}${c.name}`);
  });
}

function cmdStop(args) {
  if (!args.length) { termLine('Uso: docker stop <id|nome>', 'term-error'); return; }
  const c = findContainer(args[0]);
  if (!c) { termLine(`Error: No such container: ${args[0]}`, 'term-error'); return; }
  if (c.status !== 'running') { termLine(`Container ${args[0]} is already stopped`, 'term-warn'); return; }
  c.status = 'exited';
  c.ports.forEach(p => STATE.usedPorts.delete(p.split(':')[0]));
  termLine(shortId(c.id), 'term-success');
  refreshUI();
  checkChallenges();
}

function cmdStart(args) {
  if (!args.length) { termLine('Uso: docker start <id|nome>', 'term-error'); return; }
  const c = findContainer(args[0]);
  if (!c) { termLine(`Error: No such container: ${args[0]}`, 'term-error'); return; }
  if (c.status === 'running') { termLine(`Container ${args[0]} is already running`, 'term-warn'); return; }
  c.status = 'running';
  c.ports.forEach(p => STATE.usedPorts.add(p.split(':')[0]));
  termLine(shortId(c.id), 'term-success');
  refreshUI();
  checkChallenges();
}

function cmdRm(args) {
  if (!args.length) { termLine('Uso: docker rm <id|nome>', 'term-error'); return; }
  const force = args.includes('-f') || args.includes('--force');
  const nameOrId = args.find(a => !a.startsWith('-'));
  const c = findContainer(nameOrId);
  if (!c) { termLine(`Error: No such container: ${nameOrId}`, 'term-error'); return; }
  if (c.status === 'running' && !force) {
    termLine(`Error response from daemon: You cannot remove a running container ${shortId(c.id)}. Stop the container before attempting removal or force remove`, 'term-error');
    return;
  }
  if (c.status === 'running') { c.ports.forEach(p => STATE.usedPorts.delete(p.split(':')[0])); }
  STATE.containers.splice(STATE.containers.indexOf(c), 1);
  termLine(nameOrId, 'term-success');
  refreshUI();
  checkChallenges();
}

function cmdRmi(args) {
  if (!args.length) { termLine('Uso: docker rmi <imagem>', 'term-error'); return; }
  const img = findImage(args[0]) || STATE.images.find(i => i.name === args[0]);
  if (!img) { termLine(`Error: No such image: ${args[0]}`, 'term-error'); return; }
  const inUse = STATE.containers.some(c => c.image === img.full || c.imageName === img.name);
  if (inUse) {
    termLine(`Error response from daemon: conflict: unable to remove repository reference "${img.full}" (must force) - container is using this image`, 'term-error');
    return;
  }
  STATE.images.splice(STATE.images.indexOf(img), 1);
  termLine(`Untagged: ${img.full}`, 'term-output');
  termLine(`Deleted: sha256:${genId(64)}`, 'term-output');
  refreshUI();
}

function cmdLogs(args) {
  if (!args.length) { termLine('Uso: docker logs <id|nome>', 'term-error'); return; }
  const c = findContainer(args[0]);
  if (!c) { termLine(`Error: No such container: ${args[0]}`, 'term-error'); return; }
  const logs = c.logs || generateLogs(c.imageName);
  logs.forEach(l => termLine(l, 'term-dim'));
}

function cmdExec(args) {
  if (args.length < 2) { termLine('Uso: docker exec <container> <comando>', 'term-error'); return; }
  const nameOrId = args[0];
  const c = findContainer(nameOrId);
  if (!c) { termLine(`Error: No such container: ${nameOrId}`, 'term-error'); return; }
  if (c.status !== 'running') { termLine(`Error response from daemon: Container ${nameOrId} is not running`, 'term-error'); return; }
  const cmd = args.slice(1).join(' ').replace(/^-it?\s+|^-ti?\s+/, '');
  const output = EXEC_OUTPUTS[cmd] || EXEC_OUTPUTS[cmd.split(' ')[0]] || `${cmd}: command executed (output simulado)`;
  termLine(output, 'exec-output');
}

function cmdNetworkCreate(args) {
  if (!args.length) { termLine('Uso: docker network create <nome>', 'term-error'); return; }
  const name = args[args.length - 1];
  if (findNetwork(name)) { termLine(`Error response from daemon: network with name ${name} already exists`, 'term-error'); return; }
  const idx = STATE.networks.length;
  const subnet = `172.${18 + idx}.0.0/16`;
  const id = genId(64);
  STATE.networks.push({ id, name, driver: 'bridge', subnet, internal: false });
  termLine(id, 'term-success');
  refreshUI();
  checkChallenges();
}

function cmdNetworkLs() {
  termLine('NETWORK ID     NAME      DRIVER    SCOPE', 'term-bold');
  STATE.networks.forEach(n => {
    termLine(`${shortId(n.id).padEnd(15)}${n.name.padEnd(10)}${n.driver.padEnd(10)}local`);
  });
}

function cmdNetworkRm(args) {
  if (!args.length) { termLine('Uso: docker network rm <nome>', 'term-error'); return; }
  const n = findNetwork(args[0]);
  if (!n) { termLine(`Error: No such network: ${args[0]}`, 'term-error'); return; }
  if (n.internal) { termLine(`Error response from daemon: ${n.name} is a pre-defined network and cannot be removed`, 'term-error'); return; }
  const inUse = STATE.containers.some(c => c.network === n.name && c.status === 'running');
  if (inUse) { termLine(`Error response from daemon: error while removing network: network ${n.name} id ${shortId(n.id)} has active endpoints`, 'term-error'); return; }
  STATE.networks.splice(STATE.networks.indexOf(n), 1);
  termLine(n.name, 'term-success');
  refreshUI();
}

function cmdVolumeCreate(args) {
  const name = args[0] || genId(20);
  if (findVolume(name)) { termLine(`volume already exists: ${name}`, 'term-warn'); return; }
  STATE.volumes.push({ name, path: `/var/lib/docker/volumes/${name}/_data`, created: new Date().toISOString() });
  termLine(name, 'term-success');
  refreshUI();
}

function cmdVolumeLs() {
  termLine('DRIVER    VOLUME NAME', 'term-bold');
  STATE.volumes.forEach(v => termLine(`local     ${v.name}`));
}

function cmdVolumeRm(args) {
  if (!args.length) { termLine('Uso: docker volume rm <nome>', 'term-error'); return; }
  const v = findVolume(args[0]);
  if (!v) { termLine(`Error: No such volume: ${args[0]}`, 'term-error'); return; }
  const inUse = STATE.containers.some(c => c.volumes.some(vol => vol.split(':')[0] === v.name));
  if (inUse) { termLine(`Error response from daemon: volume is in use - [${args[0]}]`, 'term-error'); return; }
  STATE.volumes.splice(STATE.volumes.indexOf(v), 1);
  termLine(v.name, 'term-success');
  refreshUI();
}

function cmdComposeUp() {
  const yaml = document.getElementById('compose-editor').value;
  const services = parseSimpleYaml(yaml);
  if (!services.length) { termLine('Erro ao parsear docker-compose.yml', 'term-error'); return; }

  termLine('Creating network(s)...', 'term-info');
  // Extract networks from yaml
  const netMatch = yaml.match(/^networks:\s*\n((?:\s+\w[\w-]*:\s*\n(?:\s+.*\n)*)*)/m);
  if (netMatch) {
    const netLines = netMatch[1].split('\n');
    netLines.forEach(l => {
      const m = l.match(/^\s{2}(\w[\w-]*):/);
      if (m && !findNetwork(m[1])) {
        const id = genId(64);
        STATE.networks.push({ id, name: m[1], driver: 'bridge', subnet: `172.${19+STATE.networks.length}.0.0/16`, internal: false });
        termLine(`Network ${m[1]} created`, 'term-success');
      }
    });
  }

  let delay = 0;
  services.forEach(svc => {
    setTimeout(() => {
      termLine(`Creating ${svc.name} ... done`, 'term-success');
      const img = parseImage(svc.image);
      let localImg = findImage(svc.image) || findImage(img.name);
      if (!localImg) {
        const knownKey = Object.keys(KNOWN_IMAGES).find(k => k === svc.image || k === img.name);
        const meta = knownKey ? KNOWN_IMAGES[knownKey] : { size: '100MB', tag: img.tag, layers: 5 };
        STATE.images.push({ id: genId(12), name: img.name, tag: img.tag, full: `${img.name}:${img.tag}`, size: meta.size, layers: meta.layers, created: new Date().toISOString() });
        localImg = STATE.images[STATE.images.length - 1];
      }
      if (!findContainer(svc.name)) {
        const cId = genId(64);
        STATE.containers.push({
          id: cId, name: svc.name, image: localImg.full, imageName: img.name,
          status: 'running', ports: svc.ports || [], network: svc.network || 'bridge',
          volumes: svc.volumes || [], env: svc.env || [],
          cpu: getCpuPct(), created: new Date().toISOString(), detached: true,
          logs: generateLogs(img.name), composeService: true
        });
        svc.ports.forEach(p => STATE.usedPorts.add(p.split(':')[0]));
        STATE.composedContainers.push(svc.name);
      }
      refreshUI();
    }, delay);
    delay += 400;
  });

  setTimeout(() => {
    termLine('', '');
    termLine('Starting services...', 'term-info');
    services.forEach(s => {
      termLine(`  ${s.name}: Started`, 'term-success');
    });
    checkChallenges();
  }, delay + 200);
}

function cmdComposeDown() {
  if (!STATE.composedContainers.length) { termLine('No compose services running.', 'term-warn'); return; }
  STATE.composedContainers.forEach(name => {
    const c = findContainer(name);
    if (c) {
      c.ports.forEach(p => STATE.usedPorts.delete(p.split(':')[0]));
      STATE.containers.splice(STATE.containers.indexOf(c), 1);
      termLine(`Stopping ${name} ... done`, 'term-output');
      termLine(`Removing ${name} ... done`, 'term-output');
    }
  });
  STATE.composedContainers = [];
  refreshUI();
}

function cmdPrune() {
  const stopped = STATE.containers.filter(c => c.status === 'exited');
  const unusedImgs = STATE.images.filter(img => !STATE.containers.some(c => c.imageName === img.name || c.image === img.full));
  stopped.forEach(c => STATE.containers.splice(STATE.containers.indexOf(c), 1));
  unusedImgs.forEach(img => STATE.images.splice(STATE.images.indexOf(img), 1));
  termLine(`Removed ${stopped.length} stopped container(s)`, 'term-success');
  termLine(`Removed ${unusedImgs.length} unused image(s)`, 'term-success');
  termLine(`Total reclaimed space: ${Math.floor(Math.random()*2000)}MB`, 'term-info');
  refreshUI();
}

function parseSimpleYaml(yaml) {
  const services = [];
  const lines = yaml.split('\n');
  let inServices = false, currentService = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const indent = line.match(/^(\s*)/)[1].length;

    if (line.trim() === 'services:') { inServices = true; continue; }
    if (inServices && /^[a-z]/.test(line.trim()) && line.trim() !== 'services:' && !line.trim().startsWith('-')) {
      // Top-level key that's not services
      if (line.trim() === 'networks:' || line.trim() === 'volumes:') { inServices = false; continue; }
    }
    if (inServices && indent === 2 && line.trim().endsWith(':')) {
      if (currentService) services.push(currentService);
      currentService = { name: line.trim().replace(':', ''), image: '', ports: [], volumes: [], env: [], network: 'bridge' };
    } else if (inServices && currentService && indent >= 4) {
      const t = line.trim();
      if (t.startsWith('image:')) currentService.image = t.replace('image:', '').trim();
      if (t.startsWith('- ') && lines[i-1] && lines[i-1].trim() === 'ports:') currentService.ports.push(t.replace('- ', '').replace(/"/g,'').trim());
      if (t.startsWith('- ') && lines[i-1] && lines[i-1].trim() === 'volumes:') currentService.volumes.push(t.replace('- ', '').trim());
      if (t.startsWith('- ') && lines[i-1] && lines[i-1].trim() === 'environment:') currentService.env.push(t.replace('- ', '').trim());
      if (t.startsWith('networks:')) {
        const nextLine = lines[i+1];
        if (nextLine && nextLine.trim().startsWith('-')) currentService.network = lines[i+1].trim().replace('- ', '');
      }
    }
  }
  if (currentService) services.push(currentService);

  // Second pass for ports/volumes/env
  let cur = null, mode = null;
  for (const line of lines) {
    const indent = line.match(/^(\s*)/)[1].length;
    const t = line.trim();
    if (t === 'services:') continue;
    if (indent === 2 && t.endsWith(':') && !['ports:','volumes:','environment:','networks:','depends_on:'].includes(t)) {
      cur = services.find(s => s.name === t.replace(':',''));
      mode = null;
    }
    if (cur) {
      if (t === 'ports:') mode = 'ports';
      else if (t === 'volumes:') mode = 'volumes';
      else if (t === 'environment:') mode = 'env';
      else if (t === 'networks:') mode = 'networks';
      else if (t.startsWith('- ') && mode) {
        const val = t.replace('- ', '').replace(/"/g,'').trim();
        if (mode === 'ports' && !cur.ports.includes(val)) cur.ports.push(val);
        if (mode === 'volumes' && !cur.volumes.includes(val)) cur.volumes.push(val);
        if (mode === 'env' && !cur.env.includes(val)) cur.env.push(val);
        if (mode === 'networks') cur.network = val;
      } else if (!t.startsWith('-') && t !== '' && indent >= 4) {
        if (t.startsWith('image:')) cur.image = t.replace('image:', '').trim();
        mode = null;
      }
    }
  }
  return services.filter(s => s.image);
}

function generateLogs(imageName) {
  const base = SIMULATED_LOGS[imageName] || SIMULATED_LOGS.default;
  const extra = [
    `[INFO] Container ${genId(8)} iniciado`,
    `[INFO] Porta exposta e serviço disponível`,
    `[DEBUG] Carregando configurações...`,
    `[INFO] Health check OK`,
  ];
  return [...base, ...extra.slice(0, 2)];
}

function showHelp() {
  termLine('');
  termLine('DockerSim — Comandos disponíveis:', 'term-info');
  termLine('─'.repeat(60), 'term-dim');
  termLine('  docker pull <imagem>              Baixar imagem', 'term-output');
  termLine('  docker images                     Listar imagens', 'term-output');
  termLine('  docker rmi <imagem>               Remover imagem', 'term-output');
  termLine('  docker run [opts] <imagem>        Criar e iniciar container', 'term-output');
  termLine('    -d                              Modo detached (background)', 'term-dim');
  termLine('    -p host:container               Mapear porta', 'term-dim');
  termLine('    --name <nome>                   Nomear container', 'term-dim');
  termLine('    -v vol:/caminho                 Montar volume', 'term-dim');
  termLine('    -e VAR=valor                    Variável de ambiente', 'term-dim');
  termLine('    --network <rede>                Conectar à rede', 'term-dim');
  termLine('  docker ps [-a]                    Listar containers', 'term-output');
  termLine('  docker stop/start/rm <id|nome>    Gerenciar container', 'term-output');
  termLine('  docker logs <id|nome>             Ver logs', 'term-output');
  termLine('  docker exec <id|nome> <cmd>       Executar comando', 'term-output');
  termLine('  docker network create/ls/rm       Gerenciar redes', 'term-output');
  termLine('  docker volume create/ls/rm        Gerenciar volumes', 'term-output');
  termLine('  docker compose up/down            Docker Compose', 'term-output');
  termLine('  docker system prune               Remover recursos ociosos', 'term-output');
  termLine('  clear                             Limpar terminal', 'term-output');
  termLine('─'.repeat(60), 'term-dim');
  termLine('');
}

// ============================================================
// COMMAND DISPATCH
// ============================================================
function executeCommand(raw) {
  const input = raw.trim();
  if (!input) return;

  STATE.cmdHistory.unshift(input);
  STATE.historyIdx = -1;

  termPromptLine(input);

  const tokens = parseArgs(input);
  if (!tokens.length) return;

  const main = tokens[0].toLowerCase();
  const sub = tokens[1] ? tokens[1].toLowerCase() : '';
  const rest = tokens.slice(2);

  if (main === 'clear') { clearTerminal(); return; }
  if (main === 'help' || main === '--help' || (main === 'docker' && sub === '--help')) { showHelp(); return; }

  if (main !== 'docker') {
    // Try EXEC_OUTPUTS for non-docker commands
    const execOut = EXEC_OUTPUTS[input] || EXEC_OUTPUTS[main];
    if (execOut) { termLine(execOut, 'exec-output'); return; }
    termLine(`${main}: command not found`, 'term-error');
    termLine('Dica: Este é um simulador Docker. Use comandos "docker ..." ou "help"', 'term-dim');
    return;
  }

  switch (sub) {
    case 'pull': cmdPull(rest); break;
    case 'images': cmdImages(); break;
    case 'rmi': cmdRmi(rest); break;
    case 'run': cmdRun(rest); break;
    case 'ps': cmdPs(rest.includes('-a') || rest.includes('--all')); break;
    case 'stop': cmdStop(rest); break;
    case 'start': cmdStart(rest); break;
    case 'rm': cmdRm(rest); break;
    case 'logs': cmdLogs(rest); break;
    case 'exec': cmdExec(rest); break;
    case 'network':
      const ncmd = tokens[2] ? tokens[2].toLowerCase() : '';
      if (ncmd === 'create') cmdNetworkCreate(tokens.slice(3));
      else if (ncmd === 'ls' || ncmd === 'list') cmdNetworkLs();
      else if (ncmd === 'rm' || ncmd === 'remove') cmdNetworkRm(tokens.slice(3));
      else if (ncmd === 'inspect') termLine('(inspect simulado — use docker network ls)', 'term-dim');
      else termLine(`Uso: docker network [create|ls|rm] ...`, 'term-error');
      break;
    case 'volume':
      const vcmd = tokens[2] ? tokens[2].toLowerCase() : '';
      if (vcmd === 'create') cmdVolumeCreate(tokens.slice(3));
      else if (vcmd === 'ls' || vcmd === 'list') cmdVolumeLs();
      else if (vcmd === 'rm' || vcmd === 'remove') cmdVolumeRm(tokens.slice(3));
      else termLine(`Uso: docker volume [create|ls|rm] ...`, 'term-error');
      break;
    case 'compose':
      const ccmd = tokens[2] ? tokens[2].toLowerCase() : '';
      if (ccmd === 'up') cmdComposeUp();
      else if (ccmd === 'down') cmdComposeDown();
      else termLine(`Uso: docker compose [up|down]`, 'term-error');
      break;
    case 'system':
      if (tokens[2] === 'prune') cmdPrune();
      else termLine('Uso: docker system prune', 'term-error');
      break;
    case 'version':
      termLine('Docker version 25.0.2, build 29cf629', 'term-output');
      termLine('(Simulador DockerSim v1.0)', 'term-dim');
      break;
    case 'info':
      termLine('Containers: ' + STATE.containers.length, 'term-output');
      termLine(' Running: ' + STATE.containers.filter(c=>c.status==='running').length, 'term-output');
      termLine(' Stopped: ' + STATE.containers.filter(c=>c.status==='exited').length, 'term-output');
      termLine('Images: ' + STATE.images.length, 'term-output');
      termLine('Server Version: 25.0.2 (simulado)', 'term-dim');
      break;
    default:
      termLine(`docker: '${sub}' is not a docker command.`, 'term-error');
      termLine("See 'docker --help' or type 'help'", 'term-dim');
  }
}

// ============================================================
// UI REFRESH
// ============================================================
function refreshUI() {
  refreshContainerGrid();
  refreshImageList();
  refreshNetworkMap();
  refreshVolumeList();
  refreshSidebar();
  refreshStats();
  updateChallengeUI();
  saveState();
}

function refreshStats() {
  const running = STATE.containers.filter(c => c.status === 'running').length;
  document.getElementById('stat-running').textContent = running;
  document.getElementById('stat-containers').textContent = STATE.containers.length;
  document.getElementById('stat-images').textContent = STATE.images.length;
  document.getElementById('stat-networks').textContent = STATE.networks.length;
}
function refreshContainerGrid() {
  const grid = document.getElementById('container-grid');
  if (!STATE.containers.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon"><i class="fas fa-cubes"></i></div>
        <div>Nenhum container. Tente: <code>docker run nginx</code></div>
      </div>`;
    return;
  }
  grid.innerHTML = STATE.containers.map(c => {
    const cpu = c.status === 'running' ? (c.cpu || getCpuPct()) : 0;
    const cpuCls = cpu > 70 ? 'critical' : cpu > 40 ? 'high' : '';
    const portsStr = c.ports.length ? `<i class="fas fa-plug"></i> ${c.ports.join(', ')}` : '';
    const envStr = c.env.length ? `<i class="fas fa-key"></i> ${c.env.slice(0,2).join(', ')}` : '';
    const volStr = c.volumes.length ? `<i class="fas fa-database"></i> ${c.volumes.slice(0,2).join(', ')}` : '';

    const stopStart = c.status === 'running'
      ? `<button class="cc-btn danger" onclick="uiStop('${c.name}')"><i class="fas fa-stop"></i> Stop</button>`
      : `<button class="cc-btn success" onclick="uiStart('${c.name}')"><i class="fas fa-play"></i> Start</button>`;

    return `
<div class="container-card ${c.status}" id="card-${c.id}">
  <div class="cc-header">
    <div>
      <div class="cc-name">${escHtml(c.name)}</div>
      <div class="cc-id">${shortId(c.id)}</div>
    </div>
    <div class="status-badge ${c.status}">
      <div class="status-dot"></div>${c.status === 'running' ? 'Up' : 'Exited'}
    </div>
  </div>
  <div class="cc-image"><i class="fas fa-image"></i> ${escHtml(c.image)}</div>
  ${portsStr ? `<div class="cc-ports">${escHtml(portsStr)}</div>` : ''}
  <div class="cc-net"><i class="fas fa-globe"></i> ${escHtml(c.network)}</div>
  ${envStr ? `<div class="cc-env">${escHtml(envStr)}</div>` : ''}
  ${volStr ? `<div class="cc-env">${escHtml(volStr)}</div>` : ''}
  ${c.status === 'running' ? `
  <div class="cc-cpu">
    <div class="cpu-label"><span>CPU</span><span>${cpu}%</span></div>
    <div class="cpu-bar"><div class="cpu-fill ${cpuCls}" style="width:${cpu}%"></div></div>
  </div>` : ''}
  <div class="cc-actions">
    ${stopStart}
    <button class="cc-btn danger" onclick="uiRm('${c.name}')"><i class="fas fa-trash"></i> Rm</button>
    <button class="cc-btn" onclick="uiLogs('${c.id}')"><i class="fas fa-clipboard-list"></i> Logs</button>
    <button class="cc-btn" onclick="uiExec('${c.name}')"><i class="fas fa-bolt"></i> Exec</button>
  </div>
</div>`;
  }).join('');
}

function refreshImageList() {
  const list = document.getElementById('image-list');
  if (!STATE.images.length) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon"><i class="fas fa-image"></i></div>
        <div>Nenhuma imagem. Tente: <code>docker pull nginx</code></div>
      </div>`;
    return;
  }
  list.innerHTML = STATE.images.map(img => {
    const inUse = STATE.containers.some(c => c.imageName === img.name || c.image === img.full);
    return `
<div class="image-row">
  <span class="image-icon"><i class="fas fa-cube"></i></span>
  <span class="image-name">${escHtml(img.name)}</span>
  <span class="image-tag">:${escHtml(img.tag)}</span>
  <span class="image-id">${shortId(img.id)}</span>
  ${inUse ? '<span class="image-inuse">em uso</span>' : ''}
  <span class="image-size">${img.size}</span>
  <button class="cc-btn danger" onclick="executeCommand('docker rmi ${img.name}:${img.tag}')" style="margin-left:4px"><i class="fas fa-trash"></i></button>
</div>`;
  }).join('');
}

function refreshNetworkMap() {
  const mapEl = document.getElementById('network-map');
  const nodesEl = document.getElementById('network-nodes');
  const svg = document.getElementById('network-svg');

  const networks = STATE.networks;
  const containers = STATE.containers;

  const nodePositions = {};
  let svgLines = '';
  let nodesHtml = '';

  const mapW = mapEl.offsetWidth || 400;
  const mapH = Math.max(160, 60 + networks.length * 50 + containers.length * 50);
  mapEl.style.height = mapH + 'px';

  networks.forEach((net, ni) => {
    const x = 80;
    const y = 30 + ni * 50;
    nodePositions['net-' + net.name] = { x, y };
    nodesHtml += `
<div class="net-node" style="left:${x}px;top:${y}px;" title="${net.name} (${net.driver})">
  <div class="net-node-circle network-node"><i class="fas fa-network-wired"></i></div>
  <div class="net-node-label">${escHtml(net.name)}</div>
</div>`;
  });

  containers.forEach((c, ci) => {
    const cols = Math.max(1, Math.floor((mapW - 180) / 80));
    const x = 200 + (ci % cols) * 80;
    const y = 30 + Math.floor(ci / cols) * 60;
    nodePositions['c-' + c.id] = { x, y };
    nodesHtml += `
<div class="net-node" style="left:${x}px;top:${y}px;" title="${c.name} → ${c.network}">
  <div class="net-node-circle container-node ${c.status}"><i class="fas fa-box"></i></div>
  <div class="net-node-label">${escHtml(c.name.slice(0,10))}</div>
</div>`;

    const netPos = nodePositions['net-' + c.network];
    if (netPos) {
      const x2 = nodePositions['c-' + c.id].x;
      const y2 = nodePositions['c-' + c.id].y;
      const color = c.status === 'running' ? '#3fb950' : '#484f58';
      svgLines += `<line x1="${netPos.x}" y1="${netPos.y}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1.5" stroke-dasharray="${c.status==='running'?'0':'5,3'}"/>`;
    }
  });

  svg.innerHTML = svgLines;
  svg.setAttribute('viewBox', `0 0 ${mapW} ${mapH}`);
  nodesEl.innerHTML = nodesHtml;
}

function refreshVolumeList() {
  const list = document.getElementById('volume-list');
  if (!STATE.volumes.length) {
    list.innerHTML = `
      <div class="empty-state" style="width:100%">
        <div class="empty-icon"><i class="fas fa-database"></i></div>
        <div>Nenhum volume criado.</div>
      </div>`;
    return;
  }
  list.innerHTML = STATE.volumes.map(v => `
<div class="vol-chip">
  <span class="vol-icon"><i class="fas fa-folder"></i></span>
  <span>${escHtml(v.name)}</span>
</div>`).join('');
}

function refreshSidebar() {
  const cList = document.getElementById('sidebar-containers');
  cList.innerHTML = STATE.containers.map(c => `
<div class="sidebar-item" onclick="document.getElementById('card-${c.id}')?.scrollIntoView({behavior:'smooth'})">
  <div class="sidebar-dot" style="background:${c.status==='running'?'var(--green)':'var(--text-muted)'}"></div>
  <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100px">${escHtml(c.name)}</span>
</div>`).join('') || '<div class="sidebar-item" style="color:var(--text-muted)">Nenhum</div>';

  const iList = document.getElementById('sidebar-images');
  iList.innerHTML = STATE.images.map(img => `
<div class="sidebar-item">
  <span><i class="fas fa-cube"></i></span>
  <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:110px">${escHtml(img.name)}</span>
</div>`).join('') || '<div class="sidebar-item" style="color:var(--text-muted)">Nenhuma</div>';

  const nList = document.getElementById('sidebar-networks');
  nList.innerHTML = STATE.networks.map(n => `
<div class="sidebar-item">
  <span><i class="fas fa-globe"></i></span>
  <span>${escHtml(n.name)}</span>
</div>`).join('');

  const vList = document.getElementById('sidebar-volumes');
  vList.innerHTML = STATE.volumes.map(v => `
<div class="sidebar-item">
  <span><i class="fas fa-database"></i></span>
  <span>${escHtml(v.name)}</span>
</div>`).join('') || '<div class="sidebar-item" style="color:var(--text-muted)">Nenhum</div>';
}
// ============================================================
// UI BUTTON ACTIONS
// ============================================================
function uiStop(name) {
  executeCommand(`docker stop ${name}`);
}

function uiStart(name) {
  executeCommand(`docker start ${name}`);
}

function uiRm(name) {
  const c = findContainer(name);
  if (c && c.status === 'running') {
    if (!confirm(`Container "${name}" está rodando. Forçar remoção?`)) return;
    executeCommand(`docker rm -f ${name}`);
  } else {
    executeCommand(`docker rm ${name}`);
  }
}

function uiLogs(id) {
  const c = STATE.containers.find(ct => ct.id === id);
  if (!c) return;
  document.getElementById('modal-title').textContent = `Logs — ${c.name}`;
  const logs = c.logs || ['(sem logs)'];
  document.getElementById('modal-body').innerHTML = logs.map(l => `<div>${escHtml(l)}</div>`).join('');
  document.getElementById('modal-overlay').classList.add('show');
}

function uiExec(name) {
  const cmd = prompt(`Executar no container "${name}":\n(ex: ls, env, whoami, ps aux)`, 'ls');
  if (!cmd) return;
  executeCommand(`docker exec ${name} ${cmd}`);
}

// ============================================================
// CHALLENGES
// ============================================================
const CHALLENGES = [
  {
    title: 'Hello World Docker',
    desc: 'Seu primeiro container! Rode o container "hello-world" e veja a mensagem de boas-vindas.',
    objectives: [
      { text: 'Executar: docker run hello-world', check: () => STATE.containers.some(c => c.imageName === 'hello-world') }
    ]
  },
  {
    title: 'Servidor Web Nginx',
    desc: 'Suba um servidor Nginx exposto na porta 8080 do host.',
    objectives: [
      { text: 'Container nginx rodando', check: () => STATE.containers.some(c => c.imageName === 'nginx' && c.status === 'running') },
      { text: 'Porta 8080 mapeada', check: () => STATE.containers.some(c => c.ports.some(p => p.startsWith('8080:'))) }
    ]
  },
  {
    title: 'Banco de Dados MySQL',
    desc: 'Execute um container MySQL com senha root "secret" e banco de dados "appdb".',
    objectives: [
      { text: 'Container mysql rodando', check: () => STATE.containers.some(c => c.imageName === 'mysql' && c.status === 'running') },
      { text: 'Variável MYSQL_ROOT_PASSWORD definida', check: () => STATE.containers.some(c => c.env.some(e => e.includes('MYSQL_ROOT_PASSWORD'))) },
      { text: 'Variável MYSQL_DATABASE=appdb definida', check: () => STATE.containers.some(c => c.env.some(e => e.includes('MYSQL_DATABASE=appdb'))) }
    ]
  },
  {
    title: 'Rede Customizada',
    desc: 'Crie uma rede "app-net" e suba um Nginx e um MySQL conectados a ela.',
    objectives: [
      { text: 'Rede "app-net" criada', check: () => !!findNetwork('app-net') },
      { text: 'Nginx na rede app-net', check: () => STATE.containers.some(c => c.imageName === 'nginx' && c.network === 'app-net') },
      { text: 'MySQL na rede app-net', check: () => STATE.containers.some(c => c.imageName === 'mysql' && c.network === 'app-net') }
    ]
  },
  {
    title: 'Volumes Persistentes',
    desc: 'Crie um volume "dados-app" e monte-o no caminho /data de um container Ubuntu.',
    objectives: [
      { text: 'Volume "dados-app" existe', check: () => !!findVolume('dados-app') },
      { text: 'Container com volume montado em /data', check: () => STATE.containers.some(c => c.volumes.some(v => v.includes('dados-app') && v.includes('/data'))) }
    ]
  },
  {
    title: 'Stack Completa com Compose',
    desc: 'Use o editor Docker Compose (ou docker compose up) para subir uma stack com web + banco de dados.',
    objectives: [
      { text: '2 ou mais containers via compose rodando', check: () => STATE.composedContainers.length >= 2 },
      { text: 'Alguma rede criada pelo compose', check: () => STATE.networks.some(n => !n.internal) }
    ]
  }
];

function renderChallenges() {
  const list = document.getElementById('challenges-list');
  list.innerHTML = CHALLENGES.map((ch, i) => {
    const allDone = ch.objectives.every(o => o.check());
    const anyDone = ch.objectives.some(o => o.check());
    return `
<div class="challenge-card ${anyDone && !allDone ? 'active' : ''} ${allDone ? 'completed' : ''}" id="ch-${i}">
  <div class="challenge-header">
    <div class="challenge-num ${allDone ? 'completed' : ''}">${allDone ? '✓' : i + 1}</div>
    <div class="challenge-title">${ch.title}</div>
  </div>
  <div class="challenge-desc">${ch.desc}</div>
  <div class="challenge-objectives">
    ${ch.objectives.map(o => `
    <div class="obj-item">
      <div class="obj-check ${o.check() ? 'done' : ''}">✓</div>
      <span>${o.text}</span>
    </div>`).join('')}
  </div>
  <div class="challenge-success ${allDone ? 'visible' : ''}">
    🎉 Parabéns! Desafio "${ch.title}" concluído!
  </div>
</div>`;
  }).join('');
}

function updateChallengeUI() {
  if (document.getElementById('challenges-area').classList.contains('visible')) {
    renderChallenges();
  }
}

function checkChallenges() {
  CHALLENGES.forEach((ch, i) => {
    if (ch.objectives.every(o => o.check())) {
      const prev = ch._done;
      if (!prev) {
        ch._done = true;
        showNotif(`🎉 Desafio "${ch.title}" completo!`, 'success');
      }
    }
  });
  updateChallengeUI();
}



// ============================================================
// CPU ANIMATION (simulated)
// ============================================================
function startCpuAnimation() {
  setInterval(() => {
    STATE.containers.forEach(c => {
      if (c.status === 'running') {
        c.cpu = Math.max(1, Math.min(95, (c.cpu || 10) + (Math.random() * 10 - 5)));
        const el = document.querySelector(`#card-${c.id} .cpu-fill`);
        if (el) {
          const pct = Math.round(c.cpu);
          el.style.width = pct + '%';
          el.className = `cpu-fill ${pct > 70 ? 'critical' : pct > 40 ? 'high' : ''}`;
          const label = document.querySelector(`#card-${c.id} .cpu-label span:last-child`);
          if (label) label.textContent = pct + '%';
        }
      }
    });
  }, 2000);
}

// ============================================================
// SPLITTER (resize)
// ============================================================
function initSplitter() {
  const splitter = document.getElementById('splitter');
  const termPanel = document.getElementById('terminal-panel');
  let dragging = false, startX = 0, startW = 0;

  splitter.addEventListener('mousedown', e => {
    dragging = true;
    startX = e.clientX;
    startW = termPanel.offsetWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  });

  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    const delta = e.clientX - startX;
    const newW = Math.max(280, Math.min(window.innerWidth * 0.7, startW + delta));
    termPanel.style.width = newW + 'px';
    termPanel.style.minWidth = newW + 'px';
  });

  document.addEventListener('mouseup', () => {
    dragging = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  });
}

// ============================================================
// INPUT HANDLING
// ============================================================
const termInput = document.getElementById('terminal-input');

termInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const val = termInput.value;
    termInput.value = '';
    executeCommand(val);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (STATE.cmdHistory.length) {
      STATE.historyIdx = Math.min(STATE.historyIdx + 1, STATE.cmdHistory.length - 1);
      termInput.value = STATE.cmdHistory[STATE.historyIdx];
    }
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (STATE.historyIdx > 0) {
      STATE.historyIdx--;
      termInput.value = STATE.cmdHistory[STATE.historyIdx];
    } else {
      STATE.historyIdx = -1;
      termInput.value = '';
    }
  } else if (e.key === 'Tab') {
    e.preventDefault();
    const val = termInput.value;
    const cmds = ['docker pull ', 'docker run ', 'docker ps', 'docker stop ', 'docker start ', 'docker rm ', 'docker rmi ', 'docker images', 'docker logs ', 'docker exec ', 'docker network create ', 'docker network ls', 'docker network rm ', 'docker volume create ', 'docker volume ls', 'docker volume rm ', 'docker compose up', 'docker compose down', 'docker system prune', 'docker info', 'docker version', 'clear', 'help'];
    const match = cmds.find(c => c.startsWith(val) && c !== val);
    if (match) termInput.value = match;
  } else if (e.key === 'l' && e.ctrlKey) {
    e.preventDefault();
    clearTerminal();
  }
});

// Focus terminal on click
document.getElementById('terminal-panel').addEventListener('click', () => {
  termInput.focus();
});

// ============================================================
// INIT
// ============================================================
function init() {
  const restored = loadState();

  termLine('╔══════════════════════════════════════════════╗', 'term-info');
  termLine('║⠀⠀⠀⠀⠀⠀⠀⠀DockerSim — Simulador Docker⠀⠀⠀⠀⠀⠀ ║', 'term-info');
  termLine('║⠀⠀Aprenda Docker de forma prática e visual!⠀⠀║', 'term-info');
  termLine('╚══════════════════════════════════════════════╝', 'term-info');
  termLine('');
  termLine('Docker version 25.0.2, build 29cf629 (simulado)', 'term-dim');
  if (restored && STATE.containers.length) {
    termLine(`Sessão restaurada: ${STATE.containers.length} container(s), ${STATE.images.length} imagem(ns)`, 'term-success');
  } else {
    termLine('Digite "help" para ver os comandos disponíveis.', 'term-dim');
    termLine('Dica: experimente "docker run -d -p 8080:80 --name web nginx"', 'term-dim');
  }
  termLine('');

  refreshUI();
  initSplitter();
  startCpuAnimation();
  termInput.focus();
}

init();