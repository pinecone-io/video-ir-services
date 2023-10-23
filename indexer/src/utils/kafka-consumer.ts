import { Kafka, Consumer, KafkaMessage, logLevel } from "kafkajs";


const KAFKA_BROKER = "localhost"

async function createKafkaConsumer(topic: string, messageHandler: (message: KafkaMessage) => void): Promise<Consumer> {
    const kafka = new Kafka({
        clientId: "consumer-service",
        brokers: [`${KAFKA_BROKER}:9092`],
        logLevel: logLevel.DEBUG
    });

    const consumer = kafka.consumer({ groupId: "test-group-3" });

    console.log("KAFKA CONSUMER", kafka)
    console.log("CONSUMER", consumer)

    try {
        await consumer.connect();
        await consumer.subscribe({ topic, fromBeginning: false });
        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                console.log("Received message")
                messageHandler(message);
            },
        });
    } catch (e) {
        console.log("Failed connecting to Kafka", e)
    }
    return consumer;
}

export { createKafkaConsumer }
