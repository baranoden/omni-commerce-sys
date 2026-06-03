<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Observability

Uygulama artık gözlemlenebilirlik için şu bileşenleri içerir:

- ELK uyumlu yapılandırılmış JSON loglar (`nestjs-pino` / `pino`)
- Prometheus metrik endpoint'i (`/metrics`)
- OpenTelemetry tracing (OTLP HTTP exporter)
- Prometheus ve OpenTelemetry için örnek konfigürasyon dosyaları [observability/prometheus.yml](observability/prometheus.yml) ve [observability/otel-collector-config.yaml](observability/otel-collector-config.yaml)

### Ortam değişkenleri

- `LOG_LEVEL=info`
- `NODE_ENV=development`
- `OTEL_SERVICE_NAME=omni-commerce-sys`
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://localhost:4318/v1/traces`
- `OTEL_EXPORTER_OTLP_HEADERS=authorization=Bearer token`

### Endpoint'ler

- Uygulama: `http://localhost:8080`
- Prometheus metrics: `http://localhost:8080/metrics`

## Mikroservis mimarisi

Sipariş tarafı basitleştirildi. Aktif akış artık şu servislerle çalışır:

- `api-gateway`: HTTP isteklerini alır ve TCP ile diğer servislere yönlendirir.
- `auth-service`: Kayıt, giriş ve JWT işlemlerini yönetir.
- `order-service`: Siparişi oluşturur, kullanıcının sadece kendi siparişlerini döner ve ödeme akışını orkestre eder.
- `payment-service`: Ödeme kaydını tutar ve mock ödeme servisini çağırır.
- `mock-payment-service`: İstenirse ödeme hatası döner.
- `mock-stock-service`: İstenirse `Stok yok` hatası döner.

### Basit sipariş akışı

1. Kullanıcı `POST /orders` ile `PENDING` durumda sipariş oluşturur.
2. Kullanıcı `GET /orders` ile sadece kendi siparişlerini görür.
3. Kullanıcı `POST /orders/:id/pay` ile bir siparişi öder.
4. `order-service` önce `mock-stock-service` çağrısı yapar.
5. Stok başarısızsa sipariş `FAILED` olur ve sebep `Stok yok` olarak kaydedilir.
6. Stok başarılıysa `order-service`, `payment-service` çağrısı yapar.
7. `payment-service`, `mock-payment-service` çağrısı yapar.
8. Ödeme başarısızsa sipariş `FAILED` olur.
9. Ödeme başarılıysa sipariş `COMPLETED` olur.

`POST /orders/:id/pay` çağrısında test amaçlı şu alanlar gönderilebilir:

- `simulatePaymentFailure: true`
- `simulateStockFailure: true`

### Klasör yapısı

- `apps/api-gateway`: HTTP gateway
- `apps/auth-service`: auth mikroservisi
- `apps/order-service`: sipariş mikroservisi
- `apps/payment-service`: ödeme mikroservisi
- `apps/mock-payment-service`: ödeme hatası üreten mock servis
- `apps/mock-stock-service`: stok hatası üreten mock servis

Eski kök `src` altındaki `auth` ve `products` klasörleri artık kullanılmıyor.

### Ayrı veritabanları

- Auth / kullanıcı verileri için varsayılan veritabanı: `auth_db`
- Sipariş verileri için varsayılan veritabanı: `order_db`
- Ödeme verileri için varsayılan veritabanı: `payment_db`

İsterseniz bunları ortam değişkenleriyle değiştirebilirsiniz:

