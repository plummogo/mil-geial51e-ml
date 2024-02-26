/*
 * SERVER.JS leírás
 * Ebben a script-ben implementáltam a szerver üzenetküldő-fogadó logikáját
 */
import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { MESSAGE_TYPES, GAME_SETTINGS } from './public/constants.js'
import { calculatePaddle, initGame, updateGame, sendMessage } from './public/service.js';

// Express alkalmazás létrehozása
const app = express();

// Http szerver létrehozása Express-szel
const server = createServer(app);

// Websocket szerver létrehozása
const wss = new WebSocketServer({ server });

// Statikus middleware megadása (game.js, index.html elérési helye)
app.use(express.static('public'));

// Inicializálom a játékban használt konstansokat
initGame();

// Websocket eseménykezelője, akkor hívódik meg, amikor egy új kliens kapcsolódik a WebSocket szerverhez.
wss.on('connection', ws => {
  // Megvizsgálom hogy a csatlakozott játékosok száma nem érte el a maximális és elvárt 2 játékos számot
  if (GAME_SETTINGS.PROFILE.PLAYERS.length < 2) {
    // Eltárolom a 'GAME_SETTINGS.PROFILE.PLAYERS' az éppen csatlakozott játékost
    GAME_SETTINGS.PROFILE.PLAYERS.push(ws);
    // Naplózom konzolon
    console.log(`Player ${GAME_SETTINGS.PROFILE.PLAYERS.length} has joined the game.`);
  } 
  
  // Megvizsgálom hogy csatlakozott-e a két játékos
  if(GAME_SETTINGS.PROFILE.PLAYERS.length == 2 ) {
    // Mindkettő játkos csatlakozása során elküldöm a 'start' üzenetet a 'game.js'-nek
    sendMessage({ type:MESSAGE_TYPES.START });
    // Ismétlődő hívásokat indítok a service.js-nek
    setInterval(updateGame, GAME_SETTINGS.PROFILE.INTERVAL);
  }

  // Websocket eseménykezelője, akkor hívodik meg, amikor üzenetet küldenek a szervernek
  ws.on('message', event => {  
    // Objektummá alakítom a kapott üzenetetet amit byte-ba kapok
    const message = JSON.parse(event);
    
    // Az átalakított üzenet típusa alapján döntöm el mit fogok csinálni
    switch (message.type) {
      // A kliens mozgatta az ütő helyzetét
      case MESSAGE_TYPES.PADDLE_MOVE:
        // Meghatározom index alapján hogy melyik játékos küldte a mozgatást
        // Ez azért fontos, hogy a játékosok tudják használni ugyanazokat a billentyű kombinációkat
        const playerIndex = GAME_SETTINGS.PROFILE.PLAYERS.findIndex(player => player === ws);
        // Meghívom a service.js ütő helyzetének kiszámolására használt metódust
        calculatePaddle(playerIndex, message.paddle);
        break;
      // Valamelyik játékos megnyerte a játékot
      case MESSAGE_TYPES.WIN:
        // Lezárom a Websocket kapcsolatot
        ws.close(1000, 'Closing by client request');
        break;
    }
  });
  
  // Websocket eseménykezelője, akkor hívodik meg, amikor lezárom a kapcsolatot
  ws.on('close', () => {
    // Naplózom hogy elhagyta egy játékos a játékot
    console.log('Player left the game.');
    // Eltávolítom a kilépett játékost a tároló tömbből
    GAME_SETTINGS.PROFILE.PLAYERS = GAME_SETTINGS.PROFILE.PLAYERS.filter(player => player !== ws);
    // Elküldöm a 'reset' üzenetet a 'client.js'-nek 
    sendMessage({type: MESSAGE_TYPES.RESET});
    // Inicializálom a játékban használt értékeket
    initGame();
  });
});