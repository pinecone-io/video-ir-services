import { Kafka, Partitioners, Producer, logLevel } from 'kafkajs';

const KAFKA_BROKER = "kafka-dev"

class KafkaProducer {
    private producer: Producer;
    private topic: string;
    private isConnected: boolean;

    constructor(topic: string) {
        const kafka = new Kafka({
            clientId: 'producer-service',
            brokers: [`${KAFKA_BROKER}:9092`],
            logLevel: logLevel.INFO
        });

        this.producer = kafka.producer({
            createPartitioner: Partitioners.LegacyPartitioner
        });

        this.topic = topic;
        this.isConnected = false;

    }

    private async connect() {
        try {
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

            await this.producer.send({
                topic: this.topic,
                messages: messages.map((message: string) => ({
                    value: message,
                    key: message
                })),
            });
            console.log("sent messages", messages)
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