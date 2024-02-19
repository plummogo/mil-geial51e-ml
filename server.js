import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';

//Express alkalmazás létrehozása
const app = express();

//Http szerver létrehozása Express-szel
const server = createServer(app);

//Websocket szerver létrehozása
const wss = new WebSocketServer({ server });

//Statikus middleware megadása (game.js, index.html elérési helye)
app.use(express.static('public'));

//Klienseket tároló vektor
const clients = [];

//Eseménykezelő akkor hívódik meg, amikor egy új kliens kapcsolódik a WebSocket szerverhez.
wss.on('connection', (ws) => {
    console.log('Client connected');
    clients.push(ws);

    //Üzenete fogadása és továbbítása
    ws.on('message', (message) => {
        //Üzenet naplózása
        console.log('received: %s', message);    
        //Ellenőrzöm hogy nem küldöm el az üzenet küldőjének, és hogy a kliens kapcsolata nyitva van-e, ha igen elküldöm az üzenetet
        clients.forEach(client => client !== ws && client.readyState === WebSocketServer.OPEN && client.send(message));
    });

    //Kapcsolat bontása, és a kliens vektorból való törlés
    ws.on('close', () => clients.indexOf(ws) > -1 && clients.splice(index, 1));
});

//Beállítom a 3000-res portot, nem használok React-et a saját gépemen, így nem lesz probléma
//Terminál konzolára kiíratom a sikeres kapcsólódást
server.listen(3000, () => console.log('Listening on %d', server.address().port))