import { Kafka, Partitioners, Producer } from 'kafkajs';

class KafkaProducer {
    private producer: Producer;
    private topic: string;

    constructor(topic: string) {
        const kafka = new Kafka({
            clientId: 'my-app',
            brokers: ['localhost:9093']
        });

        this.producer = kafka.producer({
            createPartitioner: Partitioners.LegacyPartitioner

        });
        this.topic = topic;
    }

    async sendMessages(messages: string[]) {
        await this.producer.connect();
        await this.producer.send({
            topic: this.topic,
            messages: messages.map((message: string) => ({
                value: message,
            })),
        });
        await this.producer.disconnect();
    }
}

export { KafkaProducer };