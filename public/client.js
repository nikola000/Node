const socket = io();
let playerName;
let accessKey;

function startGameRoom() {
    playerName = prompt('Enter your name:');
    accessKey = document.getElementById('accessKey').value.trim();
    socket.emit('new player', accessKey, playerName);
}

document.getElementById('startButton').addEventListener('click', startGameRoom);

socket.on('access key', (key) => {
    accessKey = key;
    document.getElementById('accessKey').value = key;
});

socket.on('start game', (opponentName) => {
    console.log('start');
    document.getElementById('gameRoom').style.display = 'block';
    document.getElementById('gameRoom').innerHTML = `
        <h2>Game Room</h2>
        <p>Opponent: ${opponentName}</p>
        <!-- Game UI elements -->
        <button id="rock">Rock</button>
        <button id="paper">Paper</button>
        <button id="scissors">Scissors</button>
        <div id="result"></div>
    `;
    document.querySelectorAll('#gameRoom button').forEach((button) => {
        button.addEventListener('click', () => {
            const choice = button.id;
            socket.emit('choose', choice);
        });
    });
});

socket.on('invalid key', (message) => {
    alert(message);
});

// Handle game result
socket.on('result', ({ choice, result, playerScore, opponentScore }) => {
    console.log('Bravo');
    document.getElementById('result').textContent = `You chose: ${choice}. Result: ${result}. Your Score: ${playerScore}. Opponent Score: ${opponentScore}`;
});

// Handle rematch request confirmation
document.getElementById('rematchButton').addEventListener('click', () => {
    socket.emit('rematch');
});

// Handle rematch start
socket.on('rematch start', () => {
    // Reset UI for a new round
    document.getElementById('result').textContent = '';
});

// Handle game end (when players decide not to rematch)
socket.on('game end', () => {
    document.getElementById('gameRoom').style.display = 'none';
    alert('Game over! Thanks for playing.');
});

// Handle opponent disconnection
socket.on('opponent disconnected', () => {
    document.getElementById('gameRoom').style.display = 'none';
    alert('Your opponent has disconnected. Game over.');
});

