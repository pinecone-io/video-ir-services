import { Kafka, Consumer, KafkaMessage, logLevel } from "kafkajs";
import retry from 'async-retry';
import { POD_NAME } from "./environment";


const KAFKA_BROKER = "kafka-dev"

async function createKafkaConsumer(messageHandler: (message: KafkaMessage) => void): Promise<Consumer> {
    const kafka = new Kafka({
        clientId: "consumer-service",
        brokers: [`${KAFKA_BROKER}:9092`],
        logLevel: logLevel.INFO

    });
    const topics = ["topic-0", "topic-1"]

    const consumerGroupId = `group-1`; // Assuming POD_NAME is unique for each consumer
    const consumer = kafka.consumer({ groupId: consumerGroupId });

    try {
        await consumer.connect();

        for (const topic of topics) {
            const groupDescription = await consumer.describeGroup();
            console.log("Group description", groupDescription)
            if (groupDescription.members.length === 0) {
                // No active consumers in this group, so start consuming from this topic
                console.log("Starting to consume from topic", topic);
                await consumer.subscribe({ topic, fromBeginning: false });
                await consumer.run({
                    eachMessage: async ({ topic, partition, message }) => {
                        console.log("Received message", message?.value?.toString())
                        messageHandler(message);
                    },
                });
                break; // Exit the loop as we've found a topic to consume from
            }
        }
    } catch (e) {
        console.log("Failed connecting to Kafka", e)
    }

    return consumer;
}

export { createKafkaConsumer }
