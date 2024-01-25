import type { KafkaMessage } from "kafkajs"
import EventEmitter from "node:events"
import { downloadFromS3 } from "./download"
import { createKafkaConsumer } from "./utils/kafka-consumer"
import { log } from "./utils/logger"

let isProcessing = false

const messageEvent = new EventEmitter()
const messageQueue: KafkaMessage[] = []
const consumer = await createKafkaConsumer(async (message: KafkaMessage) => {
  messageQueue.push(message)
  messageEvent.emit("newMessage")
})

consumer.on("consumer.connect", async () => {
  await log("Connected and subscribed to Kafka")
})

const processMessages = async () => {
  await log("frame splitter received a message")
  if (isProcessing) {
    console.log("still processing")
    return
  }

  while (messageQueue.length > 0) {
    const message = messageQueue.shift()
    const messageString = message?.value?.toString()
    const messageObject = JSON.parse(messageString!)
    const {
      videoPath, index, name, fps, videoLimit,
    } = messageObject

    if (!isProcessing) {
      isProcessing = true
      await downloadFromS3({
        videoPath, index: index.toString(), name, fps, videoLimit,
      })
      isProcessing = false
    } else {
      process.stdout.write(".")
    }
  }
  if (messageQueue.length === 0) {
    console.log("done processing")
  }
}

const initializeMessageQueue = () => {
  messageEvent.on("newMessage", processMessages)
}

export { initializeMessageQueue }
