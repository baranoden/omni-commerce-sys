const DEFAULT_KAFKA_BROKERS = ['127.0.0.1:9092'];

export function getKafkaBrokers() {
  const brokers = process.env.KAFKA_BROKERS;

  if (!brokers) {
    return DEFAULT_KAFKA_BROKERS;
  }

  return brokers
    .split(',')
    .map((broker) => broker.trim())
    .filter(Boolean);
}

export function getKafkaClientId(serviceName: string) {
  return process.env.KAFKA_CLIENT_ID_PREFIX
    ? `${process.env.KAFKA_CLIENT_ID_PREFIX}-${serviceName}`
    : `omni-commerce-${serviceName}`;
}
