import { Kafka, Consumer, KafkaMessage } from "kafkajs";

async function createKafkaConsumer(topic: string, messageHandler: (message: KafkaMessage) => void): Promise<Consumer> {
    const kafka = new Kafka({
        clientId: "my-app",
        brokers: ["localhost:9093"],
    });

    const consumer = kafka.consumer({ groupId: "test-group-3" });

    await consumer.connect();
    await consumer.subscribe({ topic, fromBeginning: false });
    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            console.log("Received message")
            messageHandler(message);
        },
    });
    return consumer;
}

export { createKafkaConsumer }
