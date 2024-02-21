import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { CONFIGURATION, MESSAGE_TYPES, GAME_SETTINGS } from './public/constants.js'

//Express alkalmazás létrehozása
const app = express();

//Http szerver létrehozása Express-szel
const server = createServer(app);

//Websocket szerver létrehozása
const wss = new WebSocketServer({ server });

//Statikus middleware megadása (game.js, index.html elérési helye)
app.use(express.static('public'));

//Játékosokat tároló vektor
let players = [];
let score = [0, 0];
let ball = {
  speed: { x: 2, y: 2 },
  coord: { x: 0, y: 0 }
};
let paddle = [0, 0];

//Eseménykezelő akkor hívódik meg, amikor egy új kliens kapcsolódik a WebSocket szerverhez.
wss.on('connection', function connection(ws) {
  if (players.length < 2) {
    //Eltárolom a 'players' vektorba az éppen csatlakozott játékost
    players.push(ws);
    //Naplózom konzolon
    console.log(`Player ${players.length} has joined the game.`);
    //Mindkettő játkos csatlakozása során elküldöm a 'start' üzenetet a 'game.js'-nek
    players.length === 2 && broadcastMessage({ type:MESSAGE_TYPES.START, data: null });
  }

  //Eseménykezelő akkor hívodik meg, amikor üzenetet küldenek neki
  ws.on('message', event => {    
    const parsedMessage = JSON.parse(event);
    switch (parsedMessage.type) {
      case MESSAGE_TYPES.SCORE:
        const arraysEqual = score.length === parsedMessage.score.length && score.every((val, index) => val === parsedMessage.score[index]);
        if (!arraysEqual) {
          score = [...parsedMessage.score];
          broadcastMessage({type: MESSAGE_TYPES.SCORE, data: score });
        }
        break;
      case MESSAGE_TYPES.BALL_MOVE:
        const objectsEqual = JSON.stringify(ball) === JSON.stringify(parsedMessage.data);
        if (!objectsEqual) {
          ball = parsedMessage.ball;
          broadcastMessage({ type: MESSAGE_TYPES.BALL_MOVE, data: ball })
        }
        break;
      case MESSAGE_TYPES.PADDLE_MOVE:
        const arraysEqual1 = paddle.length === parsedMessage.paddle.length && paddle.every((val, index) => val === parsedMessage.paddle[index]);
          if (!arraysEqual1) {
            paddle = parsedMessage.paddle;
            broadcastMessage({ type: MESSAGE_TYPES.PADDLE_MOVE, data: paddle })
          }
          break;
    }
  });

  ws.on('close', () => {
    //Naplózom hogy elhagyta egy játékos a játékot
    console.log('Player left the game.');
    //Eltávolítom a 'players' vektorból a kilépett játékost
    players = players.filter(player => player !== ws);
    //Elküldöm a 'reset' üzenetet a 'game.js'-nek 
    broadcastMessage({type: MESSAGE_TYPES.RESET, data: null});
  });
});

//üzenetet küdlő segéd metódus (pl.: 'start', 'reset')
function broadcastMessage(message) {
  players.forEach(player => player.send(JSON.stringify(message)));
}

//Beállítom a 3000-res portot, nem használok React-et a saját gépemen, így nem lesz probléma
//Terminál konzolára kiíratom a sikeres kapcsólódást
server.listen(CONFIGURATION.PORT, CONFIGURATION.API_BASE_URL, () => console.log('Listening on %d', server.address().port))