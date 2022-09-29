const express = require('express');
app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const path = require('path');
app.use(express.static('public'));
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});


let players = {};
let gameState = {};
let word = 'banana';


io.on('connection', function (socket) {
    socket.on('myturn', setPlayerDrawing);

    function setPlayerDrawing() {
        // Current socket gets to draw
        players[socket.id].drawing = true;
        io.sockets.emit('game-update', {players, gameState});
        socket.emit('your-turn', "It's your turn !");
        socket.broadcast.emit('stop-turn'); // tell everybody else it's not their turn
        socket.on('get-word', (word) => {
            gameState = {playerDrawing: socket.id, word: word};
        });
        io.sockets.emit('game-update', {players, gameState});
        io.sockets.emit('clearcanvas');
    }

    //when the client has entered a name in the prompt
    socket.on('new-user', name => {

        // add player to player list and update clients
        players[socket.id] = {id: socket.id, name: name, score: 0, drawing: false};
        io.sockets.emit('game-update', {players, gameState});
        // if it's the first player the it's his turn
        if (Object.keys(players).length === 1) {
            setPlayerDrawing();
        }
        console.log(`player ${name} has connected`);


        // get the current drawing from the other players
        if (players !== {}) {
            console.log('requested drawing from all ');
            socket.broadcast.emit('send-drawing', 'please send drawing');
            socket.on('whole-drawing', drawing => {
                console.log('sending drawing to', players[socket.id].name);
                socket.broadcast.emit('receive-drawing', drawing)
            })
        }


    });


    // Chat messages and word guesses
    socket.on('send-chat-message', msg => handleMessage(msg));

    function handleMessage(message) {

        if ((message.toLowerCase().includes(gameState.word)) && players[socket.id].drawing === false ) {
            if (message.toLowerCase() === gameState.word) { // player found word
                socket.emit('chat-message', {
                    message: "You've found the word !! It's your turn to draw",
                    name: 'server'
                });
                players[gameState.playerDrawing].drawing = false; //player drawing ends his turn
                players[gameState.playerDrawing].score = players[gameState.playerDrawing].score + 50; //update score
                players[socket.id].score = players[socket.id].score + 100;
                setPlayerDrawing(); //current socket gets to draw and update clients
                socket.broadcast.emit('chat-message', {
                    message: `${players[socket.id].name} has found the word !`,
                    name: 'server'
                });
            } else {
                socket.emit('chat-message', {message: "You are close !", name: 'server'})
            }
        } else if (!(message.toLowerCase().includes(gameState.word))) {
            // normal message
            socket.broadcast.emit('chat-message', {message: message, name: players[socket.id].name});
        }
    }


    // -------------------- Drawing --------------------------

    socket.on('draw', (data) => {
        socket.broadcast.emit('draw', data);
    });
    socket.on('startdraw', (data) => {
        socket.broadcast.emit('startdraw');
    });
    socket.on('stopdraw', (data) => {
        socket.broadcast.emit('stopdraw');
    });


    // ------------- Whenever someone disconnects -----------------
    socket.on('disconnect', () => {
        console.log('A user disconnected');
        try {
            socket.broadcast.emit('user-disconnected', players[socket.id].name);
            if (players[socket.id].drawing === true) {
                delete players[socket.id];
                try {
                    nextId = players[Object.keys(players)[0]].id;
                    io.to(`${nextId}`).emit('itsyourturn');
                } catch (e) {
                    console.log('No more players connected')
                }
            } else {
                delete players[socket.id];
            }
            io.sockets.emit('game-update', {players, gameState});
        } catch (e) {
            console.log('an unknown player disconnected (connected before server start)')
        }

        // io.sockets.emit('playerupdate', players);
    });
});

const port = 3000;
server.listen(3000, function () {
    console.log('listening on port ', port);
});

