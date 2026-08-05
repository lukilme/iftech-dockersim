# Exercícios de Docker — Do Básico ao Intermediário

## Instruções de Entrega

Para cada exercício, documente os comandos executados e arquivos criados em um arquivo chamado `respostas-docker.md`. Veja o modelo de exemplo no final deste documento.

## Nível 1: Fundamentos

### Exercício 1.1 — Hello World

- Execute o container hello-world oficial do Docker Hub.
- Verifique a saída e explique em suas palavras o que aconteceu (pull, create, start).

### Exercício 1.2 — Listar e gerenciar containers

- Liste todos os containers em execução.
- Liste todos os containers (incluindo os parados).
- Remova todos os containers parados de uma só vez.

### Exercício 1.3 — Executar um container interativo

- Inicie um container Ubuntu em modo interativo.
- Dentro dele, instale o `curl` e faça uma requisição HTTP para `https://httpbin.org/get`.
- Saia do container e verifique se ele ainda existe.

### Exercício 1.4 — Imagens

- Liste todas as imagens locais.
- Baixe a imagem `nginx:alpine` sem executar um container.
- Remova uma imagem que não está em uso.

### Exercício 1.5 — Executar em background (detached)

- Inicie um container Nginx em background na porta 8080.
- Acesse `http://localhost:8080`.
- Pare e remova o container.

## Nível 2: Dockerfile e Build

### Exercício 2.1 — Primeiro Dockerfile

- Crie um Dockerfile que:
  - Use `python:3.11-slim` como base.
  - Copie um arquivo `app.py` que imprima `"Docker funcionando!"`.
  - Defina o `CMD` para executar o script.
- Faça o build e execute o container.

### Exercício 2.2 — Aplicação web simples

- Crie uma aplicação Flask (ou FastAPI) com um endpoint `/health` que retorne `{"status": "ok"}`.
- Escreva um Dockerfile com `requirements.txt`.
- Faça o build, execute e teste o endpoint com curl ou navegador.

### Exercício 2.3 — .dockerignore

- Crie um arquivo `.dockerignore` que exclua arquivos desnecessários do contexto de build.
- Rebuilde a imagem e verifique que o contexto de build é menor.

### Exercício 2.4 — Multi-stage build

- Crie um Dockerfile com multi-stage para uma aplicação Go ou Node.js:
  - Stage 1: build da aplicação.
  - Stage 2: imagem final mínima apenas com o artefato de build.
- Compare o tamanho da imagem com e sem multi-stage (use `docker images`).

### Exercício 2.5 — Cache de camadas

- Crie um Dockerfile para Node.js que aproveite o cache de camadas corretamente.
- Altere apenas o código-fonte (não o `package.json`) e rebuilde — observe que o `npm install` usa cache.
- Documente a ordem das instruções no Dockerfile e explique por que essa ordem importa.

## Nível 3: Volumes e Persistência

### Exercício 3.1 — Volume nomeado

- Crie um volume nomeado chamado `dados-app`.
- Execute um container que monte esse volume em `/data`.
- Escreva um arquivo dentro de `/data`.
- Pare o container, inicie outro com o mesmo volume e verifique que o arquivo persiste.

### Exercício 3.2 — Bind mount

- Monte um diretório local dentro de um container Nginx para servir arquivos estáticos.
- Altere um arquivo HTML no host e verifique a mudança refletida em tempo real no navegador.

### Exercício 3.3 — Banco de dados com volume

- Execute um container PostgreSQL com volume para persistir os dados.
- Crie uma tabela e insira registros.
- Pare e remova o container.
- Suba novamente com o mesmo volume e verifique que os dados permanecem.

## Nível 4: Networking

### Exercício 4.1 — Network bridge customizada

- Crie uma network bridge chamada `minha-rede`.
- Execute dois containers Alpine nessa rede.
- Verifique que um container consegue pingar o outro pelo nome.

### Exercício 4.2 — App + Banco na mesma rede

