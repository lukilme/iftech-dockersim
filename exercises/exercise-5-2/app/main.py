import json
import logging
import os
import time

import psycopg2
import redis

from pythonjsonlogger import jsonlogger

logger = logging.getLogger()
handler = logging.StreamHandler()
handler.setFormatter(jsonlogger.JsonFormatter())
logger.addHandler(handler)
logger.setLevel(logging.INFO)

DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")

POSTGRES_DB = os.getenv("POSTGRES_DB")
POSTGRES_USER = os.getenv("POSTGRES_USER")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD")

REDIS_HOST = os.getenv("REDIS_HOST")
REDIS_PORT = int(os.getenv("REDIS_PORT"))

# irá enviar requisições até obter uma resposta aceitável do DB
while True:
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            database=POSTGRES_DB,
            user=POSTGRES_USER,
            password=POSTGRES_PASSWORD,
        )
        break
    except Exception:
        logger.info("aguardando postgres...")
        time.sleep(3)

r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT)

logger.info("Serviços conectados")

counter = 1

while True:
    event = f"evento-{counter}"

    r.lpush("events", event)
    logger.info({"action": "enqueue","event": event})
    data = r.rpop("events")

    if data:

        value = data.decode()
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO events(message) VALUES (%s)",
                (value,)
            )
            conn.commit()

        logger.info({"action": "persist","event": value})

    counter += 1
    time.sleep(5)