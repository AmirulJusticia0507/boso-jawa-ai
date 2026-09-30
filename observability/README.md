# Observability lokal

Jalankan Prometheus, Tempo, dan Grafana:

```bash
docker compose -f observability/docker-compose.yml up -d
```

Aktifkan tracing pada `backend/.env`:

```env
OTEL_TRACING_ENABLED=true
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces
OTEL_SERVICE_NAME=boso-jawa-api
```

Jalankan backend di port `8000`, lalu buka Grafana di <http://localhost:3001> dengan akun lokal `admin` / `admin`. Dashboard metrik tersedia di folder **Boso Jawa** dan trace dapat dicari melalui datasource **Tempo**.