- Crie uma network.
- Suba um container Redis nessa rede.
- Suba uma aplicação Python que se conecta ao Redis usando o nome do container como host.
- Demonstre a comunicação funcionando.

### Exercício 4.3 — Expondo portas

- Execute 3 containers Nginx em portas diferentes (8081, 8082, 8083).
- Configure cada um para servir um HTML diferente.
- Acesse cada um pelo navegador.

## Nível 5: Docker Compose

### Exercício 5.1 — Compose básico

- Crie um `docker-compose.yml` com:
  - Um serviço web (Nginx) na porta 8080.
  - Um serviço de banco (PostgreSQL) com variáveis de ambiente.
- Suba com `docker compose up` e verifique ambos funcionando.

### Exercício 5.2 — App completa com Compose

- Crie um compose com 3 serviços:
  - `app`: sua aplicação (com build local via Dockerfile).
  - `db`: PostgreSQL.
  - `cache`: Redis.
- Configure dependências entre os serviços.
- Use variáveis de ambiente via arquivo `.env`.

### Exercício 5.3 — Volumes e networks no Compose

- Adicione volumes nomeados ao exercício anterior para persistir o banco.
- Crie uma network explícita e atribua os serviços a ela.
- Suba, pare, remova containers e verifique que os dados persistem.

### Exercício 5.4 — Scaling de serviços

- Crie um compose com um serviço worker stateless.
- Suba 3 réplicas desse worker.
- Verifique que os 3 estão rodando.

### Exercício 5.5 — Healthcheck

- Adicione healthchecks ao seu `docker-compose.yml`:
  - Para o banco: verificação de disponibilidade.
  - Para a app: verificação de endpoint HTTP.
- Configure dependências condicionais com base no health status.

## Nível 6: Intermediário — Práticas reais

### Exercício 6.1 — Logs e debugging

- Execute um container em background.
- Visualize os logs em tempo real.
- Execute um comando dentro de um container em execução.
- Inspecione o container e encontre o IP interno.

### Exercício 6.2 — Limitar recursos

- Execute um container com limite de memória (256MB) e CPU (0.5 core).
- Instale uma ferramenta de stress e observe o comportamento ao exceder limites.
- Documente o que acontece quando o container atinge o limite de memória.

### Exercício 6.3 — Criar e publicar imagem

- Crie uma conta no Docker Hub (se não tiver).
- Faça o build de uma imagem com tag no formato `usuario/app:v1`.
- Faça push para o Docker Hub.
- Remova a imagem local, faça pull novamente e execute.

### Exercício 6.4 — Container como ferramenta de dev

- Crie um Dockerfile de "ambiente de desenvolvimento" com:
  - Node.js, Python, Git, curl, vim.
- Execute com bind mount do seu projeto local.
- Trabalhe dentro do container sem instalar nada no host.

### Exercício 6.5 — Docker Compose para desenvolvimento

- Crie um compose com hot-reload:
  - Bind mount do código-fonte.
  - Comando de dev com auto-reload.
  - Variáveis de ambiente para modo desenvolvimento.
- Altere o código no host e veja a aplicação atualizar automaticamente.

### Exercício 6.6 — Segurança básica

- Execute um container com usuário não-root.
- Crie um Dockerfile que adicione um usuário sem privilégios e use `USER` para trocar.
- Verifique com `whoami` dentro do container.

### Exercício 6.7 — Cleanup completo

- Liste imagens dangling (sem tag).
- Remova containers, volumes e networks não utilizados.
- Verifique o espaço em disco antes e depois da limpeza.

## Modelo de Arquivo de Respostas

Crie um arquivo chamado `respostas-docker.md` seguindo o formato abaixo. Para cada exercício, documente:

1. Os comandos executados (na ordem).
2. Os arquivos criados (Dockerfile, docker-compose.yml, código, etc.).
3. Uma breve explicação do que aconteceu.

## Orientações Finais

- Mantenha o arquivo `respostas-docker.md` organizado e completo.
- Se um exercício falhar, documente o erro e como você resolveu.
- Não copie respostas prontas — o objetivo é praticar e entender.