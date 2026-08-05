FROM python:3.12-slim
WORKDIR /app
ENV DB_PASSWORD=supersecret
ENV APP_ENV=production
CMD ["python", "-c", "import time; [print(f'Processando batch {i}') or time.sleep(2) for i in range(999)]"]