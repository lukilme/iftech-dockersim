#!/bin/bash

# Configurações estritas de segurança:
# -e: Para imediatamente se um comando falhar.
# -u: Trata variáveis não declaradas como erro.
# -o pipefail: Garante que erros em pipelines (ex: cmd1 | cmd2) não sejam mascarados.
set -euo pipefail

# Configurações padrão
DRY_RUN=false
KEEP_IMAGES=5
LOG_FILE="docker-maintenance-$(date +%Y%m%d_%H%M%S).log"

# Parse de argumentos (captura flags passadas na execução do script)
for arg in "$@"; do
  case $arg in
    --dry-run) DRY_RUN=true ;;
    --keep-images=*) KEEP_IMAGES="${arg#*=}" ;; # Extrai o valor após o '='
  esac
done

# Função auxiliar para centralizar a formatação dos logs
log() { echo "[$(date '+%H:%M:%S')] $*" | tee -a "$LOG_FILE"; }

# Função que gerencia a execução real ou simulação (Dry-Run)
run() {
  if $DRY_RUN; then
    log "[DRY-RUN] $*"
  else
    log "EXECUTANDO: $*"
    # eval executa a string como comando Bash; redireciona erros (2>&1) para o log
    eval "$@" 2>&1 | tee -a "$LOG_FILE"
  fi
}

log "MANUTENÇÃO DOCKER"
log "Modo: $( $DRY_RUN && echo 'DRY-RUN (nada será removido)' || echo 'REAL' )"
log ""

# Captura e exibe o estado do disco antes da limpeza
BEFORE=$(docker system df --format '{{.TotalSpace}}' 2>/dev/null || echo "N/A")
log "Espaço em uso (antes): $BEFORE"
docker system df | tee -a "$LOG_FILE"
log ""

# containers parados ou criados mas nunca iniciados
STOPPED=$(docker ps -aq --filter status=exited --filter status=created | wc -l)
log "Containers parados encontrados: $STOPPED"
if [ "$STOPPED" -gt 0 ]; then
  run "docker container prune -f"
fi

# imagens dangling (camadas órfãs sem tag e sem associação a nenhum container)
DANGLING=$(docker images -qf dangling=true | wc -l)
log "Imagens dangling encontradas: $DANGLING"
if [ "$DANGLING" -gt 0 ]; then
  run "docker image prune -f"
fi

# redes não utilizadas por nenhum container
log "Removendo redes não utilizadas..."
run "docker network prune -f"

# volumes órfãos (Ação manual preventiva para evitar perda de dados persistentes)
UNUSED_VOLS=$(docker volume ls -qf dangling=true | wc -l)
log "Volumes não utilizados: $UNUSED_VOLS"
if [ "$UNUSED_VOLS" -gt 0 ]; then
  log "Volumes não utilizados detectados. Listando (NÃO removendo automaticamente):"
  docker volume ls -f dangling=true | tee -a "$LOG_FILE"
  log "Para remover manualmente: docker volume prune"
  log "(Volumes não são removidos automaticamente para evitar perda de dados)"
fi

# cache de build (Libera espaço de builds antigas do BuildKit)
log "Removendo cache de build com mais de 24h..."
run "docker buildx prune --filter until=24h -f"

# Relatório final e comparação de espaço liberado
log ""
log "RESULTADO"
AFTER=$(docker system df --format '{{.TotalSpace}}' 2>/dev/null || echo "N/A")
log "Espaço em uso (depois): $AFTER"
docker system df | tee -a "$LOG_FILE"
log ""
log "Manutenção concluída. Log salvo em: $LOG_FILE"