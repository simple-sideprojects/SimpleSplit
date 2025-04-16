FROM python:3.10-alpine

WORKDIR /app

COPY requirements.txt .

RUN pip install -r requirements.txt

COPY app app
COPY alembic alembic
COPY alembic.ini .
COPY entrypoint.sh .

RUN chmod +x ./entrypoint.sh

ENV PROD=true

ENTRYPOINT ["./entrypoint.sh"]