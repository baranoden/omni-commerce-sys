# omni-commerce-sys

Basitleştirilmiş omni-commerce demo projesi.

Aktif senaryo 4 servis üzerine kuruludur:

- `auth-service`: kayıt, giriş, JWT
- `products-service`: ürün kataloğu, stok ve rezervasyon
- `order-service`: sipariş oluşturma, kullanıcının kendi siparişlerini listeleme, ödeme orkestrasyonu
- `payment-service`: ödeme kaydı ve ödeme işleme
- `mock-payment-service` / `mock-stock-service`: hata senaryoları ve legacy testler için mock servisler

HTTP giriş noktası `api-gateway` servisidir.

## Aktif akış

1. Kullanıcı kayıt olur ve giriş yapar.
2. Kullanıcı `POST /orders` ile sipariş oluşturur.
3. Sipariş oluşturulurken ürün bilgileri `products-service` üzerinden doğrulanır.
4. Kullanıcı `GET /orders` ile sadece kendi siparişlerini görür.
5. Kullanıcı `POST /orders/:id/pay` ile Kafka tabanlı ödeme sürecini başlatır.
6. `products-service` `order.created` event'i ile stok rezervasyonu yapar.
7. `payment-service` `stock.reserved` event'i ile ödemeyi işler.
8. `payment.failed` gelirse sipariş `FAILED`, `payment.completed` gelirse sipariş `COMPLETED` olur.

## Servisler

- `api-gateway`: `http://localhost:8080`
- `auth-service`: TCP `4002`
- `products-service`: TCP `4006`
- `mock-stock-service`: TCP `4001`
- `order-service`: TCP `4003`
- `payment-service`: TCP `4004`
- `mock-payment-service`: TCP `4005`
- Kafka UI: `http://localhost:8081`

## Veritabanları

- `auth_db`
- `order_db`
- `payment_db`

Docker Compose ile PostgreSQL ve servisler otomatik ayağa kalkar.

## Hızlı başlangıç

### Kurulum

```bash
npm install
```

### Tüm sistemi Docker ile çalıştırma

```bash
docker compose up --build -d
```

Normal yeniden açılış için:

```bash
docker compose up -d
```

Kapatmak için:

```bash
docker compose down
```

Verilerle birlikte sıfırlamak için:

```bash
docker compose down -v
```

## Geliştirme komutları

```bash
npm run build
npm run start:dev
npm run start:auth:dev
npm run start:products:dev
npm run start:order:dev
npm run start:payment:dev
npm run start:mock-payment:dev
npm run start:mock-stock:dev
```

## API özeti

### Auth

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/profile`

### Orders

- `POST /orders`
- `GET /orders`
- `GET /orders/:id`
- `POST /orders/:id/pay`

Tüm sipariş endpoint'leri JWT korumalıdır.

## Örnek istekler

### Sipariş oluşturma

```json
{
  "items": [{ "productId": 1, "quantity": 2 }],
  "paymentMethodToken": "card-ok-demo"
}
```

### Siparişi ödeme

Başarılı ödeme:

```json
{}
```

Ödeme hatası:

```json
{
  "simulatePaymentFailure": true
}
```

Stok hatası:

```json
{
  "simulateStockFailure": true
}
```

## Test senaryoları

- Başarılı ödeme: `paymentMethodToken = card-ok-demo`
- Token üzerinden ödeme hatası: `paymentMethodToken` içinde `fail` veya `reject`
- Manuel ödeme hatası: `simulatePaymentFailure = true`
- Manuel stok hatası: `simulateStockFailure = true`

## Postman

Hazır dosyalar:

- [postman/omni-commerce-sys.postman_collection.json](postman/omni-commerce-sys.postman_collection.json)
- [postman/omni-commerce-sys.local.postman_environment.json](postman/omni-commerce-sys.local.postman_environment.json)

Önerilen sıra:

1. `POST /auth/register`
2. `POST /auth/login`
3. `POST /orders`
4. `POST /orders/:id/pay`
5. `GET /orders/:id`

## Gözlemlenebilirlik

- Metrics: `GET /metrics`
- Prometheus örneği: [observability/prometheus.yml](observability/prometheus.yml)
- OTel collector örneği: [observability/otel-collector-config.yaml](observability/otel-collector-config.yaml)

## Notlar

- Depoda eski veya deneysel klasörler bulunabilir; aktif akış yukarıdaki sade mimaridir.
- Sipariş/ödeme akışı için Kafka topic zinciri `order.created -> stock.reserved|stock.failed -> payment.completed|payment.failed` olarak çalışır.
