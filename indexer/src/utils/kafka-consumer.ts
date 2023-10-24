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
    const topics = ["topic-0"]

    const consumerGroupId = `group-1`; // Assuming POD_NAME is unique for each consumer
    const consumer = kafka.consumer({ groupId: consumerGroupId });

    try {
        await consumer.connect();
        await consumer.subscribe({ topic: topics[0]!, fromBeginning: false });
        await consumer.run({
            // eachMessage: async ({ topic, partition, message }) => {
            //     console.log("Received message", message?.value?.toString())
            //     messageHandler(message);
            // },

            eachBatch: async ({ batch, resolveOffset, heartbeat, isRunning, isStale }) => {
                for (let message of batch.messages) {
                    console.log(message?.value?.toString());

                    if (!isRunning() || isStale()) {
                        break;
                    }

                    await messageHandler(message);
                    resolveOffset(message.offset);
                    await heartbeat();
                }
            }
        });

    } catch (e) {
        console.log("Failed connecting to Kafka", e)
    }

    return consumer;
}

export { createKafkaConsumer }
