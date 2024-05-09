const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let players = {}; // Store connected players
let gameRooms = {}; // Store active game rooms

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Generate a random access key
function generateAccessKey() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let key = '';
    for (let i = 0; i < 7; i++) {
        key += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return key;
}

io.on('connection', (socket) => {
    console.log(`A user connected ${socket.id}`);

    socket.on('new player', (accessKey, playerName) => {
        if (!accessKey || accessKey.trim() === '') {
            accessKey = generateAccessKey();
            players[socket.id] = { name: playerName, key: accessKey, room: accessKey, score: 0 };
            players[accessKey] = { name: playerName, key: accessKey, room: accessKey, score: 0 };
            gameRooms[accessKey] = { player1: socket.id, player1Name: playerName, rematch: [] };
            socket.emit('access key', accessKey);
        } else {
            let room = gameRooms[accessKey];
            if (!room) {
                // Create a new room if it doesn't exist
                room.player2 = socket.id;
                room.player2Name = playerName;
                room.rematch = [];
                gameRooms[accessKey] = room;
                players[socket.id] = { name: playerName, key: accessKey, room: accessKey, score: 0 };
                console.log(`start game ${room.player1}`);
                io.to(room.player1).emit('start game', playerName);
                console.log(`start game ${socket.id}`);
                io.to(socket.id).emit('start game', room.player1Name);
            } else if (!room.player2) {
                room.player2 = socket.id;
                room.player2Name = playerName;
                players[socket.id] = { name: playerName, key: accessKey, room: accessKey, score: 0 };
                io.to(room.player1).emit('start game', playerName);
                io.to(socket.id).emit('start game', room.player1Name);
            } else {
                socket.emit('invalid key', 'Invalid access key or game already in progress.');
                return;
            }
        }
        console.log(`${accessKey} > ${playerName}`);

        socket.on('choose', (choice) => {
            const player = players[socket.id];
            const room = gameRooms[player.room];
            // console.log(`${JSON.stringify(room)}`);
            // console.log(`${room.player1} > ${room.player2}`);
            const opponentSocketId = socket.id === room.player1 ? room.player2 : room.player1;
            const opponent = players[opponentSocketId];

            player.choice = choice;

            console.log(`${player.choice} > ${opponent.choice}`);
            if(player.choice && opponent.choice && player.choice!=null && opponent.choice!=null){
                let result = determineWinner(choice, opponent.choice);

                console.log(`${result}`);

                // Update scores based on result
                if (result === 'win') {
                    player.score++;
                } else if (result === 'lose') {
                    opponent.score++;
                }

                io.to(room.player1).emit('result', {
                    choice,
                    result,
                    playerScore: player.score,
                    opponentScore: opponent.score
                });
                result = determineWinner(opponent.choice, choice);
                io.to(room.player2).emit('result', {
                    choice: opponent.choice,
                    result,
                    playerScore: opponent.score,
                    opponentScore: player.score
                });

                // Update player choices
                player.choice = choice;
                opponent.choice = null;

                // Handle rematch request
                socket.on('rematch', () => {
                    if (room && room.rematch) {
                        room.rematch.push(socket.id);
                        if (room.rematch.length === 2) {
                            io.to(room.player1).emit('rematch start');
                            io.to(room.player2).emit('rematch start');
                            room.rematch = [];
                        }
                    }
                });
            }
            // Other game-related event handlers...
        });
    });
    socket.on('disconnect', () => {
        const player = players[socket.id];
        if (player) {
            if (player.room && gameRooms[player.room]) {
                delete gameRooms[player.room];
            }
            delete players[socket.id];
            io.to(player.room).emit('opponent disconnected');
            console.log(`player ${player.name} deleted`);
        }
    });
});

// Function to determine the game winner
function determineWinner(playerChoice, opponentChoice) {
    if (playerChoice === opponentChoice) {
        return 'draw';
    } else if (
        (playerChoice === 'rock' && opponentChoice === 'scissors') ||
        (playerChoice === 'paper' && opponentChoice === 'rock') ||
        (playerChoice === 'scissors' && opponentChoice === 'paper')
    ) {
        return 'win';
    } else {
        return 'lose';
    }
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
