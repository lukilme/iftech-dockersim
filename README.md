# DockerSim

DockerSim é um simulador interativo de Docker em navegador, criado para ensinar conceitos básicos de containers, imagens, redes, volumes e Docker Compose de forma visual e prática.

## O que é o projeto?

Este app simula o comportamento de comandos Docker comuns em uma interface web semelhante a um terminal, permitindo que o usuário experimente operações sem precisar de um Docker real instalado.

## Principais funcionalidades

### 1. Terminal interativo
- Interface de terminal com comandos simulados do Docker.
- Suporte a comandos como:
  - `docker pull`
  - `docker images`
  - `docker run`
  - `docker ps`
  - `docker stop`
  - `docker start`
  - `docker rm`
  - `docker rmi`
  - `docker logs`
  - `docker exec`
  - `docker network create/ls/rm`
  - `docker volume create/ls/rm`
  - `docker compose up/down`
  - `docker system prune`
  - `docker info`
  - `docker version`
  - `help` e `clear`
- Inclui autocomplete por tecla `Tab`, histórico com `Seta para cima/baixo` e execução de comandos a partir da interface.

### 2. Dashboard visual
- Exibição de containers, imagens, redes e volumes em painéis interativos.
- Estatísticas em tempo real:
  - containers rodando
  - total de containers
  - total de imagens
  - total de redes
- Cards de containers com:
  - nome e ID
  - status (running/exited)
  - imagem associada
  - portas mapeadas
  - rede
  - variáveis de ambiente
  - volumes
  - indicador de CPU simulado

### 3. Gerenciamento de containers
- Criar containers a partir de imagens simuladas.
- Iniciar, parar e remover containers.
- Ver logs de containers.
- Executar comandos dentro de containers de forma simulada.
- Suportar opções comuns como:
  - `-d` / `--detach`
  - `-p` / `--publish`
  - `--name`
  - `-v` / `--volume`
  - `-e` / `--env`
  - `--network`

### 4. Gerenciamento de imagens
- Simulação de pull de imagens do Docker Hub.
- Listagem de imagens locais.
- Remoção de imagens quando não estão em uso.
- Suporte a imagens conhecidas como `nginx`, `mysql`, `redis`, `postgres`, `alpine`, `ubuntu`, `node`, `python`, entre outras.

### 5. Redes e volumes
- Criação de redes bridge personalizadas.
- Visualização de redes no mapa de rede.
- Criação e remoção de volumes persistentes.
- Associação de volumes a containers durante o `docker run`.

### 6. Mapa de rede visual
- Representação gráfica de redes e containers.
- Conexões entre containers e suas redes.
- Atualização dinâmica conforme o estado do simulador muda.

### 7. Editores integrados
- Editor de Dockerfile com botão para simular o build de imagem.
- Editor de docker-compose com ações para subir e derrubar uma stack.
- Suporte a parsing básico de serviços, redes, volumes e portas no Compose.

### 8. Desafios guiados
- Modo de desafios com objetivos práticos, como:
  - executar um `hello-world`
  - subir um Nginx na porta 8080
  - criar um MySQL com variáveis de ambiente
  - criar uma rede personalizada
  - montar volumes persistentes
  - subir uma stack com Compose
- O sistema valida automaticamente o progresso.

### 9. Persistência de sessão
- Salva o estado atual no `localStorage` do navegador.
- Permite restaurar a sessão depois de recarregar a página.
- Possui ação de reset completo para limpar tudo.

### 10. Personalização visual
- Alternância entre tema escuro e claro.
- Modal de logs para visualizar output de containers.
- Painel de ajuda com exemplos de comandos Docker.
- Redimensionamento do painel terminal via splitter.

## Estrutura do projeto

- `index.html` — estrutura principal da interface.
- `main.js` — lógica do simulador, comandos, estado e renderização.
- `style.css` — estilos e layout visual.
- `modules/` — módulos organizados por responsabilidade:
  - `docker.js` — ações de build e compose.
  - `terminal.js` — terminal e entrada de comandos.
  - `ui.js` — navegação entre visualizações e notificações.
  - `storage.js` — persistência e reset do estado.

## Como executar

Como é uma aplicação estática, você pode abrir o arquivo `index.html` diretamente em um navegador ou servir a pasta com um servidor simples.

Exemplo com Python:

```bash
python3 -m http.server 8000
```

Depois abra:

```text
http://localhost:8000
```

## Exemplo de uso

Tente alguns comandos no terminal:

```bash
docker pull nginx
docker run -d -p 8080:80 --name web nginx
docker ps
docker network create app-net
docker volume create dados-app
help
```

## Observação

Este projeto é um simulador didático, então as operações são representadas visualmente e não executam containers reais no sistema.
