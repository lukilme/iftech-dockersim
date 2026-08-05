import { notify, toggleTheme as uiToggleTheme, switchView as uiSwitchView, switchEditorTab as uiSwitchEditorTab, closeModal as uiCloseModal, closeHelpPanel as uiCloseHelpPanel } from './ui.js';
import { clearTerminal as clearTerminalView } from './terminal.js';
import { buildDockerfile as buildImageFromDockerfile, composeUp as composeUpAction, composeDown as composeDownAction } from './docker.js';
import { saveState as persistState, loadState as restoreState, resetAll as resetAppState } from './storage.js';

const KNOWN_IMAGES = {
  nginx: { size: '142MB', tag: 'latest', layers: 7 },
  'nginx:latest': { size: '142MB', tag: 'latest', layers: 7 },
  'nginx:alpine': { size: '23MB', tag: 'alpine', layers: 4 },
  mysql: { size: '544MB', tag: 'latest', layers: 12 },
  'mysql:latest': { size: '544MB', tag: 'latest', layers: 12 },
  'mysql:8.0': { size: '533MB', tag: '8.0', layers: 11 },
  postgres: { size: '379MB', tag: 'latest', layers: 9 },
  'postgres:latest': { size: '379MB', tag: 'latest', layers: 9 },
  redis: { size: '117MB', tag: 'latest', layers: 6 },
  'redis:alpine': { size: '28MB', tag: 'alpine', layers: 5 },
  alpine: { size: '7.33MB', tag: 'latest', layers: 1 },
  ubuntu: { size: '77.9MB', tag: 'latest', layers: 3 },
  'ubuntu:22.04': { size: '77.9MB', tag: '22.04', layers: 3 },
  node: { size: '994MB', tag: 'latest', layers: 10 },
  'node:18': { size: '992MB', tag: '18', layers: 10 },
  'node:alpine': { size: '175MB', tag: 'alpine', layers: 7 },
  python: { size: '1.01GB', tag: 'latest', layers: 9 },
  'python:3.11': { size: '1.01GB', tag: '3.11', layers: 9 },
  'python:alpine': { size: '52MB', tag: 'alpine', layers: 6 },
  mongo: { size: '698MB', tag: 'latest', layers: 11 },
  httpd: { size: '168MB', tag: 'latest', layers: 8 },
  debian: { size: '124MB', tag: 'latest', layers: 2 },
  busybox: { size: '4.86MB', tag: 'latest', layers: 1 },
  'hello-world': { size: '13.3kB', tag: 'latest', layers: 1 },
  traefik: { size: '157MB', tag: 'latest', layers: 5 },
  wordpress: { size: '615MB', tag: 'latest', layers: 14 },
};

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

const EXEC_OUTPUTS = {
  bash: '# Prompt bash simulado (ambiente isolado)\nroot@container:/app#',
  sh: '/ #',
  ls: 'app  bin  dev  etc  home  lib  media  mnt  opt  proc  root  run  sbin  srv  sys  tmp  usr  var',
  pwd: '/app',
  whoami: 'root',
  'cat /etc/os-release': 'NAME="Ubuntu"\nVERSION="22.04.3 LTS (Jammy Jellyfish)"\nID=ubuntu',
  'ps aux': 'USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND\nroot         1  0.0  0.1   4236  3456 ?        Ss   10:00   0:00 sh\nroot        12  0.0  0.0   4236  1024 pts/0    R+   10:05   0:00 ps aux',
  'df -h': 'Filesystem      Size  Used Avail Use% Mounted on\noverlay         100G   15G   85G  15% /\ntmpfs            64M     0   64M   0% /dev\n/dev/sda1       100G   15G   85G  15% /etc/hosts',
  env: 'PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin\nHOME=/root\nTERM=xterm',
  hostname: 'container-sim',
  'uname -a': 'Linux container-sim 5.15.0-1041-aws #46-Ubuntu SMP Mon Aug 28 18:04:46 UTC 2023 x86_64 x86_64 x86_64 GNU/Linux',
  date: new Date().toUTCString(),
  'ifconfig': 'eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500\n  inet 172.17.0.2  netmask 255.255.0.0  broadcast 172.17.255.255\n  ether 02:42:ac:11:00:02  txqueuelen 0  (Ethernet)',
  'curl localhost': '<!DOCTYPE html><html><body><h1>Welcome to nginx!</h1></body></html>',
  'mysql -u root -p': 'Enter password: \nWelcome to the MySQL monitor.\nmysql>',
  'redis-cli ping': 'PONG',
  'python3 --version': 'Python 3.11.6',
  'node --version': 'v18.19.0',
  'npm --version': '10.2.3',
};

export class DockerSimulator {
  constructor() {
    this.state = this.createInitialState();
    this.challenges = this.createChallenges();
    this.knownImages = KNOWN_IMAGES;
    this.simulatedLogs = SIMULATED_LOGS;
    this.execOutputs = EXEC_OUTPUTS;
    this.termInput = null;
    this.termOutput = null;
    this.initDomRefs();
  }

  createInitialState() {
    return {
      containers: [],
      images: [],
      networks: [
        { id: this.genId(), name: 'bridge', driver: 'bridge', subnet: '172.17.0.0/16', internal: true },
        { id: this.genId(), name: 'host', driver: 'host', subnet: 'host', internal: true },
        { id: this.genId(), name: 'none', driver: 'null', subnet: 'none', internal: true }
      ],
      volumes: [],
      cmdHistory: [],
      historyIdx: -1,
      currentChallenge: 0,
      composedContainers: [],
      usedPorts: new Set(),
      cpuAnimInterval: null
    };
  }

  initDomRefs() {
    this.termOutput = document.getElementById('terminal-output');
    this.termInput = document.getElementById('terminal-input');
    this.containerGrid = document.getElementById('container-grid');
    this.imageList = document.getElementById('image-list');
    this.networkMap = document.getElementById('network-map');
    this.networkNodes = document.getElementById('network-nodes');
    this.networkSvg = document.getElementById('network-svg');
    this.volumeList = document.getElementById('volume-list');
    this.sidebarContainers = document.getElementById('sidebar-containers');
    this.sidebarImages = document.getElementById('sidebar-images');
    this.sidebarNetworks = document.getElementById('sidebar-networks');
    this.sidebarVolumes = document.getElementById('sidebar-volumes');
    this.challengesList = document.getElementById('challenges-list');
    this.modalTitle = document.getElementById('modal-title');
    this.modalBody = document.getElementById('modal-body');
    this.modalOverlay = document.getElementById('modal-overlay');
  }

  init() {
    this.exposeGlobalHandlers();
    this.attachInputHandlers();

    const restored = restoreState();
    if (restored) {
      this.applyPersistedState(restored);
    }

    this.renderWelcome();
    this.refreshUI();
    this.initSplitter();
    this.startCpuAnimation();
    this.termInput?.focus();
  }

  exposeGlobalHandlers() {
    window.toggleTheme = () => uiToggleTheme();
    window.switchView = (view) => uiSwitchView(view);
    window.switchPanel = (view) => uiSwitchView(view);
    window.switchEditorTab = (tab) => uiSwitchEditorTab(tab);
    window.closeModal = () => uiCloseModal();
    window.closeHelpPanel = () => uiCloseHelpPanel();
    window.clearTerminal = () => clearTerminalView();
    window.buildDockerfile = () => buildImageFromDockerfile();
    window.composeUp = () => composeUpAction();
    window.composeDown = () => composeDownAction();
    window.saveState = () => persistState(this.buildPersistencePayload(), { silent: false });
    window.resetAll = () => resetAppState();
    window.uiStop = (name) => this.executeCommand(`docker stop ${name}`);
    window.uiStart = (name) => this.executeCommand(`docker start ${name}`);
    window.uiRm = (name) => this.uiRm(name);
    window.uiLogs = (id) => this.uiLogs(id);
    window.uiExec = (name) => this.uiExec(name);
    window.executeCommand = (command) => this.executeCommand(command);
    window.showNotif = (message, type) => this.showNotif(message, type);
  }

