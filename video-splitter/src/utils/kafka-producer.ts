import {
  Admin, Kafka, Partitioners, Producer, logLevel,
} from "kafkajs"
import { log } from "./logger"

import { KAFKA_BROKER } from "./environment"

class KafkaProducer {
  private producer: Producer

  private admin: Admin

  private topic: string

  private isConnected: boolean

  constructor() {
    const kafka = new Kafka({
      clientId: "video-segments-producer-service",
      brokers: [`${KAFKA_BROKER}:9092`],
      logLevel: logLevel.INFO,
    })

    this.producer = kafka.producer({
      createPartitioner: Partitioners.DefaultPartitioner,
    })
    this.admin = kafka.admin()
    this.topic = "video-segments"
    this.isConnected = false
  }

  private async createTopics() {
    await this.admin.connect()
    const topics = await this.admin.listTopics()
    if (!topics.includes(this.topic)) {
      await this.admin.createTopics({
        topics: [{ topic: this.topic, numPartitions: 15 }],
      })
    }
    await this.admin.disconnect()
  }

  async connect() {
    try {
      await this.createTopics()
      await this.producer.connect()
      this.isConnected = true // Update after successful connection
      console.log("Connected to Kafka")
    } catch (error) {
      console.error("Error connecting to Kafka:", error)
    }
  }

  async sendMessage(message: string) {
    // Generate a random key
    const key = Math.random().toString(36).substring(2)
    try {
      // Check if the producer is connected before sending messages
      if (!this.isConnected) {
        console.log("It seems like the producer is not connected, trying to connect...")
        await this.connect()
      }
      const { topic } = this
      await log(`Sending message: ${message}`)
      await this.producer.send({
        topic: topic!,
        messages: [{
          value: message!,
          key,
        }],
      })
    } catch (error) {
      console.error("Error sending messages to Kafka:", error)
    }
  }

  async disconnect() {
    try {
      await this.producer.disconnect()
    } catch (error) {
      console.error("Error disconnecting from Kafka:", error)
    }
  }
}

export { KafkaProducer }