- `AUTH_DB_HOST`, `AUTH_DB_PORT`, `AUTH_DB_USERNAME`, `AUTH_DB_PASSWORD`, `AUTH_DB_NAME`
- `AUTH_SERVICE_HOST`, `AUTH_SERVICE_TCP_PORT`
- `ORDER_DB_HOST`, `ORDER_DB_PORT`, `ORDER_DB_USERNAME`, `ORDER_DB_PASSWORD`, `ORDER_DB_NAME`
- `ORDER_SERVICE_HOST`, `ORDER_SERVICE_TCP_PORT`
- `PAYMENT_DB_HOST`, `PAYMENT_DB_PORT`, `PAYMENT_DB_USERNAME`, `PAYMENT_DB_PASSWORD`, `PAYMENT_DB_NAME`
- `PAYMENT_SERVICE_HOST`, `PAYMENT_SERVICE_TCP_PORT`
- `MOCK_PAYMENT_SERVICE_HOST`, `MOCK_PAYMENT_SERVICE_TCP_PORT`
- `MOCK_STOCK_SERVICE_HOST`, `MOCK_STOCK_SERVICE_TCP_PORT`
- `KAFKA_BROKERS` (örn. `localhost:9092` veya `localhost:9092,localhost:9093`)
- `KAFKA_CLIENT_ID_PREFIX`
- `API_GATEWAY_KAFKA_GROUP_ID`
- `AUTH_EVENTS_KAFKA_GROUP_ID`
- `PRODUCT_EVENTS_KAFKA_GROUP_ID`
- `ORDER_EVENTS_KAFKA_GROUP_ID`
- `PAYMENT_EVENTS_KAFKA_GROUP_ID`
- `JWT_SECRET`, `JWT_EXPIRES_IN`

### Çalıştırma

Önce üç PostgreSQL veritabanını oluşturun:

- `auth_db`
- `order_db`
- `payment_db`

Kafka kullanıldığı için broker'ın da ayağa kalkması gerekir. Uygulama varsayılan olarak `127.0.0.1:9092` adresine bağlanmaya çalışır. `ECONNREFUSED 127.0.0.1:9092` hatası, bu adreste çalışan bir Kafka broker bulunmadığını gösterir.

#### Kafka'yı Docker ile başlatma

Projeye yerel geliştirme için bir Docker Compose dosyası eklendi: [docker-compose.yml](docker-compose.yml)

Kafka ve arayüzünü başlatmak için:

```bash
docker compose up -d
```

Kontrol etmek için:

```bash
docker compose ps
```

İsterseniz arayüze şu adresten bakabilirsiniz:

- Kafka UI: `http://localhost:8081`

Kapatmak için:

```bash
docker compose down
```

Veriyi de silmek isterseniz:

```bash
docker compose down -v
```

#### Tüm sistemi tek komutla ayağa kaldırma

Artık tüm proje Docker ile birlikte ayağa kaldırılabilir. Aşağıdaki servisler tek compose dosyasında tanımlıdır:

- `api-gateway`
- `auth-service`
- `order-service`
- `payment-service`
- `mock-payment-service`
- `mock-stock-service`
- `auth-db`
- `order-db`
- `payment-db`
- `kafka`
- `kafka-ui`

İlk kurulum veya image'ları yeniden oluşturmak için:

```bash
docker compose up --build -d
```

Sonraki normal açılışlarda çoğunlukla şu yeterlidir:

```bash
docker compose up -d
```

Logları izlemek için:

```bash
docker compose logs -f
```

Sadece gateway loglarını izlemek için:

```bash
docker compose logs -f api-gateway
```

Bu kurulumdan sonra uygulama uçları şunlardır:

- API Gateway: `http://localhost:8080`
- Kafka UI: `http://localhost:8081`
- Auth TCP: `localhost:4002`
- Mock Stock TCP: `localhost:4001`
- Order TCP: `localhost:4003`
- Payment TCP: `localhost:4004`
- Mock Payment TCP: `localhost:4005`
- Auth PostgreSQL: `localhost:5433`
- Order PostgreSQL: `localhost:5435`
- Payment PostgreSQL: `localhost:5436`

Sistemi kapatmak için:

```bash
docker compose down
```

Tüm volume'leri de temizlemek için:

```bash
docker compose down -v
```

#### Hangi durumda hangi komut?

Günlük kullanım için pratik özet:

- İlk kez ayağa kaldırma veya Dockerfile / bağımlılık değiştiyse:

```bash
docker compose up --build -d
```