  attachInputHandlers() {
    this.termInput?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        const val = this.termInput.value;
        this.termInput.value = '';
        this.executeCommand(val);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        if (this.state.cmdHistory.length) {
          this.state.historyIdx = Math.min(this.state.historyIdx + 1, this.state.cmdHistory.length - 1);
          this.termInput.value = this.state.cmdHistory[this.state.historyIdx];
        }
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        if (this.state.historyIdx > 0) {
          this.state.historyIdx--;
          this.termInput.value = this.state.cmdHistory[this.state.historyIdx];
        } else {
          this.state.historyIdx = -1;
          this.termInput.value = '';
        }
      } else if (event.key === 'Tab') {
        event.preventDefault();
        const val = this.termInput.value;
        const cmds = ['docker pull ', 'docker run ', 'docker ps', 'docker stop ', 'docker start ', 'docker rm ', 'docker rmi ', 'docker images', 'docker logs ', 'docker exec ', 'docker network create ', 'docker network ls', 'docker network rm ', 'docker volume create ', 'docker volume ls', 'docker volume rm ', 'docker compose up', 'docker compose down', 'docker system prune', 'docker info', 'docker version', 'clear', 'help'];
        const match = cmds.find((command) => command.startsWith(val) && command !== val);
        if (match) this.termInput.value = match;
      } else if (event.key === 'l' && event.ctrlKey) {
        event.preventDefault();
        clearTerminalView();
      }
    });

    document.getElementById('terminal-view')?.addEventListener('click', () => this.termInput?.focus());
  }

  createChallenges() {
    return [
      {
        title: 'Hello World Docker',
        desc: 'Seu primeiro container! Rode o container "hello-world" e veja a mensagem de boas-vindas.',
        objectives: [
          { text: 'Executar: docker run hello-world', check: () => this.state.containers.some((container) => container.imageName === 'hello-world') }
        ]
      },
      {
        title: 'Servidor Web Nginx',
        desc: 'Suba um servidor Nginx exposto na porta 8080 do host.',
        objectives: [
          { text: 'Container nginx rodando', check: () => this.state.containers.some((container) => container.imageName === 'nginx' && container.status === 'running') },
          { text: 'Porta 8080 mapeada', check: () => this.state.containers.some((container) => container.ports.some((port) => port.startsWith('8080:'))) }
        ]
      },
      {
        title: 'Banco de Dados MySQL',
        desc: 'Execute um container MySQL com senha root "secret" e banco de dados "appdb".',
        objectives: [
          { text: 'Container mysql rodando', check: () => this.state.containers.some((container) => container.imageName === 'mysql' && container.status === 'running') },
          { text: 'Variável MYSQL_ROOT_PASSWORD definida', check: () => this.state.containers.some((container) => container.env.some((entry) => entry.includes('MYSQL_ROOT_PASSWORD'))) },
          { text: 'Variável MYSQL_DATABASE=appdb definida', check: () => this.state.containers.some((container) => container.env.some((entry) => entry.includes('MYSQL_DATABASE=appdb'))) }
        ]
      },
      {
        title: 'Rede Customizada',
        desc: 'Crie uma rede "app-net" e suba um Nginx e um MySQL conectados a ela.',
        objectives: [
          { text: 'Rede "app-net" criada', check: () => !!this.findNetwork('app-net') },
          { text: 'Nginx na rede app-net', check: () => this.state.containers.some((container) => container.imageName === 'nginx' && container.network === 'app-net') },
          { text: 'MySQL na rede app-net', check: () => this.state.containers.some((container) => container.imageName === 'mysql' && container.network === 'app-net') }
        ]
      },
      {
        title: 'Volumes Persistentes',
        desc: 'Crie um volume "dados-app" e monte-o no caminho /data de um container Ubuntu.',
        objectives: [
          { text: 'Volume "dados-app" existe', check: () => !!this.findVolume('dados-app') },
          { text: 'Container com volume montado em /data', check: () => this.state.containers.some((container) => container.volumes.some((volume) => volume.includes('dados-app') && volume.includes('/data'))) }
        ]
      },
      {
        title: 'Stack Completa com Compose',
        desc: 'Use o editor Docker Compose (ou docker compose up) para subir uma stack com web + banco de dados.',
        objectives: [
          { text: '2 ou mais containers via compose rodando', check: () => this.state.composedContainers.length >= 2 },
          { text: 'Alguma rede criada pelo compose', check: () => this.state.networks.some((network) => !network.internal) }
        ]
      }
    ];
  }

  genId(len = 12) {
    const chars = '0123456789abcdef';
    return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }

  shortId(id) {
    return id.slice(0, 12);
  }

  randomName() {
    const adj = ['elegant', 'bold', 'swift', 'bright', 'gentle', 'happy', 'zealous', 'jolly', 'stoic', 'brave'];
    const nouns = ['newton', 'darwin', 'curie', 'turing', 'tesla', 'lovelace', 'euler', 'gauss', 'bohr', 'feynman'];
    return adj[Math.floor(Math.random() * adj.length)] + '_' + nouns[Math.floor(Math.random() * adj.length)];
  }

  parseImage(rawImage) {
    if (!rawImage) return null;
    const parts = rawImage.split(':');
    return { name: parts[0], tag: parts[1] || 'latest', full: rawImage.includes(':') ? rawImage : `${rawImage}:latest` };
  }

  findContainer(nameOrId) {
    return this.state.containers.find((container) => container.name === nameOrId || container.id === nameOrId || container.id.startsWith(nameOrId) || this.shortId(container.id) === nameOrId);
  }

  findImage(nameOrId) {
    return this.state.images.find((image) => image.name === nameOrId || image.full === nameOrId || image.id === nameOrId || image.id.startsWith(nameOrId) || (nameOrId.includes(':') ? image.full === nameOrId : image.name === nameOrId));
  }

  findNetwork(nameOrId) {
    return this.state.networks.find((network) => network.name === nameOrId || network.id === nameOrId || network.id.startsWith(nameOrId));
  }

  findVolume(name) {
    return this.state.volumes.find((volume) => volume.name === name);
  }

  getCpuPct() {
    return Math.floor(Math.random() * 30) + 1;
  }

  escHtml(value) {
    return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  termLine(text, cls = 'term-output') {
    if (!this.termOutput) return;
    if (!text && text !== '') return;
    const lines = String(text).split('\n');
    lines.forEach((line) => {
      const div = document.createElement('div');
      div.className = `term-line ${cls}`;
      div.textContent = line;
      this.termOutput.appendChild(div);
    });
    this.termOutput.scrollTop = this.termOutput.scrollHeight;
  }

  termPromptLine(command) {
    if (!this.termOutput) return;
    const div = document.createElement('div');
    div.className = 'term-line';
    div.innerHTML = `<span class="term-prompt">estudante@docker:~$</span> <span class="term-cmd">${this.escHtml(command)}</span>`;
    this.termOutput.appendChild(div);
    this.termOutput.scrollTop = this.termOutput.scrollHeight;
  }

  parseArgs(input) {
    const tokens = [];
    let current = '';
    let inSingle = false;
    let inDouble = false;
    for (let index = 0; index < input.length; index += 1) {
      const char = input[index];
      if (char === "'" && !inDouble) {
        inSingle = !inSingle;
        continue;
      }
      if (char === '"' && !inSingle) {
        inDouble = !inDouble;
        continue;
      }
      if (char === ' ' && !inSingle && !inDouble) {
        if (current) tokens.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    if (current) tokens.push(current);
    return tokens;
  }

  extractFlags(tokens) {
    const flags = {};
    const positional = [];
    for (let index = 0; index < tokens.length; index += 1) {
      const token = tokens[index];
      if (token.startsWith('--')) {
        const eq = token.indexOf('=');
        if (eq !== -1) {
          flags[token.slice(2, eq)] = token.slice(eq + 1);
        } else {
          const next = tokens[index + 1];
          if (next && !next.startsWith('-')) {
            flags[token.slice(2)] = next;
            index += 1;
          } else {
            flags[token.slice(2)] = true;
          }
        }
      } else if (token.startsWith('-') && token.length === 2) {
        const next = tokens[index + 1];
        if (['-p', '-v', '-e', '--name', '--network', '-m', '--cpus', '-u'].includes(token) || (next && !next.startsWith('-'))) {
          if (next && !next.startsWith('-')) {
            flags[token.slice(1)] = next;
            index += 1;
          } else {
            flags[token.slice(1)] = true;
          }
        } else {
          flags[token.slice(1)] = true;
        }
      } else if (token.startsWith('-') && token.length > 2 && !token.startsWith('--')) {
        token.slice(1).split('').forEach((flag) => { flags[flag] = true; });
      } else {
        positional.push(token);
      }
    }
    return { flags, positional };
  }

  cmdPull(args) {
    if (!args.length) {
      this.termLine('Uso: docker pull <imagem>', 'term-error');
      return;
    }
    const raw = args[0];
    const image = this.parseImage(raw);
    const knownKey = Object.keys(this.knownImages).find((key) => key === raw || key === image.name || key === image.full);
    if (this.findImage(raw) || this.findImage(image.name)) {
      this.termLine(`${image.full}: Imagem já existe no cache local.`, 'term-warn');
      return;
    }

    this.termLine(`Pulling from library/${image.name}`, 'term-info');
    const meta = knownKey ? this.knownImages[knownKey] : { size: `${Math.floor(Math.random() * 500) + 50}MB`, tag: image.tag, layers: Math.floor(Math.random() * 10) + 3 };
    const layerCount = meta.layers || 5;

    let delay = 0;
    for (let index = 0; index < layerCount; index += 1) {
      const layerId = this.genId(12);
      setTimeout(() => {
        this.termLine(`${layerId.slice(0, 12)}: Pull complete`, 'term-dim');
      }, delay);
      delay += 120 + Math.random() * 80;
    }

    setTimeout(() => {
      this.termLine(`Digest: sha256:${this.genId(64)}`, 'term-dim');
      this.termLine(`Status: Downloaded newer image for ${image.name}:${image.tag}`, 'term-success');
      this.termLine(`docker.io/library/${image.name}:${image.tag}`, 'term-dim');
      this.state.images.push({
        id: this.genId(12),
        name: image.name,
        tag: image.tag,
        full: `${image.name}:${image.tag}`,
        size: meta.size,
        layers: meta.layers || 5,
        created: new Date().toISOString()
      });
      this.refreshUI();
    }, delay + 200);
  }

  cmdImages() {
    if (!this.state.images.length) {
      this.termLine('REPOSITORY   TAG       IMAGE ID   CREATED   SIZE', 'term-bold');
      this.termLine('(nenhuma imagem local)', 'term-dim');
      return;
    }
    this.termLine('REPOSITORY          TAG       IMAGE ID       CREATED          SIZE', 'term-bold');
    this.state.images.forEach((image) => {
      const repo = image.name.padEnd(20);
      const tag = image.tag.padEnd(10);
      const id = this.shortId(image.id).padEnd(15);
      const created = 'Há pouco       '.padEnd(17);
      this.termLine(`${repo}${tag}${id}${created}${image.size}`);
    });
  }

  cmdRun(args) {
    if (!args.length) {
      this.termLine('Uso: docker run [opções] <imagem> [comando]', 'term-error');
      return;
    }

    const { flags, positional } = this.extractFlags(args);
    const allPorts = [];
    const allVolumes = [];
    const allEnv = [];

    for (let index = 0; index < args.length; index += 1) {
      if ((args[index] === '-p' || args[index] === '--publish') && args[index + 1]) {
        allPorts.push(args[index + 1]);
        index += 1;
      } else if ((args[index] === '-v' || args[index] === '--volume') && args[index + 1]) {
        allVolumes.push(args[index + 1]);
        index += 1;
      } else if ((args[index] === '-e' || args[index] === '--env') && args[index + 1]) {
        allEnv.push(args[index + 1]);
        index += 1;
      }
    }

    const imageName = positional[0];
    if (!imageName) {
      this.termLine('Erro: nome da imagem é obrigatório', 'term-error');
      return;
    }

    const image = this.parseImage(imageName);
    let localImage = this.findImage(imageName) || this.findImage(image.name);
    if (!localImage) {
      const knownKey = Object.keys(this.knownImages).find((key) => key === imageName || key === image.name || key === image.full);
      if (!knownKey) {
        this.termLine(`Unable to find image '${imageName}' locally`, 'term-output');
        this.termLine(`Error response from daemon: pull access denied for ${image.name}, repository does not exist or may require 'docker login'`, 'term-error');
        return;
      }
      this.termLine(`Unable to find image '${imageName}' locally`, 'term-output');
      const meta = this.knownImages[knownKey];
      this.state.images.push({ id: this.genId(12), name: image.name, tag: image.tag, full: `${image.name}:${image.tag}`, size: meta.size, layers: meta.layers || 5, created: new Date().toISOString() });
      localImage = this.state.images[this.state.images.length - 1];
      this.termLine(`${image.tag}: Pulling from library/${image.name}`, 'term-info');
      this.termLine(`Digest: sha256:${this.genId(64)}`, 'term-dim');
      this.termLine(`Status: Downloaded newer image for ${image.name}:${image.tag}`, 'term-success');
    }

    const containerName = flags.name || flags.n || this.randomName();
    if (this.findContainer(containerName)) {
      this.termLine(`Error response from daemon: Conflict. The container name "/${containerName}" is already in use. Use "docker rm" to remove it.`, 'term-error');
      return;
    }

    for (const port of allPorts) {
      const hostPort = port.split(':')[0];
      if (this.state.usedPorts.has(hostPort)) {
        this.termLine(`Error response from daemon: driver failed programming external connectivity on endpoint ${containerName}: Bind for 0.0.0.0:${hostPort} failed: port is already allocated`, 'term-error');
        return;
      }
    }

    const networkName = flags.network || 'bridge';
    const network = this.findNetwork(networkName);
    if (!network) {
      this.termLine(`Error response from daemon: network ${networkName} not found`, 'term-error');
      return;
    }

    allPorts.forEach((port) => {
      const hostPort = port.split(':')[0];
      this.state.usedPorts.add(hostPort);
    });

    allVolumes.forEach((volume) => {
      const volumeName = volume.split(':')[0];
      if (!volumeName.startsWith('/') && !this.findVolume(volumeName)) {
        this.state.volumes.push({ name: volumeName, path: `/var/lib/docker/volumes/${volumeName}/_data`, created: new Date().toISOString() });
      }
    });

    const container = {
      id: this.genId(64),
      name: containerName,
      image: localImage.full,
      imageName: image.name,
      status: 'running',
      ports: allPorts,
      network: networkName,
      volumes: allVolumes,
      env: allEnv,
      cpu: this.getCpuPct(),
      created: new Date().toISOString(),
      detached: Boolean(flags.d || flags.detach),
      logs: this.generateLogs(image.name)
    };

    this.state.containers.push(container);
    if (container.detached) {
      this.termLine(container.id, 'term-success');
    } else {
      const logsToShow = this.simulatedLogs[image.name] || this.simulatedLogs.default;
      logsToShow.forEach((log) => this.termLine(log, 'term-output'));
    }

    this.refreshUI();
    this.checkChallenges();
  }

  cmdPs(showAll) {
    const containers = showAll ? this.state.containers : this.state.containers.filter((container) => container.status === 'running');
    this.termLine('CONTAINER ID   IMAGE           COMMAND   CREATED       STATUS         PORTS                   NAMES', 'term-bold');
    if (!containers.length) {
      this.termLine('(nenhum container)', 'term-dim');
      return;
    }
    containers.forEach((container) => {
      const id = this.shortId(container.id).padEnd(15);
      const image = container.image.padEnd(16);
      const command = '"entrypoint"  '.padEnd(10);
      const created = 'Há pouco   '.padEnd(14);
      const status = (container.status === 'running' ? `Up ${Math.floor(Math.random() * 60) + 1} seconds` : 'Exited (0) 1 second ago').padEnd(23);
      const ports = container.ports.join(', ').padEnd(24);
      this.termLine(`${id}${image}${command}${created}${status}${ports}${container.name}`);
    });
  }

  cmdStop(args) {
    if (!args.length) {
      this.termLine('Uso: docker stop <id|nome>', 'term-error');
      return;
    }
    const container = this.findContainer(args[0]);
    if (!container) {
      this.termLine(`Error: No such container: ${args[0]}`, 'term-error');
      return;
    }
    if (container.status !== 'running') {
      this.termLine(`Container ${args[0]} is already stopped`, 'term-warn');
      return;
    }
    container.status = 'exited';
    container.ports.forEach((port) => this.state.usedPorts.delete(port.split(':')[0]));
    this.termLine(this.shortId(container.id), 'term-success');
    this.refreshUI();
    this.checkChallenges();
  }

  cmdStart(args) {
    if (!args.length) {
      this.termLine('Uso: docker start <id|nome>', 'term-error');
      return;
    }
    const container = this.findContainer(args[0]);
    if (!container) {
      this.termLine(`Error: No such container: ${args[0]}`, 'term-error');
      return;
    }
    if (container.status === 'running') {
      this.termLine(`Container ${args[0]} is already running`, 'term-warn');
      return;
    }
    container.status = 'running';
    container.ports.forEach((port) => this.state.usedPorts.add(port.split(':')[0]));
    this.termLine(this.shortId(container.id), 'term-success');
    this.refreshUI();
    this.checkChallenges();
  }

  cmdRm(args) {
    if (!args.length) {
      this.termLine('Uso: docker rm <id|nome>', 'term-error');
      return;
    }
    const force = args.includes('-f') || args.includes('--force');
    const nameOrId = args.find((arg) => !arg.startsWith('-'));
    const container = this.findContainer(nameOrId);
    if (!container) {
      this.termLine(`Error: No such container: ${nameOrId}`, 'term-error');
      return;
    }
    if (container.status === 'running' && !force) {
      this.termLine(`Error response from daemon: You cannot remove a running container ${this.shortId(container.id)}. Stop the container before attempting removal or force remove`, 'term-error');
      return;
    }
    if (container.status === 'running') {
      container.ports.forEach((port) => this.state.usedPorts.delete(port.split(':')[0]));
    }
    this.state.containers.splice(this.state.containers.indexOf(container), 1);
    this.termLine(nameOrId, 'term-success');
    this.refreshUI();
    this.checkChallenges();
  }

  cmdRmi(args) {
    if (!args.length) {
      this.termLine('Uso: docker rmi <imagem>', 'term-error');
      return;
    }
    const image = this.findImage(args[0]) || this.state.images.find((entry) => entry.name === args[0]);
    if (!image) {
      this.termLine(`Error: No such image: ${args[0]}`, 'term-error');
      return;
    }
    const inUse = this.state.containers.some((container) => container.image === image.full || container.imageName === image.name);
    if (inUse) {
      this.termLine(`Error response from daemon: conflict: unable to remove repository reference "${image.full}" (must force) - container is using this image`, 'term-error');
      return;
    }
    this.state.images.splice(this.state.images.indexOf(image), 1);
    this.termLine(`Untagged: ${image.full}`, 'term-output');
    this.termLine(`Deleted: sha256:${this.genId(64)}`, 'term-output');
    this.refreshUI();
  }

  cmdLogs(args) {
    if (!args.length) {
      this.termLine('Uso: docker logs <id|nome>', 'term-error');
      return;
    }
    const container = this.findContainer(args[0]);
    if (!container) {
      this.termLine(`Error: No such container: ${args[0]}`, 'term-error');
      return;
    }
    const logs = container.logs || this.generateLogs(container.imageName);
    logs.forEach((log) => this.termLine(log, 'term-dim'));
  }

  cmdExec(args) {
    if (args.length < 2) {
      this.termLine('Uso: docker exec <container> <comando>', 'term-error');
      return;
    }
    const nameOrId = args[0];
    const container = this.findContainer(nameOrId);
    if (!container) {
      this.termLine(`Error: No such container: ${nameOrId}`, 'term-error');
      return;
    }
    if (container.status !== 'running') {
      this.termLine(`Error response from daemon: Container ${nameOrId} is not running`, 'term-error');
      return;
    }
    const command = args.slice(1).join(' ').replace(/^-it?\s+|^-ti?\s+/, '');
    const output = this.execOutputs[command] || this.execOutputs[command.split(' ')[0]] || `${command}: command executed (output simulado)`;
    this.termLine(output, 'exec-output');
  }

  cmdNetworkCreate(args) {
    if (!args.length) {
      this.termLine('Uso: docker network create <nome>', 'term-error');
      return;
    }
    const name = args[args.length - 1];
    if (this.findNetwork(name)) {
      this.termLine(`Error response from daemon: network with name ${name} already exists`, 'term-error');
      return;
    }
    const subnet = `172.${18 + this.state.networks.length}.0.0/16`;
    const id = this.genId(64);
    this.state.networks.push({ id, name, driver: 'bridge', subnet, internal: false });
    this.termLine(id, 'term-success');
    this.refreshUI();
    this.checkChallenges();
  }

  cmdNetworkLs() {
    this.termLine('NETWORK ID     NAME      DRIVER    SCOPE', 'term-bold');
    this.state.networks.forEach((network) => {
      this.termLine(`${this.shortId(network.id).padEnd(15)}${network.name.padEnd(10)}${network.driver.padEnd(10)}local`);
    });
  }

  cmdNetworkRm(args) {
    if (!args.length) {
      this.termLine('Uso: docker network rm <nome>', 'term-error');
      return;
    }
    const network = this.findNetwork(args[0]);
    if (!network) {
      this.termLine(`Error: No such network: ${args[0]}`, 'term-error');
      return;
    }
    if (network.internal) {
      this.termLine(`Error response from daemon: ${network.name} is a pre-defined network and cannot be removed`, 'term-error');
      return;
    }
    const inUse = this.state.containers.some((container) => container.network === network.name && container.status === 'running');
    if (inUse) {
      this.termLine(`Error response from daemon: error while removing network: network ${network.name} id ${this.shortId(network.id)} has active endpoints`, 'term-error');
      return;
    }
    this.state.networks.splice(this.state.networks.indexOf(network), 1);
    this.termLine(network.name, 'term-success');
    this.refreshUI();
  }

  cmdVolumeCreate(args) {
    const name = args[0] || this.genId(20);
    if (this.findVolume(name)) {
      this.termLine(`volume already exists: ${name}`, 'term-warn');
      return;
    }
    this.state.volumes.push({ name, path: `/var/lib/docker/volumes/${name}/_data`, created: new Date().toISOString() });
    this.termLine(name, 'term-success');
    this.refreshUI();
  }

  cmdVolumeLs() {
    this.termLine('DRIVER    VOLUME NAME', 'term-bold');
    this.state.volumes.forEach((volume) => this.termLine(`local     ${volume.name}`));
  }

  cmdVolumeRm(args) {
    if (!args.length) {
      this.termLine('Uso: docker volume rm <nome>', 'term-error');
      return;
    }
    const volume = this.findVolume(args[0]);
    if (!volume) {
      this.termLine(`Error: No such volume: ${args[0]}`, 'term-error');
      return;
    }
    const inUse = this.state.containers.some((container) => container.volumes.some((entry) => entry.split(':')[0] === volume.name));
    if (inUse) {
      this.termLine(`Error response from daemon: volume is in use - [${args[0]}]`, 'term-error');
      return;
    }
    this.state.volumes.splice(this.state.volumes.indexOf(volume), 1);
    this.termLine(volume.name, 'term-success');
    this.refreshUI();
  }

  cmdComposeUp() {
    const yaml = document.getElementById('compose-editor').value;
    const services = this.parseSimpleYaml(yaml);
    if (!services.length) {
      this.termLine('Erro ao parsear docker-compose.yml', 'term-error');
      return;
    }

    this.termLine('Creating network(s)...', 'term-info');
    const netMatch = yaml.match(/^networks:\s*\n((?:\s+\w[\w-]*:\s*\n(?:\s+.*\n)*)*)/m);
    if (netMatch) {
      const netLines = netMatch[1].split('\n');
      netLines.forEach((line) => {
        const match = line.match(/^\s{2}(\w[\w-]*):/);
        if (match && !this.findNetwork(match[1])) {
          const id = this.genId(64);
          this.state.networks.push({ id, name: match[1], driver: 'bridge', subnet: `172.${19 + this.state.networks.length}.0.0/16`, internal: false });
          this.termLine(`Network ${match[1]} created`, 'term-success');
        }
      });
    }

    let delay = 0;
    services.forEach((service) => {
      setTimeout(() => {
        this.termLine(`Creating ${service.name} ... done`, 'term-success');
        const image = this.parseImage(service.image);
        let localImage = this.findImage(service.image) || this.findImage(image.name);
        if (!localImage) {
          const knownKey = Object.keys(this.knownImages).find((key) => key === service.image || key === image.name);
          const meta = knownKey ? this.knownImages[knownKey] : { size: '100MB', tag: image.tag, layers: 5 };
          this.state.images.push({ id: this.genId(12), name: image.name, tag: image.tag, full: `${image.name}:${image.tag}`, size: meta.size, layers: meta.layers, created: new Date().toISOString() });
          localImage = this.state.images[this.state.images.length - 1];
        }
        if (!this.findContainer(service.name)) {
          const containerId = this.genId(64);
          this.state.containers.push({
            id: containerId,
            name: service.name,
            image: localImage.full,
            imageName: image.name,
            status: 'running',
            ports: service.ports || [],
            network: service.network || 'bridge',
            volumes: service.volumes || [],
            env: service.env || [],
            cpu: this.getCpuPct(),
            created: new Date().toISOString(),
            detached: true,
            logs: this.generateLogs(image.name),
            composeService: true
          });
          (service.ports || []).forEach((port) => this.state.usedPorts.add(port.split(':')[0]));
          this.state.composedContainers.push(service.name);
        }
        this.refreshUI();
      }, delay);
      delay += 400;
    });

    setTimeout(() => {
      this.termLine('', '');
      this.termLine('Starting services...', 'term-info');
      services.forEach((service) => this.termLine(`  ${service.name}: Started`, 'term-success'));
      this.checkChallenges();
    }, delay + 200);
  }

  cmdComposeDown() {
    if (!this.state.composedContainers.length) {
      this.termLine('No compose services running.', 'term-warn');
      return;
    }
    this.state.composedContainers.forEach((name) => {
      const container = this.findContainer(name);
      if (container) {
        container.ports.forEach((port) => this.state.usedPorts.delete(port.split(':')[0]));
        this.state.containers.splice(this.state.containers.indexOf(container), 1);
        this.termLine(`Stopping ${name} ... done`, 'term-output');
        this.termLine(`Removing ${name} ... done`, 'term-output');
      }
    });
    this.state.composedContainers = [];
    this.refreshUI();
  }

  cmdPrune() {
    const stopped = this.state.containers.filter((container) => container.status === 'exited');
    const unusedImages = this.state.images.filter((image) => !this.state.containers.some((container) => container.imageName === image.name || container.image === image.full));
    stopped.forEach((container) => this.state.containers.splice(this.state.containers.indexOf(container), 1));
    unusedImages.forEach((image) => this.state.images.splice(this.state.images.indexOf(image), 1));
    this.termLine(`Removed ${stopped.length} stopped container(s)`, 'term-success');
    this.termLine(`Removed ${unusedImages.length} unused image(s)`, 'term-success');
    this.termLine(`Total reclaimed space: ${Math.floor(Math.random() * 2000)}MB`, 'term-info');
    this.refreshUI();
  }

  parseSimpleYaml(yaml) {
    const services = [];
    const lines = yaml.split('\n');
    let inServices = false;
    let currentService = null;

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      const indent = line.match(/^(\s*)/)[1].length;
      if (line.trim() === 'services:') {
        inServices = true;
        continue;
      }
      if (inServices && /^[a-z]/.test(line.trim()) && line.trim() !== 'services:' && !line.trim().startsWith('-')) {
        if (line.trim() === 'networks:' || line.trim() === 'volumes:') {
          inServices = false;
          continue;
        }
      }
      if (inServices && indent === 2 && line.trim().endsWith(':')) {
        if (currentService) services.push(currentService);
        currentService = { name: line.trim().replace(':', ''), image: '', ports: [], volumes: [], env: [], network: 'bridge' };
      } else if (inServices && currentService && indent >= 4) {
        const trimmed = line.trim();
        if (trimmed.startsWith('image:')) currentService.image = trimmed.replace('image:', '').trim();
        if (trimmed.startsWith('- ') && lines[index - 1] && lines[index - 1].trim() === 'ports:') currentService.ports.push(trimmed.replace('- ', '').replace(/"/g, '').trim());
        if (trimmed.startsWith('- ') && lines[index - 1] && lines[index - 1].trim() === 'volumes:') currentService.volumes.push(trimmed.replace('- ', '').trim());
        if (trimmed.startsWith('- ') && lines[index - 1] && lines[index - 1].trim() === 'environment:') currentService.env.push(trimmed.replace('- ', '').trim());
        if (trimmed.startsWith('networks:')) {
          const nextLine = lines[index + 1];
          if (nextLine && nextLine.trim().startsWith('-')) currentService.network = nextLine.trim().replace('- ', '');
        }
      }
    }
    if (currentService) services.push(currentService);

    let current = null;
    let mode = null;
    for (const line of lines) {
      const indent = line.match(/^(\s*)/)[1].length;
      const trimmed = line.trim();
      if (trimmed === 'services:') continue;
      if (indent === 2 && trimmed.endsWith(':') && !['ports:', 'volumes:', 'environment:', 'networks:', 'depends_on:'].includes(trimmed)) {
        current = services.find((service) => service.name === trimmed.replace(':', ''));
        mode = null;
      }
      if (current) {
        if (trimmed === 'ports:') mode = 'ports';
        else if (trimmed === 'volumes:') mode = 'volumes';
        else if (trimmed === 'environment:') mode = 'env';
        else if (trimmed === 'networks:') mode = 'networks';
        else if (trimmed.startsWith('- ') && mode) {
          const value = trimmed.replace('- ', '').replace(/"/g, '').trim();
          if (mode === 'ports' && !current.ports.includes(value)) current.ports.push(value);
          if (mode === 'volumes' && !current.volumes.includes(value)) current.volumes.push(value);
          if (mode === 'env' && !current.env.includes(value)) current.env.push(value);
          if (mode === 'networks') current.network = value;
        } else if (!trimmed.startsWith('-') && trimmed !== '' && indent >= 4) {
          if (trimmed.startsWith('image:')) current.image = trimmed.replace('image:', '').trim();
          mode = null;
        }
      }
    }
    return services.filter((service) => service.image);
  }

  generateLogs(imageName) {
    const base = this.simulatedLogs[imageName] || this.simulatedLogs.default;
    const extra = [
      `[INFO] Container ${this.genId(8)} iniciado`,
      '[INFO] Porta exposta e serviço disponível',
      '[DEBUG] Carregando configurações...',
      '[INFO] Health check OK',
    ];
    return [...base, ...extra.slice(0, 2)];
  }

  showHelp() {
    this.termLine('');
    this.termLine('DockerSim — Comandos disponíveis:', 'term-info');
    this.termLine('─'.repeat(60), 'term-dim');
    this.termLine('  docker pull <imagem>              Baixar imagem', 'term-output');
    this.termLine('  docker images                     Listar imagens', 'term-output');
    this.termLine('  docker rmi <imagem>               Remover imagem', 'term-output');
    this.termLine('  docker run [opts] <imagem>        Criar e iniciar container', 'term-output');
    this.termLine('    -d                              Modo detached (background)', 'term-dim');
    this.termLine('    -p host:container               Mapear porta', 'term-dim');
    this.termLine('    --name <nome>                   Nomear container', 'term-dim');
    this.termLine('    -v vol:/caminho                 Montar volume', 'term-dim');
    this.termLine('    -e VAR=valor                    Variável de ambiente', 'term-dim');
    this.termLine('    --network <rede>                Conectar à rede', 'term-dim');
    this.termLine('  docker ps [-a]                    Listar containers', 'term-output');
    this.termLine('  docker stop/start/rm <id|nome>    Gerenciar container', 'term-output');
    this.termLine('  docker logs <id|nome>             Ver logs', 'term-output');
    this.termLine('  docker exec <id|nome> <cmd>       Executar comando', 'term-output');
    this.termLine('  docker network create/ls/rm       Gerenciar redes', 'term-output');
    this.termLine('  docker volume create/ls/rm        Gerenciar volumes', 'term-output');
    this.termLine('  docker compose up/down            Docker Compose', 'term-output');
    this.termLine('  docker system prune               Remover recursos ociosos', 'term-output');
    this.termLine('  clear                             Limpar terminal', 'term-output');
    this.termLine('─'.repeat(60), 'term-dim');
    this.termLine('');
  }

  executeCommand(rawCommand) {
    const input = rawCommand.trim();
    if (!input) return;

    this.state.cmdHistory.unshift(input);
    this.state.historyIdx = -1;
    this.termPromptLine(input);

    const tokens = this.parseArgs(input);
    if (!tokens.length) return;

    const main = tokens[0].toLowerCase();
    const sub = tokens[1] ? tokens[1].toLowerCase() : '';
    const rest = tokens.slice(2);

    if (main === 'clear') {
      clearTerminalView();
      return;
    }
    if (main === 'help' || main === '--help' || (main === 'docker' && sub === '--help')) {
      this.showHelp();
      return;
    }

    if (main !== 'docker') {
      const execOutput = this.execOutputs[input] || this.execOutputs[main];
      if (execOutput) {
        this.termLine(execOutput, 'exec-output');
        return;
      }
      this.termLine(`${main}: command not found`, 'term-error');
      this.termLine('Dica: Este é um simulador Docker. Use comandos "docker ..." ou "help"', 'term-dim');
      return;
    }

    switch (sub) {
      case 'pull':
        this.cmdPull(rest);
        break;
      case 'images':
        this.cmdImages();
        break;
      case 'rmi':
        this.cmdRmi(rest);
        break;
      case 'run':
        this.cmdRun(rest);
        break;
      case 'ps':
        this.cmdPs(rest.includes('-a') || rest.includes('--all'));
        break;
      case 'stop':
        this.cmdStop(rest);
        break;
      case 'start':
        this.cmdStart(rest);
        break;
      case 'rm':
        this.cmdRm(rest);
        break;
      case 'logs':
        this.cmdLogs(rest);
        break;
      case 'exec':
        this.cmdExec(rest);
        break;
      case 'network': {
        const networkCommand = tokens[2] ? tokens[2].toLowerCase() : '';
        if (networkCommand === 'create') this.cmdNetworkCreate(tokens.slice(3));
        else if (networkCommand === 'ls' || networkCommand === 'list') this.cmdNetworkLs();
        else if (networkCommand === 'rm' || networkCommand === 'remove') this.cmdNetworkRm(tokens.slice(3));
        else if (networkCommand === 'inspect') this.termLine('(inspect simulado — use docker network ls)', 'term-dim');
        else this.termLine('Uso: docker network [create|ls|rm] ...', 'term-error');
        break;
      }
      case 'volume': {
        const volumeCommand = tokens[2] ? tokens[2].toLowerCase() : '';
        if (volumeCommand === 'create') this.cmdVolumeCreate(tokens.slice(3));
        else if (volumeCommand === 'ls' || volumeCommand === 'list') this.cmdVolumeLs();
        else if (volumeCommand === 'rm' || volumeCommand === 'remove') this.cmdVolumeRm(tokens.slice(3));
        else this.termLine('Uso: docker volume [create|ls|rm] ...', 'term-error');
        break;
      }
      case 'compose': {
        const composeCommand = tokens[2] ? tokens[2].toLowerCase() : '';
        if (composeCommand === 'up') this.cmdComposeUp();
        else if (composeCommand === 'down') this.cmdComposeDown();
        else this.termLine('Uso: docker compose [up|down]', 'term-error');
        break;
      }
      case 'system':
        if (tokens[2] === 'prune') this.cmdPrune();
        else this.termLine('Uso: docker system prune', 'term-error');
        break;
      case 'version':
        this.termLine('Docker version 25.0.2, build 29cf629', 'term-output');
        this.termLine('(Simulador DockerSim v1.0)', 'term-dim');
        break;
      case 'info':
        this.termLine(`Containers: ${this.state.containers.length}`, 'term-output');
        this.termLine(` Running: ${this.state.containers.filter((container) => container.status === 'running').length}`, 'term-output');
        this.termLine(` Stopped: ${this.state.containers.filter((container) => container.status === 'exited').length}`, 'term-output');
        this.termLine(`Images: ${this.state.images.length}`, 'term-output');
        this.termLine('Server Version: 25.0.2 (simulado)', 'term-dim');
        break;
      default:
        this.termLine(`docker: '${sub}' is not a docker command.`, 'term-error');
        this.termLine("See 'docker --help' or type 'help'", 'term-dim');
    }
  }

  refreshUI() {
    this.refreshContainerGrid();
    this.refreshImageList();
    this.refreshNetworkMap();
    this.refreshVolumeList();
    this.refreshSidebar();
    this.refreshStats();
    this.updateChallengeUI();
    persistState(this.buildPersistencePayload(), { silent: true });
  }

  refreshStats() {
    const running = this.state.containers.filter((container) => container.status === 'running').length;
    document.getElementById('stat-running').textContent = running;
    document.getElementById('stat-containers').textContent = this.state.containers.length;
    document.getElementById('stat-images').textContent = this.state.images.length;
    document.getElementById('stat-networks').textContent = this.state.networks.length;
  }

  refreshContainerGrid() {
    if (!this.containerGrid) return;
    if (!this.state.containers.length) {
      this.containerGrid.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon"><i class="fas fa-cubes"></i></div>
          <div>Nenhum container. Tente: <code>docker run nginx</code></div>
        </div>`;
      return;
    }

    this.containerGrid.innerHTML = this.state.containers.map((container) => {
      const cpu = container.status === 'running' ? (container.cpu || this.getCpuPct()) : 0;
      const cpuCls = cpu > 70 ? 'critical' : cpu > 40 ? 'high' : '';
      const portsStr = container.ports.length ? `<i class="fas fa-plug"></i> ${container.ports.join(', ')}` : '';
      const envStr = container.env.length ? `<i class="fas fa-key"></i> ${container.env.slice(0, 2).join(', ')}` : '';
      const volumeStr = container.volumes.length ? `<i class="fas fa-database"></i> ${container.volumes.slice(0, 2).join(', ')}` : '';
      const stopStart = container.status === 'running'
        ? `<button class="cc-btn danger" onclick="uiStop('${container.name}')"><i class="fas fa-stop"></i> Stop</button>`
        : `<button class="cc-btn success" onclick="uiStart('${container.name}')"><i class="fas fa-play"></i> Start</button>`;
      return `
<div class="container-card ${container.status}" id="card-${container.id}">
  <div class="cc-header">
    <div>
      <div class="cc-name">${this.escHtml(container.name)}</div>
      <div class="cc-id">${this.shortId(container.id)}</div>
    </div>
    <div class="status-badge ${container.status}">
      <div class="status-dot"></div>${container.status === 'running' ? 'Up' : 'Exited'}
    </div>
  </div>
  <div class="cc-image"><i class="fas fa-image"></i> ${this.escHtml(container.image)}</div>
  ${portsStr ? `<div class="cc-ports">${this.escHtml(portsStr)}</div>` : ''}
  <div class="cc-net"><i class="fas fa-globe"></i> ${this.escHtml(container.network)}</div>
  ${envStr ? `<div class="cc-env">${this.escHtml(envStr)}</div>` : ''}
  ${volumeStr ? `<div class="cc-env">${this.escHtml(volumeStr)}</div>` : ''}
  ${container.status === 'running' ? `
  <div class="cc-cpu">
    <div class="cpu-label"><span>CPU</span><span>${cpu}%</span></div>
    <div class="cpu-bar"><div class="cpu-fill ${cpuCls}" style="width:${cpu}%"></div></div>
  </div>` : ''}
  <div class="cc-actions">
    ${stopStart}
    <button class="cc-btn danger" onclick="uiRm('${container.name}')"><i class="fas fa-trash"></i> Rm</button>
    <button class="cc-btn" onclick="uiLogs('${container.id}')"><i class="fas fa-clipboard-list"></i> Logs</button>
    <button class="cc-btn" onclick="uiExec('${container.name}')"><i class="fas fa-bolt"></i> Exec</button>
  </div>
</div>`;
    }).join('');
  }

  refreshImageList() {
    if (!this.imageList) return;
    if (!this.state.images.length) {
      this.imageList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon"><i class="fas fa-image"></i></div>
          <div>Nenhuma imagem. Tente: <code>docker pull nginx</code></div>
        </div>`;
      return;
    }

    this.imageList.innerHTML = this.state.images.map((image) => {
      const inUse = this.state.containers.some((container) => container.imageName === image.name || container.image === image.full);
      return `
<div class="image-row">
  <span class="image-icon"><i class="fas fa-cube"></i></span>
  <span class="image-name">${this.escHtml(image.name)}</span>
  <span class="image-tag">:${this.escHtml(image.tag)}</span>
  <span class="image-id">${this.shortId(image.id)}</span>
  ${inUse ? '<span class="image-inuse">em uso</span>' : ''}
  <span class="image-size">${image.size}</span>
  <button class="cc-btn danger" onclick="executeCommand('docker rmi ${image.name}:${image.tag}')" style="margin-left:4px"><i class="fas fa-trash"></i></button>
</div>`;
    }).join('');
  }

  refreshNetworkMap() {
    if (!this.networkMap || !this.networkNodes || !this.networkSvg) return;
    const networks = this.state.networks;
    const containers = this.state.containers;
    const nodePositions = {};
    let svgLines = '';
    let nodesHtml = '';
    const mapWidth = this.networkMap.offsetWidth || 400;
    const mapHeight = Math.max(160, 60 + networks.length * 50 + containers.length * 50);
    this.networkMap.style.height = `${mapHeight}px`;

    networks.forEach((network, index) => {
      const x = 80;
      const y = 30 + index * 50;
      nodePositions[`net-${network.name}`] = { x, y };
      nodesHtml += `
<div class="net-node" style="left:${x}px;top:${y}px;" title="${network.name} (${network.driver})">
  <div class="net-node-circle network-node"><i class="fas fa-network-wired"></i></div>
  <div class="net-node-label">${this.escHtml(network.name)}</div>
</div>`;
    });

    containers.forEach((container, index) => {
      const columns = Math.max(1, Math.floor((mapWidth - 180) / 80));
      const x = 200 + (index % columns) * 80;
      const y = 30 + Math.floor(index / columns) * 60;
      nodePositions[`c-${container.id}`] = { x, y };
      nodesHtml += `
<div class="net-node" style="left:${x}px;top:${y}px;" title="${container.name} → ${container.network}">
  <div class="net-node-circle container-node ${container.status}"><i class="fas fa-box"></i></div>
  <div class="net-node-label">${this.escHtml(container.name.slice(0, 10))}</div>
</div>`;

      const netPos = nodePositions[`net-${container.network}`];
      if (netPos) {
        const endX = nodePositions[`c-${container.id}`].x;
        const endY = nodePositions[`c-${container.id}`].y;
        const color = container.status === 'running' ? '#3fb950' : '#484f58';
        svgLines += `<line x1="${netPos.x}" y1="${netPos.y}" x2="${endX}" y2="${endY}" stroke="${color}" stroke-width="1.5" stroke-dasharray="${container.status === 'running' ? '0' : '5,3'}"/>`;
      }
    });

    this.networkSvg.innerHTML = svgLines;
    this.networkSvg.setAttribute('viewBox', `0 0 ${mapWidth} ${mapHeight}`);
    this.networkNodes.innerHTML = nodesHtml;
  }

  refreshVolumeList() {
    if (!this.volumeList) return;
    if (!this.state.volumes.length) {
      this.volumeList.innerHTML = `
        <div class="empty-state" style="width:100%">
          <div class="empty-icon"><i class="fas fa-database"></i></div>
          <div>Nenhum volume criado.</div>
        </div>`;
      return;
    }
    this.volumeList.innerHTML = this.state.volumes.map((volume) => `
<div class="vol-chip">
  <span class="vol-icon"><i class="fas fa-folder"></i></span>
  <span>${this.escHtml(volume.name)}</span>
</div>`).join('');
  }

  refreshSidebar() {
    if (!this.sidebarContainers || !this.sidebarImages || !this.sidebarNetworks || !this.sidebarVolumes) return;
    this.sidebarContainers.innerHTML = this.state.containers.map((container) => `
<div class="sidebar-item" onclick="document.getElementById('card-${container.id}')?.scrollIntoView({behavior:'smooth'})">
  <div class="sidebar-dot" style="background:${container.status === 'running' ? 'var(--green)' : 'var(--text-muted)'}"></div>
  <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100px">${this.escHtml(container.name)}</span>
</div>`).join('') || '<div class="sidebar-item" style="color:var(--text-muted)">Nenhum</div>';

    this.sidebarImages.innerHTML = this.state.images.map((image) => `
<div class="sidebar-item">
  <span><i class="fas fa-cube"></i></span>
  <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:110px">${this.escHtml(image.name)}</span>
</div>`).join('') || '<div class="sidebar-item" style="color:var(--text-muted)">Nenhuma</div>';

    this.sidebarNetworks.innerHTML = this.state.networks.map((network) => `
<div class="sidebar-item">
  <span><i class="fas fa-globe"></i></span>
  <span>${this.escHtml(network.name)}</span>
</div>`).join('');

    this.sidebarVolumes.innerHTML = this.state.volumes.map((volume) => `
<div class="sidebar-item">
  <span><i class="fas fa-database"></i></span>
  <span>${this.escHtml(volume.name)}</span>
</div>`).join('') || '<div class="sidebar-item" style="color:var(--text-muted)">Nenhum</div>';
  }

  uiRm(name) {
    const container = this.findContainer(name);
    if (container && container.status === 'running') {
      if (!confirm(`Container "${name}" está rodando. Forçar remoção?`)) return;
      this.executeCommand(`docker rm -f ${name}`);
    } else {
      this.executeCommand(`docker rm ${name}`);
    }
  }

  uiLogs(id) {
    const container = this.state.containers.find((entry) => entry.id === id);
    if (!container) return;
    if (this.modalTitle) this.modalTitle.textContent = `Logs — ${container.name}`;
    const logs = container.logs || ['(sem logs)'];
    if (this.modalBody) this.modalBody.innerHTML = logs.map((entry) => `<div>${this.escHtml(entry)}</div>`).join('');
    this.modalOverlay?.classList.add('show');
  }

  uiExec(name) {
    const command = prompt(`Executar no container "${name}":\n(ex: ls, env, whoami, ps aux)`, 'ls');
    if (!command) return;
    this.executeCommand(`docker exec ${name} ${command}`);
  }

  renderWelcome() {
    this.termLine('╔══════════════════════════════════════════════╗', 'term-info');
    this.termLine('║⠀⠀⠀⠀⠀⠀⠀⠀DockerSim — Simulador Docker⠀⠀⠀⠀⠀⠀ ║', 'term-info');
    this.termLine('║⠀⠀Aprenda Docker de forma prática e visual!⠀⠀║', 'term-info');
    this.termLine('╚══════════════════════════════════════════════╝', 'term-info');
    this.termLine('');
    this.termLine('Docker version 25.0.2, build 29cf629 (simulado)', 'term-dim');
    const restored = restoreState();
    if (restored && this.state.containers.length) {
      this.termLine(`Sessão restaurada: ${this.state.containers.length} container(s), ${this.state.images.length} imagem(ns)`, 'term-success');
    } else {
      this.termLine('Digite "help" para ver os comandos disponíveis.', 'term-dim');
      this.termLine('Dica: experimente "docker run -d -p 8080:80 --name web nginx"', 'term-dim');
    }
    this.termLine('');
  }

  buildPersistencePayload() {
    return {
      savedAt: Date.now(),
      containers: this.state.containers,
      images: this.state.images,
      networks: this.state.networks,
      volumes: this.state.volumes,
      cmdHistory: this.state.cmdHistory,
      historyIdx: this.state.historyIdx,
      currentChallenge: this.state.currentChallenge,
      composedContainers: this.state.composedContainers,
      usedPorts: [...this.state.usedPorts],
      completedChallenges: this.challenges.filter((challenge) => challenge._done).map((challenge) => challenge.title)
    };
  }

  applyPersistedState(data) {
    if (!data) return;
    if (Array.isArray(data.containers)) this.state.containers = data.containers;
    if (Array.isArray(data.images)) this.state.images = data.images;
    if (Array.isArray(data.networks)) this.state.networks = data.networks;
    if (Array.isArray(data.volumes)) this.state.volumes = data.volumes;
    if (Array.isArray(data.cmdHistory)) this.state.cmdHistory = data.cmdHistory;
    if (typeof data.historyIdx === 'number') this.state.historyIdx = data.historyIdx;
    if (typeof data.currentChallenge === 'number') this.state.currentChallenge = data.currentChallenge;
    if (Array.isArray(data.composedContainers)) this.state.composedContainers = data.composedContainers;
    if (Array.isArray(data.usedPorts)) this.state.usedPorts = new Set(data.usedPorts);
    if (Array.isArray(data.completedChallenges)) {
      this.challenges.forEach((challenge) => {
        challenge._done = data.completedChallenges.includes(challenge.title);
      });
    }
  }

  renderChallenges() {
    if (!this.challengesList) return;
    this.challengesList.innerHTML = this.challenges.map((challenge, index) => {
      const allDone = challenge.objectives.every((objective) => objective.check());
      const anyDone = challenge.objectives.some((objective) => objective.check());
      return `
<div class="challenge-card ${anyDone && !allDone ? 'active' : ''} ${allDone ? 'completed' : ''}" id="ch-${index}">
  <div class="challenge-header">
    <div class="challenge-num ${allDone ? 'completed' : ''}">${allDone ? '✓' : index + 1}</div>
    <div class="challenge-title">${challenge.title}</div>
  </div>
  <div class="challenge-desc">${challenge.desc}</div>
  <div class="challenge-objectives">
    ${challenge.objectives.map((objective) => `
    <div class="obj-item">
      <div class="obj-check ${objective.check() ? 'done' : ''}">✓</div>
      <span>${objective.text}</span>
    </div>`).join('')}
  </div>
  <div class="challenge-success ${allDone ? 'visible' : ''}">
    🎉 Parabéns! Desafio "${challenge.title}" concluído!
  </div>
</div>`;
    }).join('');
  }

  updateChallengeUI() {
    if (document.getElementById('challenges-area')?.classList.contains('visible')) {
      this.renderChallenges();
    }
  }

  checkChallenges() {
    this.challenges.forEach((challenge) => {
      if (challenge.objectives.every((objective) => objective.check()) && !challenge._done) {
        challenge._done = true;
        this.showNotif(`🎉 Desafio "${challenge.title}" completo!`, 'success');
      }
    });
    this.updateChallengeUI();
  }

  showNotif(message, type = 'info') {
    const timeout = type === 'success' ? 3000 : 2000;
    notify(message, timeout);
  }

  startCpuAnimation() {
    if (this.state.cpuAnimInterval) clearInterval(this.state.cpuAnimInterval);
    this.state.cpuAnimInterval = setInterval(() => {
      this.state.containers.forEach((container) => {
        if (container.status === 'running') {
          container.cpu = Math.max(1, Math.min(95, (container.cpu || 10) + (Math.random() * 10 - 5)));
          const element = document.querySelector(`#card-${container.id} .cpu-fill`);
          if (element) {
            const pct = Math.round(container.cpu);
            element.style.width = `${pct}%`;
            element.className = `cpu-fill ${pct > 70 ? 'critical' : pct > 40 ? 'high' : ''}`;
            const label = document.querySelector(`#card-${container.id} .cpu-label span:last-child`);
            if (label) label.textContent = `${pct}%`;
          }
        }
      });
    }, 2000);
  }

  initSplitter() {
    const splitter = document.getElementById('splitter');
    const terminalPanel = document.getElementById('terminal-view');
    if (!splitter || !terminalPanel) return;

    let dragging = false;
    let startX = 0;
    let startWidth = 0;

    splitter.addEventListener('mousedown', (event) => {
      dragging = true;
      startX = event.clientX;
      startWidth = terminalPanel.offsetWidth;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', (event) => {
      if (!dragging) return;
      const delta = event.clientX - startX;
      const newWidth = Math.max(280, Math.min(window.innerWidth * 0.7, startWidth + delta));
      terminalPanel.style.width = `${newWidth}px`;
      terminalPanel.style.minWidth = `${newWidth}px`;
    });

    document.addEventListener('mouseup', () => {
      dragging = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    });
  }
}

export function initDockerSimulator() {
  const simulator = new DockerSimulator();
  simulator.init();
  return simulator;
}
