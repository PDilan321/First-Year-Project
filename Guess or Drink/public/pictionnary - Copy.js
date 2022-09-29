// const socket = io();
const socket = io.connect('http://localhost:3000');


//

const messageForm = document.getElementById('send-container');
const messageInput = document.getElementById('message-input');
const messageContainer = document.getElementById('message-container');

// ---------------- Chat ------------------
//sending a message
messageForm.addEventListener('submit', e => {
    e.preventDefault();
    const message = messageInput.value;
    console.log(message);
    appendMessage(message, 'You');
    socket.emit('send-chat-message', message);
    messageInput.value = '';
});
//Receiving a message
socket.on('chat-message', data => appendMessage(data.message, data.name));

socket.on('user-connected', name => {
    appendMessage(`${name} has joined the game`)
});

socket.on('user-disconnected', name => {
    appendMessage(`${name} has left the game`)
});

function appendMessage(message, name = 'server') {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    console.log(name);
    messageElement.innerText = `${name} : ${message}`;
    if (name === 'server') messageElement.classList.add('servermessage');
    messageContainer.appendChild(messageElement);
    // autoscroll to botom
    messageContainer.scrollTop = messageContainer.scrollHeight;
}

// -------------- Join game ---------------

const name = sessionStorage.playername;
//const name = prompt('Enter your name');
appendMessage('joined the game', 'you');
socket.emit('new-user', name);
socket.on('receive-drawing', drawing => {
    console.log('received drawing');
    const img = new Image();
    img.onload = () => ctx.drawImage(img, 0, 0);
    img.src = drawing;
});


// ------------------------ Drawing -------------------------

const canvas = document.querySelector('#draw');
const ctx = canvas.getContext('2d');

//canvas.style.position = 'absolute';
canvas.style.top = '120px';
canvas.height = 500;
canvas.width = 870;

socket.on('message', socket => console.log(socket));

socket.on('draw', data => {
    isDrawing = true;
    console.log('received coords');
    draw(data);

    isDrawing = false
});
socket.on('startdraw', startDraw);
socket.on('stopdraw', stopDraw);

socket.on('clearcanvas', () => ctx.clearRect(0, 0, canvas.width, canvas.height))




ctx.lineCap = 'round';
ctx.lineJoin = 'round';
ctx.strokeStyle = '#000000';
let color = '#000000';

let isDrawing = false;
let lastX = -1;
let lastY = -1;
let hue = 0;
let linewidth = 5;

function draw(e) {
    if (!isDrawing) return;
    ctx.strokeStyle = color ;
    ctx.lineWidth = linewidth;
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
    [lastX, lastY] = [e.offsetX, e.offsetY];

}
function startDraw() {
    isDrawing = true;
    [lastX, lastY] = [this.offsetX, this.offsetY];
}
function stopDraw() {
    isDrawing = false
}

canvas.addEventListener('mousemove', (e) => {
    draw(e);
    if (isDrawing) {
        const {offsetX, offsetY} = e;
        socket.emit('draw', {offsetX: offsetX, offsetY: offsetY});
    }
});

canvas.addEventListener('mousedown', () => {
    // Player can only draw if it is his turn
    if (myTurn) {
        startDraw();
        socket.emit('startdraw');
        console.log('DRAWWWWWWWWWING')
    } else {
        console.log('not your turn sorry')
    }
});

canvas.addEventListener('mouseup', () => {
    stopDraw();
    socket.emit('stopdraw')
});

canvas.addEventListener('mouseout', () => {
    stopDraw();
    socket.emit('stopdraw')
});


function checkWhatsChanged(e){
    if(e.target.id === 'stroke') {
        color = e.target.value;
    }
    if(e.target.id === 'lineWidth') {
        linewidth = e.target.value;
    }
}

function clearButtonPress(e){
    if (e.target.id === 'clear') {
        cv.background(255, 255, 255)
    }
}

