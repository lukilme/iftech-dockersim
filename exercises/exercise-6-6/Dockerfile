FROM python:3.12-slim

RUN useradd -m -s /bin/bash appuser

WORKDIR /app

COPY app.py .

USER appuser

CMD ["python", "app.py"]