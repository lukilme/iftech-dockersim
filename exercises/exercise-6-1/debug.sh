#!/bin/bash
set -euo pipefail

CONTAINER="${1:?Uso: ./debug.sh <container>}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT="debug-report-${CONTAINER}-${TIMESTAMP}.txt"

echo "DEBUG REPORT: $CONTAINER" | tee "$REPORT"
echo "Gerado em: $(date)" | tee -a "$REPORT"
echo "" | tee -a "$REPORT"

echo "STATUS" | tee -a "$REPORT"
docker inspect "$CONTAINER" \
  --format '{{.Name}} | Status: {{.State.Status}} | PID: {{.State.Pid}} | OOMKilled: {{.State.OOMKilled}} | Restarts: {{.RestartCount}}' \
  | tee -a "$REPORT"

echo "" | tee -a "$REPORT"
echo "IP E REDES" | tee -a "$REPORT"
docker inspect "$CONTAINER" \
  --format '{{range $net, $cfg := .NetworkSettings.Networks}}Rede: {{$net}} | IP: {{$cfg.IPAddress}}{{"\n"}}{{end}}' \
  | tee -a "$REPORT"

echo "VARIÁVEIS DE AMBIENTE (mascaradas)" | tee -a "$REPORT"
docker inspect "$CONTAINER" \
  --format '{{range .Config.Env}}{{.}}{{"\n"}}{{end}}' \
  | sed 's/\(PASSWORD\|SECRET\|KEY\|TOKEN\)=.*/\1=***MASKED***/gi' \
  | tee -a "$REPORT"

echo "" | tee -a "$REPORT"
echo "USO DE RECURSOS (snapshot)" | tee -a "$REPORT"
docker stats "$CONTAINER" --no-stream --format \
  "CPU: {{.CPUPerc}} | Mem: {{.MemUsage}} ({{.MemPerc}}) | Net I/O: {{.NetIO}} | Block I/O: {{.BlockIO}}" \
  | tee -a "$REPORT"

echo "" | tee -a "$REPORT"
echo "ÚLTIMAS 100 LINHAS DE LOG" | tee -a "$REPORT"
docker logs --tail 100 --timestamps "$CONTAINER" 2>&1 | tee -a "$REPORT"

echo "" | tee -a "$REPORT"
echo "PROCESSOS INTERNOS" | tee -a "$REPORT"
docker exec "$CONTAINER" ps aux 2>/dev/null | tee -a "$REPORT" || echo "(ps não disponível)" | tee -a "$REPORT"

echo ""
echo "Relatório salvo em: $REPORT"