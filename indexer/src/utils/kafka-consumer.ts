import { Kafka, Consumer, KafkaMessage, logLevel } from "kafkajs";


const KAFKA_BROKER = "kafka-dev"

async function createKafkaConsumer(messageHandler: (message: KafkaMessage) => void): Promise<Consumer> {
    const kafka = new Kafka({
        clientId: "consumer-service",
        brokers: [`${KAFKA_BROKER}:9092`],
        logLevel: logLevel.INFO

    });
    const topic = "topic-4";
    const consumerGroupId = "group-1"; // This has to be the same for all consumers
    const consumer = kafka.consumer({ groupId: consumerGroupId });

    try {
        await consumer.connect();
        await consumer.subscribe({ topic, fromBeginning: false });
        console.log("Connected and subscribed to Kafka")
        await consumer.run({
            eachBatch: async ({ batch, resolveOffset, heartbeat, isRunning, isStale }) => {
                for (let message of batch.messages) {
                    console.log(message?.value?.toString());

                    if (!isRunning() || isStale()) { // This ensures we're not handling messages that were already handled 
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
