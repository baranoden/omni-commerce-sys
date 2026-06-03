FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . ./

ARG APP_NAME
RUN npx nest build ${APP_NAME}


FROM node:20-alpine AS runner

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

ARG APP_NAME
ENV APP_NAME=${APP_NAME}
ENV NODE_ENV=production

COPY --from=builder /app/dist/${APP_NAME} ./dist/${APP_NAME}

EXPOSE 3000 4001 4002 4003 4004

CMD ["sh", "-c", "node dist/$APP_NAME/main.js"]