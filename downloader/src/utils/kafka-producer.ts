import { Kafka, Partitioners, Producer, logLevel } from 'kafkajs';

const KAFKA_BROKER = "kafka"

class KafkaProducer {
    private producer: Producer;
    private topic: string;

    constructor(topic: string) {
        const kafka = new Kafka({
            clientId: 'producer-service',
            brokers: [`${KAFKA_BROKER}:9092`],
            logLevel: logLevel.DEBUG
        });

        this.producer = kafka.producer({
            createPartitioner: Partitioners.LegacyPartitioner
        });

        this.topic = topic;
        this.connect();
    }

    private async connect() {
        try {
            await this.producer.connect();
        } catch (error) {
            console.error('Error connecting to Kafka:', error);
        }
    }

    async sendMessages(messages: string[]) {
        try {
            await this.producer.send({
                topic: this.topic,
                messages: messages.map((message: string) => ({
                    value: message,
                    key: message
                })),
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