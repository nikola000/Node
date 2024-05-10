const socket = io();
let playerName;
let accessKey;

function startGameRoom() {
    playerName = prompt('Enter your name:');
    accessKey = document.getElementById('accessKey').value.trim();
    document.getElementById('startButton').hidden=true;
    document.getElementById('leaveGameRoomButton').hidden=false;
    document.getElementById('rematchButton').hidden=false;
    document.getElementById('accessKey').disabled=true;
    socket.emit('new player', accessKey, playerName);
}

function restartForm(){
    document.getElementById('startButton').hidden=false;
    document.getElementById('leaveGameRoomButton').hidden=true;
    document.getElementById('rematchButton').hidden=true;
    document.getElementById('accessKey').disabled=false;
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
        <div>
        <button id="rock" style="background-image: url(/images/Rock.jpg);background-size: cover; height: 150px;width: 150px;"/>
        <button id="paper" style="background-image: url(/images/Paper.jpg);background-size: cover; height: 150px;width: 150px;"/>
        <button id="scissors" style="background-image: url(/images/Scissors.jpg);background-size: cover; height: 150px;width: 150px;"/>
        </div>
        <br>
        <div id="result"></div>
    `;
    document.querySelectorAll('#gameRoom button').forEach((button) => {
        button.addEventListener('click', () => {
            const choice = button.id;
            document.querySelectorAll('#gameRoom button').forEach((button) => {
                button.disabled=true;
            });
            socket.emit('choose', choice);
        });
    });
});

socket.on('invalid key', (message) => {
    restartForm();
    alert(message);
});

// Handle game result
socket.on('result', ({ choice, opponentChoice, result, playerScore, opponentScore }) => {
    document.querySelectorAll('#gameRoom button').forEach((button) => {
        button.disabled=false;
    });
    console.log('Bravo');
    document.getElementById('result').textContent = `You chose: ${choice}, opponent chose: ${opponentChoice}. Result: ${result}. Your Score: ${playerScore}. Opponent Score: ${opponentScore}`;
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

