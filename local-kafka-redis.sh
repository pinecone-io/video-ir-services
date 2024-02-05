# Start Zookeeper
docker run -d --name local-zookeeper -p 2181:2181 zookeeper

# Start Kafka
docker run -d --name local-kafka -p 9092:9092 -e KAFKA_BROKER_ID=1 -e KAFKA_ZOOKEEPER_CONNECT=host.docker.internal:2181 -e KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://localhost:9092 -e KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR=1 confluentinc/cp-kafka

# Start Kafka UI
docker run -d --name kafka-ui -p 8080:8080 -e KAFKA_CLUSTERS_0_NAME=local -e KAFKA_CLUSTERS_0_BOOTSTRAPSERVERS=localhost:9092 -e KAFKA_CLUSTERS_0_ZOOKEEPER=localhost:2181 provectuslabs/kafka-ui

docker run -d --name local-redis -p 6379:6379 redis




