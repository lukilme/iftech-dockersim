# DockerSim

$${\color{red}D}{\color{orange}o}{\color{yellow}c}{\color{green}k}{\color{blue}e}{\color{purple}r}{\color{violet}S}{\color{red}i}{\color{orange}m}\ -\ {\color{yellow}O}\ {\color{green}S}{\color{blue}i}{\color{purple}m}{\color{violet}u}{\color{red}l}{\color{orange}a}{\color{yellow}d}{\color{green}o}{\color{blue}r}\ {\color{purple}I}{\color{violet}n}{\color{red}t}{\color{orange}e}{\color{yellow}r}{\color{green}a}{\color{blue}t}{\color{purple}i}{\color{violet}v}{\color{red}o}$$

---

## O que é o projeto?

O **DockerSim** é um simulador interativo de Docker criado para rodar diretamente no navegador. Ele foi feito sob medida para estudantes, devs iniciantes e entusiastas de DevOps aprenderem e praticarem conceitos vitais de containers, imagens, redes, volumes e Docker Compose de forma visual, rápida, prática e **sem passar raiva**.

> [!IMPORTANT]
> **Atenção Dev:** Este app **NÃO** roda containers de verdade e não precisa do Docker Daemon instalado na sua máquina real. É uma simulação ultra-fiel feita em frontend para você praticar comandos sem medo de quebrar o servidor de produção da empresa!

> [!NOTE]
> Nenhuma baleia real ou pente de memória RAM foi sacrificado durante a criação e execução deste simulador.

---

## Por que o DockerSim existe?

- **Zero Instalação:** Não precisa configurar WSL2, ativar VT-x na BIOS nem esperar 10 minutos pro Docker Desktop inicializar.
- **Visualização Instantânea:** Tudo o que você digita no terminal reflete imediatamente no Dashboard visual.
- **Ambiente "Safe Mode":** Digitou `docker system prune` sem querer? Fique tranquilo! Nada na sua máquina real será apagado (nem seus memes salvos em Downloads).

---

## Principais Funcionalidades

### 1. Terminal Interativo
- Terminal simulado com visual moderno e respostas realistas.
- **Autocomplete esperto:** Pressione `Tab` para autocompletar nomes de comandos, imagens e containers.
- **Histórico de Navegação:** Use as setas `Cima (↑)` e `Baixo (↓)` para navegar pelos comandos anteriores.
- **Suporte aos comandos mais amados (e temidos):**

```sh
# Imagens
docker pull <imagem>
docker images
docker rmi <imagem>

# Containers
docker run [opções] <imagem>
docker ps [-a]
docker stop <id|nome>
docker start <id|nome>
docker rm <id|nome>
docker logs <id|nome>
docker exec <id|nome> <comando>

# Redes e Volumes
docker network create <nome>
docker network ls
docker network rm <nome>
docker volume create <nome>
docker volume ls
docker volume rm <nome>

# Orquestração e Utilidades
docker compose up
docker compose down
docker system prune
docker info
docker version
help
clear
```