import { BACKEND } from "./environment"

console.log("BACKEND", `http://${BACKEND}}/log`)

const log = async (message: string, payload: object = {}) => {
  const podId = process.env.POD_NAME || "unknown"
  const formattedMessage = `${podId}: ${message}`
  try {
    await fetch(`http://${BACKEND}/log`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: formattedMessage, payload }),
    })
  } catch (error) {
    console.error("Failed to log message", error)
  }
}

const trackFile = async (file: string) => {
  const podId = process.env.POD_NAME || "unknown"

  try {
    await fetch(`http://${BACKEND}/trackFile`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ file, podId }),
    })
  } catch (error) {
    console.error("Failed to log message", error)
  }
}

export { log, trackFile }
