import { Admin, Kafka, Partitioners, Producer, logLevel } from 'kafkajs';
import { log, trackFile } from './logger';

const KAFKA_BROKER = "kafka-dev"

class KafkaProducer {
    private producer: Producer;
    private admin: Admin;
    private topic: string;
    private isConnected: boolean;

    constructor() {
        const kafka = new Kafka({
            clientId: 'producer-service',
            brokers: [`${KAFKA_BROKER}:9092`],
            logLevel: logLevel.INFO
        });

        this.producer = kafka.producer({
            createPartitioner: Partitioners.DefaultPartitioner
        });
        this.admin = kafka.admin();
        this.topic = "topic-2";
        this.isConnected = false;
    }

    private async createTopics() {
        console.log("creating topics")
        await this.admin.connect();
        await this.admin.createTopics({
            topics: [{ topic: this.topic, numPartitions: 6 }],
        });
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

    async sendMessage(message: string) {
        // Generate a random key
        const key = Math.random().toString(36).substring(2);
        try {
            // Check if the producer is connected before sending messages
            if (!this.isConnected) {
                await this.connect();
            }
            const topic = this.topic;
            await log(`Sending message: ${message}`);
            await trackFile(message)
            await this.producer.send({
                topic: topic!,
                messages: [{
                    value: message!,
                    key
                }],
            });
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