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

- Uygulama: `http://localhost:3000`
- Prometheus metrics: `http://localhost:3000/metrics`

## Mikroservis mimarisi

Proje artık iki ayrı servis olacak şekilde kurgulandı:

- `api-gateway`: HTTP isteklerini alır ve auth / ürün operasyonlarını ilgili mikroservislere iletir.
- `auth-service`: Kayıt, giriş, JWT üretimi ve kullanıcı profil işlemlerini TCP üzerinden çalıştırır.
- `products-service`: Ürün CRUD operasyonlarını TCP üzerinden çalıştırır.

### Klasör yapısı

- `apps/api-gateway`: HTTP gateway
- `apps/auth-service`: auth mikroservisi
- `apps/products-service`: ürün mikroservisi

Eski kök `src` altındaki `auth` ve `products` klasörleri artık kullanılmıyor.

### Ayrı veritabanları

- Auth / kullanıcı verileri için varsayılan veritabanı: `auth_db`
- Ürün verileri için varsayılan veritabanı: `products_db`

İsterseniz bunları ortam değişkenleriyle değiştirebilirsiniz:

- `AUTH_DB_HOST`, `AUTH_DB_PORT`, `AUTH_DB_USERNAME`, `AUTH_DB_PASSWORD`, `AUTH_DB_NAME`
- `AUTH_SERVICE_HOST`, `AUTH_SERVICE_TCP_PORT`
- `PRODUCTS_DB_HOST`, `PRODUCTS_DB_PORT`, `PRODUCTS_DB_USERNAME`, `PRODUCTS_DB_PASSWORD`, `PRODUCTS_DB_NAME`
- `PRODUCTS_SERVICE_HOST`, `PRODUCTS_SERVICE_TCP_PORT`
- `JWT_SECRET`, `JWT_EXPIRES_IN`

### Çalıştırma

Önce iki PostgreSQL veritabanını oluşturun:

- `auth_db`
- `products_db`

Sonra servisleri ayrı terminallerde başlatın:

```bash
npm run start:dev
npm run start:auth:dev
npm run start:products:dev
```

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
