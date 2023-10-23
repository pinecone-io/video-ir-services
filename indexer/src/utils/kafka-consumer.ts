import { Kafka, Consumer, KafkaMessage, logLevel } from "kafkajs";


const KAFKA_BROKER = "kafka-dev"

async function createKafkaConsumer(topic: string, messageHandler: (message: KafkaMessage) => void): Promise<Consumer> {
    const kafka = new Kafka({
        clientId: "consumer-service",
        brokers: [`${KAFKA_BROKER}:9092`],
        logLevel: logLevel.DEBUG,
        logCreator: logLevel => {
            return ({ namespace, level, label, log }) => {
                const { message, ...rest } = log
                console.log(`${label} [${namespace}] ${message} ${JSON.stringify(rest, null, 4)}`)
            }
        }
    });

    const consumer = kafka.consumer({ groupId: "test-group-" + Math.random() });


    try {
        await consumer.connect();
        console.log("Connected to Kafka", await consumer.describeGroup())
        await consumer.subscribe({ topic, fromBeginning: false });
        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                console.log("Received message", message?.value?.toString())
                messageHandler(message);
            },
        });
    } catch (e) {
        console.log("Failed connecting to Kafka", e)
    }
    return consumer;
}

export { createKafkaConsumer }
