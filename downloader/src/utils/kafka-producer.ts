import { Admin, Kafka, Partitioners, Producer, logLevel } from 'kafkajs';

const KAFKA_BROKER = "kafka-dev"

class KafkaProducer {
    private producer: Producer;
    private admin: Admin;
    private topics: string[];
    private isConnected: boolean;

    constructor() {
        const kafka = new Kafka({
            clientId: 'producer-service',
            brokers: [`${KAFKA_BROKER}:9092`],
            logLevel: logLevel.INFO
        });

        this.producer = kafka.producer({
            createPartitioner: Partitioners.LegacyPartitioner
        });
        this.admin = kafka.admin();
        this.topics = ["topic-0", "topic-1"];
        this.isConnected = false;
    }

    private async createTopics() {
        console.log("creating topics")
        await this.admin.connect();
        for (const topic of this.topics) {
            await this.admin.createTopics({
                topics: [{ topic, numPartitions: 3 }],
            });
        }
        await this.admin.disconnect();
    }

    private async connect() {
        try {
            await this.createTopics();
            await this.producer.connect();
            this.isConnected = true; // Update after successful connection
            console.log("Connected to Kafka")
        } catch (error) {
            console.error('Error connecting to Kafka:', error);
        }
    }

    async sendMessages(messages: string[]) {
        try {
            // Check if the producer is connected before sending messages
            if (!this.isConnected) {
                await this.connect();
            }

            for (let i = 0; i < messages.length; i++) {
                const message = messages[i];
                const index = i % this.topics.length;
                const topic = this.topics[index];
                console.log(`Message index: ${i}, Topic index: ${index}, Topic: ${topic}`);
                await this.producer.send({
                    topic: topic!,
                    messages: [{
                        value: message!,
                    }],
                });
                console.log("sent message", message)
            }
        } catch (error) {
            console.error('Error sending messages to Kafka:', error);
        }
    }

    async disconnect() {
        try {
            await this.producer.disconnect();
        } catch (error) {
            console.error('Error disconnecting from Kafka:', error);
        }
    }
}

export { KafkaProducer };