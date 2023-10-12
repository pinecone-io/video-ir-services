import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';

class Listener {
    private kafka: Kafka;
    private consumer: Consumer;
    private processedFiles: number;

    constructor() {
        this.kafka = new Kafka({
            clientId: 'my-app',
            brokers: ['localhost:9092']
        });
        this.consumer = this.kafka.consumer({ groupId: 'test-group' });
        this.processedFiles = 0;
    }

    async start(): Promise<void> {
        await this.consumer.connect();
        await this.consumer.subscribe({ topic: 'unprocessed-files', fromBeginning: true });

        await this.consumer.run({
            eachMessage: async ({ message }: EachMessagePayload) => {
                const fileUrl = message.value?.toString();
                if (!fileUrl) {
                    console.error('Invalid message received:', message);
                    return;
                }

                // process the message
                this.processedFiles++;

                if (this.processedFiles % 10 === 0) {
                    await this.indexImages(fileUrl);
                }
            },
        });
    }

    async indexImages(fileUrl: string): Promise<void> {
        // implementation of indexImages function
    }
}

const listener = new Listener();
listener.start();