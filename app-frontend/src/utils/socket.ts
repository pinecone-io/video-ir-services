import io from "socket.io-client"

console.log(import.meta.env.VITE_APP_BACKEND)
const socket = io(`http://${import.meta.env.VITE_APP_BACKEND}`, {
    path: "/app-sockets/socket",
    reconnection: true,
    secure: true,
    transports: ["websocket"],
    withCredentials: true
})

socket.on("connect_error", (error) => {
    console.log(`Connection Error?!: ${error.message}`)
  })

export { socket }