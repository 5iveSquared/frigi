FROM python:3.11-slim

WORKDIR /app

RUN pip install uv

COPY requirements.txt .
RUN uv pip install --system -r requirements.txt

COPY . .

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}"]