- Normal açma:

```bash
docker compose up -d
```

- Sadece durdurma, container'ları silmeden:

```bash
docker compose stop
```

- Durdurulan container'ları tekrar başlatma:

```bash
docker compose start
```

- Tam kapatma ve container/network temizleme:

```bash
docker compose down
```

- Tam sıfırlama, veritabanı ve Kafka verileri dahil her şeyi silme:

```bash
docker compose down -v
```

- Image'ları da temizlemek isterseniz:

```bash
docker compose down -v --rmi local
```

- Durumu kontrol etme:

```bash
docker compose ps
```

- Tüm loglar:

```bash
docker compose logs -f
```

- Tek servis logu:

```bash
docker compose logs -f api-gateway
docker compose logs -f auth-service
docker compose logs -f products-service
docker compose logs -f order-service
docker compose logs -f payment-service
docker compose logs -f kafka
```

Önerilen akış:

- Her gün çalışırken: `docker compose up -d`
- İş bitince: `docker compose down`
- Veriyi tamamen temizlemek istediğinizde: `docker compose down -v`
- Kod veya Docker yapılandırması değiştiyse: `docker compose up --build -d`

Sonra servisleri ayrı terminallerde başlatın:

```bash
npm run start:dev
npm run start:auth:dev
npm run start:products:dev
npm run start:order:dev
npm run start:payment:dev
```

Kafka broker'ı da çalışıyor olmalıdır. Varsayılan topic kullanımları:

- `auth.user.registered`
- `auth.user.logged_in`
- `catalog.product.created`
- `catalog.product.updated`
- `catalog.product.deleted`
- `catalog.stock.decremented`
- `catalog.stock.incremented`
- `stock.reserved`
- `stock.decreased`
- `stock.released`
- `stock.failed`
- `order.created`
- `order.completed`
- `order.failed`
- `payment.completed`
- `payment.failed`
- `payment.circuit.opened`

`api-gateway`, bu event'leri Kafka üzerinden tüketip merkezi log akışına ekler.

### Sipariş endpoint'leri

Tüm sipariş endpoint'leri JWT korumalıdır.

- `POST /orders`
- `GET /orders`
- `GET /orders/:id`

Örnek sipariş isteği:

```json
{
  "items": [
    { "productId": 1, "quantity": 2 },
    { "productId": 4, "quantity": 1 }
  ],
  "paymentMethodToken": "card-ok-demo"
}
```

Sipariş oluşturma çağrısı ilk aşamada genelde `PENDING` sipariş döner. Son durumu görmek için aynı siparişi `GET /orders/:id` ile tekrar okuyun.

Örnek durumlar:

- Başarılı ödeme: `paymentMethodToken = card-ok-demo`
- Başarısız ödeme: `paymentMethodToken` içinde `fail` veya `reject`
- Yavaş ödeme: `paymentMethodToken` içinde `slow`
- Stok yetersizliği: mevcut stoktan büyük bir `quantity`

Aynı hata peş peşe belirlenen eşik kadar tekrarlandığında ödeme servisi circuit breaker açar ve yeni istekleri geçici olarak reddeder. Bu durumda da saga akışı `FAILED` ile tamamlanır.

### Ürün endpoint'leri

Tüm ürün endpoint'leri JWT korumalıdır.

- `POST /products`
- `GET /products`
- `GET /products/:id`
- `PATCH /products/:id`
- `DELETE /products/:id`

Örnek ürün payload'ı:

```json
{
  "name": "Kablosuz Mouse",
  "description": "Sessiz tıklamalı ergonomik mouse",
  "price": 799.99,
  "stock": 25,
  "sku": "MOUSE-001",
  "isActive": true
}
```

### Grafana / Prometheus notu

Prometheus, [observability/prometheus.yml](observability/prometheus.yml) içindeki scrape ayarıyla uygulamanın `/metrics` endpoint'ini toplayabilir. Grafana tarafında veri kaynağı olarak Prometheus eklenerek dashboard oluşturulabilir.

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