function clearButtonPress(e){
    if (e.target.id === 'clear') {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}
 
canvas,addEventListener("change", checkWhatsChanged);
canvas,addEventListener("click", clearButtonPress)

//send whole drawing if asked

socket.on('send-drawing', () => {
    drawing = canvas.toDataURL();
    socket.emit('whole-drawing', drawing);
    console.log('Sending back drawing');
});

// -------------------- Game logic ---------------------------------

let myTurn = false;
socket.on('your-turn', function (msg) {
    myTurn = true;
    getWords();
});

socket.on('stop-turn', () => myTurn = false);
socket.on('itsyourturn', () =>{
    socket.emit('myturn');
});

function getWords() {
    const words = ['bear', 'cat', 'dog', 'car', 'house', 'pickle', 'glasses', 'tiger', 'panda', 'glue', 'bunny', 'skull', 'flower',
   'bee', 'elmo', 'kermit', 'goldfish', 'heart', 'lion', 'butterfly', 'pumpkin', 'snowman', 'guitar', 'owl', 'batman',
   'dragon', 'pigeon', 'starfish', 'cupcake'];

    var n = 3;
    randomItems = words.sort(() => .5 - Math.random()).slice(0, n);
    console.log("3 words are " + randomItems);
    chooseWord(randomItems)

}

function chooseWord(words) {
    let word = 'placeholder';
    console.log('Choose a word');
    const container = document.querySelector('.canvascontainer');
    const text = document.createElement('div');
    const textContainer = document.createElement('div');
    textContainer.style.position = "absolute";
    textContainer.style.top = '300px';
    const buttonContainer = document.createElement('div');
    textContainer.classList.add('choose-word');
    textContainer.classList.add('choose-word-text');
    buttonContainer.setAttribute('choose_word', 'note');
    text.innerText = "It's your turn to aw ! Choose a word : ";
    text.style.color = 'black';

    // 1. Create the buttons
    const button1 = document.createElement("button");
    button1.classList.add('word-button');
    button1.innerHTML = words[0];

    const button2 = document.createElement("button");
    button2.classList.add('word-button');
    button2.innerHTML = words[1];

    const button3 = document.createElement("button");
    button3.classList.add('word-button');
    button3.innerHTML = words[2];

    // 2. Append buttons
    buttonContainer.appendChild(button1);
    buttonContainer.appendChild(button2);
    buttonContainer.appendChild(button3);

    // 3. Add event handlers
    button1.addEventListener("click", function () {
        setWord(button1);
    });
    button2.addEventListener("click", function () {
        setWord(button2);
    });
    button3.addEventListener("click", function () {
        setWord(button3);
    });

    textContainer.appendChild(text);
    textContainer.appendChild(buttonContainer);
    container.insertBefore(textContainer, container.firstChild);

    function setWord(button) {
        console.log('clicked button');
        word = button.innerHTML;
        socket.emit('get-word', word);
        container.removeChild(textContainer);
        canvas.style.left = "100px";
    }


}

socket.on('game-update', ({players, gameState}) => updateGame({players, gameState}));

function updateGame({players, gameState}) {
    // draw player cards
    const cardcontainer = document.querySelector('.cardsflexcontainer');
    cardcontainer.innerHTML = '';
    Object.keys(players).forEach(key => {
        const playercard = document.createElement('div');
        playercard.classList.add('playercard');
        const playerName = document.createElement('span');
        const isDrawing = document.createElement('span');
        const score = document.createElement('div');

        playercard.innerText = players[key].name;
        if (players[key].drawing) {
            isDrawing.innerText = ' is drawing !';
            playercard.classList.add('isdrawing')
        }
        score.innerText = `Score : ${players[key].score}`;

        playercard.appendChild(playerName);
        playercard.appendChild(isDrawing);
        playercard.appendChild(score);

        cardcontainer.appendChild(playercard)
    });


    console.log(players);
    console.log(gameState)
}