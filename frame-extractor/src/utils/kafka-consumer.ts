import {
  Consumer, Kafka, KafkaMessage, logLevel,
} from "kafkajs"

const KAFKA_BROKER = "kafka-dev"

async function createKafkaConsumer(
  messageHandler: (message: KafkaMessage) => void,
): Promise<Consumer> {
  let consumer
  try {
    const kafka = new Kafka({
      clientId: "consumer-service",
      brokers: [`${KAFKA_BROKER}:9092`],
      logLevel: logLevel.INFO,
    })
    const topic = "video-segments"
    const consumerGroupId = "group-2" // This has to be the same for all consumers
    consumer = kafka.consumer({ groupId: consumerGroupId })

    await consumer.connect()
    await consumer.subscribe({ topic, fromBeginning: false })

    await consumer.run({
      eachBatch: async ({
        batch,
        resolveOffset,
        heartbeat,
        isRunning,
        isStale,
      }) => {
        for (const message of batch.messages) {
          console.log(message?.value?.toString())

          if (!isRunning() || isStale()) {
            // This ensures we're not handling messages that were already handled
            break
          }

          await messageHandler(message)
          resolveOffset(message.offset)
          await heartbeat()
        }
      },
    })
  } catch (e) {
    console.log("Failed connecting to Kafka", e)

    // kill the process and restart the pod
    // if consumer is not connected it will not process messages which will lead to server running without purpose
    console.log("exiting the process...")
    process.exit(1)
  }

  return consumer
}

export { createKafkaConsumer }
