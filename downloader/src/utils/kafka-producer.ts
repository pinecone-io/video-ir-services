import { Admin, Kafka, Partitioners, Producer, logLevel } from 'kafkajs';

const KAFKA_BROKER = "kafka-dev"

class KafkaProducer {
    private producer: Producer;
    private admin: Admin;
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
        this.admin = kafka.admin();
        this.topic = topic;
        this.isConnected = false;

    }

    private async createTopic() {
        console.log("creating topics")
        await this.admin.connect();
        await this.admin.createTopics({
            topics: [{ topic: this.topic, numPartitions: 3 }],
        });

        const topicMetadata = await this.admin.fetchTopicMetadata({ topics: [this.topic] });
        console.log(topicMetadata);
        await this.admin.disconnect();
    }

    private async connect() {
        try {
            await this.createTopic();
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
                const key = `key-${i}`; // Change this to assign messages to specific partitions

                await this.producer.send({
                    topic: this.topic,
                    messages: [{
                        value: message!,
                        key: key
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