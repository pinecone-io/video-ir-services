import io from "socket.io-client";

const indexerSocket = io('http://167.172.8.153/', {
    path: '/app-sockets/socket',
    reconnection: true,
    secure: true,
    transports: ['websocket'],
    withCredentials: true
});



export { indexerSocket as socket }