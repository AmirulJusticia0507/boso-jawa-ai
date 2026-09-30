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

Jalankan backend di port `8000`, lalu buka Grafana di <http://localhost:3300> dengan akun lokal `admin` / `admin`. Dashboard metrik tersedia di folder **Boso Jawa** dan trace dapat dicari melalui datasource **Tempo**.

Prometheus memuat alert untuk API down, error rate di atas 1%/5%, dan P95 latency di atas 1 detik. Status rule dapat diperiksa di <http://localhost:9090/alerts>, sedangkan Alertmanager tersedia di <http://localhost:9093>.

Receiver bawaan mengirim payload JSON ke `http://host.docker.internal:5001/alerts`. Ganti URL pada `alertmanager.yml` dengan endpoint webhook operasional Anda, lalu jalankan ulang `docker compose up -d`. Jangan menaruh token rahasia langsung di repository.
