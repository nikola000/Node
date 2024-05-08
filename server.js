const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Store connected users
let users = {};

io.on('connection', (socket) => {
    console.log('A user connected');

    // Handle new user connection
    socket.on('new user', (username) => {
        users[socket.id] = username;
        io.emit('user connected', `${username} has joined the chat`);
    });

    // Handle incoming messages
    socket.on('chat message', (msg) => {
        io.emit('chat message', { user: users[socket.id], message: msg });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        if (users[socket.id]) {
            io.emit('user disconnected', `${users[socket.id]} has left the chat`);
            delete users[socket.id];
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
