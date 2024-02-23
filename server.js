import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { CONFIGURATION, MESSAGE_TYPES, GAME_SETTINGS } from './public/constants.js'
import { calculatePaddle, update, sendMessage } from './public/service.js';

//Express alkalmazás létrehozása
const app = express();

//Http szerver létrehozása Express-szel
const server = createServer(app);

//Websocket szerver létrehozása
const wss = new WebSocketServer({ server });

//Statikus middleware megadása (game.js, index.html elérési helye)
app.use(express.static('public'));

//Eseménykezelő akkor hívódik meg, amikor egy új kliens kapcsolódik a WebSocket szerverhez.
wss.on('connection', ws => {
  if (GAME_SETTINGS.PROFILE.PLAYERS.length < 2) {
    //Eltárolom a 'players' vektorba az éppen csatlakozott játékost
    GAME_SETTINGS.PROFILE.PLAYERS.push(ws);
    //Naplózom konzolon
    console.log(`Player ${GAME_SETTINGS.PROFILE.PLAYERS.length} has joined the game.`);
  } 
  
  if(GAME_SETTINGS.PROFILE.PLAYERS.length == 2 ) {
    //Mindkettő játkos csatlakozása során elküldöm a 'start' üzenetet a 'game.js'-nek
    sendMessage({ type:MESSAGE_TYPES.START });
    setInterval(update, GAME_SETTINGS.PROFILE.INTERVAL);
  }

  //Eseménykezelő akkor hívodik meg, amikor üzenetet küldenek neki
  ws.on('message', event => {  
    const message = JSON.parse(event);
    switch (message.type) {
      case MESSAGE_TYPES.PADDLE_MOVE:
        const playerIndex = GAME_SETTINGS.PROFILE.PLAYERS.findIndex(player => player === ws);
        calculatePaddle(playerIndex, message.paddle);
        break;
      case MESSAGE_TYPES.WIN:
        ws.close(1000, 'Closing by client request'); // Close the connection
        break;
    }
  });

  ws.on('close', () => {
    //Naplózom hogy elhagyta egy játékos a játékot
    console.log('Player left the game.');
    //Eltávolítom a 'players' vektorból a kilépett játékost
    GAME_SETTINGS.PROFILE.PLAYERS = GAME_SETTINGS.PROFILE.PLAYERS.filter(player => player !== ws);
    //Elküldöm a 'reset' üzenetet a 'game.js'-nek 
    sendMessage({type: MESSAGE_TYPES.RESET});
  });
});

//Beállítom a 3000-res portot, nem használok React-et a saját gépemen, így nem lesz probléma
//Terminál konzolára kiíratom a sikeres kapcsólódást
server.listen(CONFIGURATION.PORT, CONFIGURATION.API_BASE_URL, () => console.log('Listening on %d', server.address().port))