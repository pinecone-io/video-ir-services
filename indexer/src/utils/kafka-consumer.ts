import { Kafka, Consumer, KafkaMessage, logLevel } from "kafkajs";
import retry from 'async-retry';


const KAFKA_BROKER = "kafka-dev"

async function createKafkaConsumer(topic: string, messageHandler: (message: KafkaMessage) => void): Promise<Consumer> {
    const kafka = new Kafka({
        clientId: "consumer-service",
        brokers: [`${KAFKA_BROKER}:9092`],
        logLevel: logLevel.INFO
        // logCreator: logLevel => {
        //     return ({ namespace, level, label, log }) => {
        //         const { message, ...rest } = log
        //         console.log(`${label} [${namespace}] ${message} ${JSON.stringify(rest, null, 4)}`)
        //     }
        // }
    });

    const consumer = kafka.consumer({ groupId: "test-group" });


    try {

        console.log("Attempting to connect to Kafka");

        // await retry(async (bail, attemptNumber) => {
        //     console.log("consumer", consumer)
        //     try {
        //         await consumer.connect();
        //         const groupDescription = await consumer.describeGroup();
        //         console.log("groupDescription", groupDescription)
        //         if (groupDescription.state === 'Dead') {
        //             throw new Error('Group is in Dead state');
        //         }
        //     } catch (error: any) {
        //         console.log(`Attempt ${attemptNumber} failed.`);
        //         if (attemptNumber === 5) {
        //             bail(error); // If the group is still in 'Dead' state after 5 attempts, stop retrying
        //         } else {
        //             throw error;
        //         }
        //     }
        // }, {
        //     retries: 10
        // });
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
