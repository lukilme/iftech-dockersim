# DockerSim

DockerSim é um simulador interativo de Docker em navegador, criado para ensinar conceitos básicos de containers, imagens, redes, volumes e Docker Compose de forma visual e prática.

## O que é o projeto?

> [!IMPORTANT]
> Seila, apenas testando isto
> 


Este app simula o comportamento de comandos Docker comuns em uma interface web semelhante a um terminal, permitindo que o usuário experimente operações sem precisar de um Docker real instalado.

$${\color{red}R}{\color{orange}a}{\color{yellow}i}{\color{green}n}{\color{blue}b}{\color{purple}o}{\color{violet}w}$$

## Principais funcionalidades

### 1. Terminal interativo
- Interface de terminal com comandos simulados do Docker.
- Suporte a comandos como:

```sh
  docker pull
  docker images
  docker run
  docker ps
  docker stop
  docker start
  docker rm
  docker rmi
  docker logs
  docker exec
  docker network create/ls/rm
  docker volume create/ls/rm
  docker compose up/down
  docker system prune
  docker info
  docker version
  help e clear
```

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
