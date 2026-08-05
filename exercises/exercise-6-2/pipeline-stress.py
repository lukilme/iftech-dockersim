import os
import time
import logging
import sys

logging.basicConfig(
    level=logging.INFO,
    format='{"time": "%(asctime)s", "level": "%(levelname)s", "msg": "%(message)s"}',
    stream=sys.stdout
)
log = logging.getLogger(__name__)

CHUNK_SIZE_MB = int(os.getenv("CHUNK_SIZE_MB", "50"))
MAX_CHUNKS    = int(os.getenv("MAX_CHUNKS", "10"))

chunks = []
for i in range(1, MAX_CHUNKS + 1):
    chunk = " " * (CHUNK_SIZE_MB * 1024 * 1024)  # aloca N MB
    chunks.append(chunk)
    total_mb = i * CHUNK_SIZE_MB
    log.info(f"Chunk {i}/{MAX_CHUNKS} processado — Total em memória: {total_mb}MB")
    time.sleep(1)

log.info("Pipeline concluído sem OOM.")