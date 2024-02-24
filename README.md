# Integrált szoftverrendszerek és tesztelésük (mil-geial51e-ml) - Beadandó

## Fejlesztő csapat
- Héjjas Viktor
- Szabó Ákos Dániel
- Szilvási István Péter

## Beadandó ismertetése

### Pong játékról röviden
A Pong egy videójáték az Atari cégtől, amely először 1972-ben került a játéktermekbe. A játék a teniszt vagy asztaliteniszt szimulálja, a játékosok egy labdát ütögetnek egymásnak és pontokat szereznek, ha az ellenfél nem tudja visszaütni a labdát. 
A játékos a játékban lévő ütőt úgy irányítja, hogy függőlegesen mozgatja azt a képernyő jobb vagy bal oldalán. A játéknak két üzemmódja van: egy játékos játszhat a gép ellen, és két játékosok versenyezhet egymás ellen. A játékosok a saját térfelükön fel-le mozgó ütők segítségével oda-vissza ütik a labdát. A cél az, hogy mindkét játékos előbb érjen el tizenegy pontot, mint az ellenfél; pontokat akkor kapnak, ha az egyik nem tudja visszaütni a labdát a másiknak.[^1]

### Project felépítése

- Node.js (Websocket implementáció)
- HTML (Canvas kirajzolása)
- Javascript (Pong játék implementáció)
```
└── 📁node_modules
...
└── 📁public
        └── 📁assets
            └── 📁img
                └── ball.png
                └── bg.png
                └── countdown.gif
                └── down.png
                └── favicon.png
                └── loading.gif
                └── s.png
                └── up.png
                └── w.png
            └── 📁styles
                └── style.css
        └── client.js
        └── constants.js
        └── index.html
        └── service.js
└── .gitignore
└── package-lock.json
└── package.json
└── README.md
└── server.js
```

### Websocket szerver implementálása
0. Feltelepítem a Node.js a saját gépemre [^2] 
1. ``` npm init ``` paranccsal legenerálom a ``` package.json ``` file-t, amivel inicializálom a projectet.[^3]
2. ``` npm install express ws ``` a szükséges csomagokat telepítem, később kitérek rá, hogy miért kellenek.
3. Létrehozom a ``` server.js ``` file-t amibe a Websocket implementációt készítem el 
4. Feletelepítem a Node.js-hez szükséges 'express' csomagot [^4], és a 'ws' csomagot [^5]: ``` npm install express ws ```
5. Létrehozom a ``` .gitignore ``` file-t amibe leszűröm, hogy mit tartalmazzon a változtatások a VS Code-ba pl.: a feltelepített csomagokat nem fogom commitolni (node_modules) és a package-lock.json filet se.
6. Beimportálom a szükséges csomagokat a server.js file-ba [^6]

```

//Csomagok importálása
import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';

//Express alkalmazás létrehozása
const app = express();

//Http szerver létrehozása Express-szel
const server = http.createServer(app);

//Websocket szerver létrehozása
const wss = new WebSocketServer({ server });

//Statikus middleware megadása (game.js, index.html elérési helye)
app.use(express.static('public'));

```

6. Szerver port konfigurálása
```
//Beállítom a 3000-res portot, nem használok React-et a saját gépemen, így nem lesz probléma
//Terminál konzolára kiíratom a sikeres kapcsólódást
server.listen(3000, () => console.log('Listening on %d', server.address().port))
```

7. Websocket konfigurálása
```
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
```
8. Szerver elindítása: ``` node server start ```

### Service implementálása
A ```service.js```-ben oldom a játék üzleti logikáját, az-az itt döntöm el a mozgatást, koordináták módosítását. Ezt igazából ellehetett volna végezni a ```server.js```-ben is, de szerettem volna olvasható, könnyen értelmezhető és szeparált projektet létrehozni.

1. Implementálom az üzenetet küldő metódust
Ezt a metódust, csak a ```server.js``` fogja használni, ugyanis itt broadcast-olja az üzenetet. A kliens csak a saját üzenetét küldi, ezért nem írtam erre kezelő metódust itt. 

```
// Paramétere egy 'message' objektum, aminek van egy típus property-je (pl.: 'paddleMove'), egy adat amit küld (pl.: az ütők helyzete)
export const sendMessage = (message) => {
    GAME_SETTINGS.PROFILE.PLAYERS.forEach(player => player.send(JSON.stringify(message)));
}
```
2. Ütők mozgatásának implementálása
Ennek előzménye lesz a kliens döntése, hogy merre mozgatja az ütőt.
kliens > üzenet > server > üzenet > service > üzenet > kliens 
```
// Ez alapján döntöm el, hogyan mozgatom az adott játékos ütőjét (W || Arrowup felfelé, S || Arrowdown lefelé) 
export const calculatePaddle = (player, key) => {
    let paddle = GAME_SETTINGS.PROFILE.PADDLE;
    switch (key) {
        case GAME_SETTINGS.CONTROLS.W:
        case GAME_SETTINGS.CONTROLS.UP:
            //felfelé mozgatom az adott játékos ütőjét 20 pixellel
            paddle[player] -= 20;
            // ha az eredmény kisebb mint 0, akkor maximum a felső sarokba kerül
            if (paddle[player] < 0) {
                paddle[player] = 0;
            }
            break;
        case GAME_SETTINGS.CONTROLS.S:
        case GAME_SETTINGS.CONTROLS.DOWN:
            //lefelé mozgatom a az adott játékos ütőjét 20 pixellel
            GAME_SETTINGS.PROFILE.PADDLE[player] += 20;
            //ha az eredmény nagyobb mint a pálya magasságából kivont ütő magassága (az-az a mozgatható terület) akkor a legalsó sarokba kerül
            if (paddle[player] > GAME_SETTINGS.CANVAS.HEIGHT - GAME_SETTINGS.PADDLE.HEIGHT) {
                paddle[player] = GAME_SETTINGS.CANVAS.HEIGHT - GAME_SETTINGS.PADDLE.HEIGHT;
            }
            break;
    }

    //Elküldöm az üzenetet a kliensnek, a frissített ütők koordinátájával
    sendMessage({ type: MESSAGE_TYPES.PADDLE_MOVE, paddle: paddle });
}
```
3. Fő játékmenet implementációja
Ez a rész, ahol a labda folyamatos mozgatása történik és az eredmények naplózása. Ezeket a változtatásokat küldöm tovább a kliensnek.
```
// Itt történik az eredmény frissítése a client.js-nek
export const updateGame = () => {
    // Kiszervezem a legfrissebb labda értékét
    let ball = GAME_SETTINGS.PROFILE.BALL;
    // Kiszervezem a legfrissebb eredmény értékét
    let score = GAME_SETTINGS.PROFILE.SCORE;
    // Növelem a labda coordinátáját a sebesség méretével
    ball.COORD.x += GAME_SETTINGS.PROFILE.BALL.SPEED.x;
    ball.COORD.y += GAME_SETTINGS.PROFILE.BALL.SPEED.y;
    // Elküldöm a client.js-nek a módosított labda koordinátát
    sendMessage({ type: MESSAGE_TYPES.BALL_MOVE, ball: ball });

    // Ha a 'ball' y koordinátája a következő mozgással túllépné-e a pálya alsó vagy felső határát, figyelembe véve a labda sebességét és méretét, akkor kivonom a sebességet, így visszapattan.
    // Elküldöm a client.js-nek a módosított visszapattanó labda koordinátát
    if (ball.COORD.y + GAME_SETTINGS.PROFILE.BALL.SPEED.y > GAME_SETTINGS.CANVAS.HEIGHT - GAME_SETTINGS.BALL.SIZE || ball.COORD.y + GAME_SETTINGS.PROFILE.BALL.SPEED.y < GAME_SETTINGS.BALL.SIZE) {
        ball.SPEED.y = -GAME_SETTINGS.PROFILE.BALL.SPEED.y;
        sendMessage({ type: MESSAGE_TYPES.BALL_MOVE, ball: ball });
    }
    
    // Ellenőrzöm, hogy a labda érintkezik-e az ellenfél ütőjével, és ennek függvényében változtatja a labda irányát vagy növeli a pontszámot.
    // A pálya bal oldalát vizsgálja
    // Elküldöm a client.js-nek a módosított visszapattanó labda koordinátát
    // Ha pontot szerez a játékos, visszaállítja alaphelyzetbe a labda koordinátáját
    if (ball.COORD.x + GAME_SETTINGS.PROFILE.BALL.SPEED.x > GAME_SETTINGS.CANVAS.WIDTH - GAME_SETTINGS.PADDLE.WIDTH - GAME_SETTINGS.BALL.SIZE) {
        if (ball.COORD.y > GAME_SETTINGS.PROFILE.PADDLE[1] && GAME_SETTINGS.PROFILE.BALL.COORD.y < GAME_SETTINGS.PROFILE.PADDLE[1] + GAME_SETTINGS.PADDLE.HEIGHT) {
            ball.SPEED.x = -GAME_SETTINGS.PROFILE.BALL.SPEED.x;
            sendMessage({ type: MESSAGE_TYPES.BALL_MOVE, ball: ball });
        } else {
            score[0]++;
            resetBall(ball);
            sendMessage({ type: MESSAGE_TYPES.SCORE, score: score });
        }
    }
    
    // Ellenőrzöm, hogy a labda érintkezik-e az ellenfél ütőjével, és ennek függvényében változtatja a labda irányát vagy növeli a pontszámot.
    // A pálya jobb oldalát vizsgálja
    // Elküldöm a client.js-nek a módosított visszapattanó labda koordinátát
    // Ha pontot szerez a játékos, visszaállítja alaphelyzetbe a labda koordinátáját
    if (ball.COORD.x + GAME_SETTINGS.PROFILE.BALL.SPEED.x < GAME_SETTINGS.PADDLE.WIDTH + GAME_SETTINGS.BALL.SIZE) {
        if (ball.COORD.y > GAME_SETTINGS.PROFILE.PADDLE[0] && ball.COORD.y < GAME_SETTINGS.PROFILE.PADDLE[0] + GAME_SETTINGS.PADDLE.HEIGHT) {
            ball.SPEED.x = -GAME_SETTINGS.PROFILE.BALL.SPEED.x;
            sendMessage({ type: MESSAGE_TYPES.BALL_MOVE, ball: ball });
        } else {
            score[1]++;
            resetBall(ball);
            sendMessage({ type: MESSAGE_TYPES.SCORE, score: score });
        }
    }
}
```

4. Játékban használt konstansok inicializálásának implementációja
Alkalmazásban használt konstansok, objektumok változásának inicializálása történik itt
```
// GAME_SETTINGS.PROFILE konstans objektum amit a service.js, server.js és client.js is használ
// Szükséges ha véget ért a játék mert az egyik kliens kilépett vagy nyert
export const initGame = () => {
    GAME_SETTINGS.PROFILE = {
        PLAYERS: [],
        SCORE: [0, 0],
        BALL: {
            SPEED: { x: 2, y: 2 },
            COORD: { x: 400, y: 200 }
        },
        PADDLE: [150, 150],
        INTERVAL: 10
    }
}
```
5. Segéd metódus implementációja
A segéd metódust, kizárólag ebben a modulban használom, értelmezhető akár úgyis, hogy a láthatósági szintje ```private```. A metódus célja, a labda alapértékbe való helyezése, pl.: eredményszerzés során
```
// Inicializálom a játékban használt labda értékét
// Paramétere az aktuális 'ball' helyzete
// Ha pont szerzés, játék kezdés vagy befejezés szükséges visszaáll a kezdő állapotra
// Kezdő állapot a canvas közepe
// Sebessége a kezdetleges sebesség
// Végül üzenetet továbbítom a módosított labda értékével
function resetBall(ball) {
    ball.COORD.x = GAME_SETTINGS.CANVAS.WIDTH / 2;
    ball.COORD.y = GAME_SETTINGS.CANVAS.HEIGHT / 2;
    ball.SPEED.x = -GAME_SETTINGS.PROFILE.BALL.SPEED.x;
    ball.SPEED.y = 2;
    sendMessage({ type: MESSAGE_TYPES.BALL_MOVE, ball: ball });
}
```

### Kliens implementálása
A ```client.js```-ben oldom meg a ```canvas```-on rajzolandó játékmenetet, illetve a játékosok leütött ütőinek mozgatását. Ez a modul a rajzolásért felelős, illetve a kliens által választott pozíció küldéséről. Lépésről lépésre:

1. Új Websocket kapcsolat-ot regisztrálok a klienseknek, így belső hálozaton bárki tud csatlakozni
```
const ws = new WebSocket('ws://192.168.1.163:3000');
```
2. Teljese DOM[^7] betöltését bevárom[^8] és regisztrálom a manipulálandó elemeket az elején
```
// Javascript eseménykezelője, akkor fut le, amikor a dokumentum teljes DOM szerkezete betöltődött
// Azért fontos, mert a canvas-t így tudom biztonságosan használni 
document.addEventListener('DOMContentLoaded', () => {
    // Megkeresem és elmentem a DOM-ból a 'canvas', 'loading', 'message', 'count-down', 'ready', 'set', 'go', 'winner', 'info id-val rendelkező HTML elemet
    // A 'canvas' amire rajzolom a játékot
    const canvas = document.getElementById('canvas');
    // A 'loading' div tartalmazza elemeket
    const loading = document.getElementById('loading');
    // A 'message' a várakozó üzenetet
    const message = document.getElementById('message');
    // A 'count-down' a visszaszámlaló gif, amikor 2. játékos is csatlakozott
    const countDown = document.getElementById('count-down');
    // A 'ready' a visszaszámlaló gif-hez kiírt 'Ready'
    const ready = document.getElementById('ready');
    // A 'set' a visszaszámlaló gif-hez kiírt 'Set'
    const set = document.getElementById('set');
    // A 'go' a visszaszámlaló gif-hez kiírt 'Go'
    const go = document.getElementById('go');
    // A 'winner' a nyertes játékos kiíratása
    const winner = document.getElementById('winner');
    // A 'info' a játék leírása, hogy mikor nyer a játékos
    const info = document.getElementById('info');

    // Lekérem a rajzolási kontextust, amivel 2D grafikát hozok létre és manipulálom a canvas-t
    const context = canvas.getContext('2d');

    // A labda képét töltöm be az 'assets'-ből, amit egy konstansba tárolok
    const ballImage = new Image();
    ballImage.src = GAME_SETTINGS.BALL.IMAGE_SRC;
```
3. Implementálom az ütők rajzolását 
```
function drawPaddle(x, y) {
    // Beállítom kitöltési világoskék színt a következő rajzolási műveletekhez
    context.fillStyle = '#0095DD';
    // Rajzolok a koordináták alapján a kitöltési színnel egy téglalapot ami az ütő lesz
    context.fillRect(x, y, GAME_SETTINGS.PADDLE.WIDTH, GAME_SETTINGS.PADDLE.HEIGHT);
}
```
4. Implementálom a labda rajzolását
```
function drawBall() {
    // Ellenőrzöm hogy betöltődött-e a kép teljesen
    // Ha igen kirajzolok egy képet a 'canvas'-ra
    // Paraméterek: labda képe, x coordináta ami figyelembe veszi a méretét, y coordináta figyelembe veszi a méretét, szélesség, magasság megadása a labda méretének kétszeresével, így jobban látható
    ballImage.complete && context.drawImage(ballImage, GAME_SETTINGS.PROFILE.BALL.COORD.x - GAME_SETTINGS.BALL.SIZE, GAME_SETTINGS.PROFILE.BALL.COORD.y - GAME_SETTINGS.BALL.SIZE, GAME_SETTINGS.BALL.SIZE * 2, GAME_SETTINGS.BALL.SIZE * 2);
}
```
5. Implementálom az eredményt
```
function drawScore() {
    // Belállítom a betűtípust és méretet
    context.font = "48px Arial";
    // Beállítom a kitöltési fehér színt a következő rajzolási műveletekhez
    context.fillStyle = "#FFFFFF";
    // Beállítom a szöveg pozíciójat középre
    context.textAlign = "center";
    // Beállítom a paraméterül adott szöveget mint az eredmény szövegét pl.: 1 - 0
    // GAME_SETTINGS.PROFILE.SCORE egy [0,0] adatszerkezet, amely tartalmazza a játkosok eredményét
    // Beállítom a szélességet és magasságot, a szélesség a 'canvas' közepe, míg a magasság 50 pixelre van a tetejértől
    context.fillText(`${GAME_SETTINGS.PROFILE.SCORE[0]} - ${GAME_SETTINGS.PROFILE.SCORE[1]}`, GAME_SETTINGS.CANVAS.WIDTH / 2, 50);
}
```
6. Implementálom a pálya középvonalát
```
function drawMiddleLine() {
    // Előkészítem a rajzolási utat, ComeniusLogo szerű rajzolás :) 
    context.beginPath();
    // Szaggatot vonalat hozok létre, 10 pixel hosszú vonalak és 15 pixel távolság közöttük
    context.setLineDash([10, 15]);
    // Kezdőpontra mozgatom a rajzolást a 'canvas' közepétől tetejére
    context.moveTo(GAME_SETTINGS.CANVAS.WIDTH / 2, 0);
    // Vonalat húzok lefelé a 'canvas' végéig
    context.lineTo(GAME_SETTINGS.CANVAS.WIDTH / 2, GAME_SETTINGS.CANVAS.HEIGHT);
    // Beállítom a vonal színét fehérre
    context.strokeStyle = '#FFFFFF';
    // Végrehajtom a rajzolást
    context.stroke();
    // Bezárom a rajzolási utat
    context.closePath();
    // Visszaállítom sima vonalra
    context.setLineDash([]);
}
```
7. Implementálom a gyűjtő metódust, ami meghívja a korábban felsorolt implementációkat, hogy frissítse a játékot
```
function updateCanvas() {
    // Törlöm a 'canvas' teljes területét
    // Paraméterei: x, y, szélesség, hosszúság
    context.clearRect(0, 0, canvas.width, canvas.height);
    // Kirajzolom a felezővonalat
    drawMiddleLine();
    // Kirajzolom a bal ütőt
    drawPaddle(0, GAME_SETTINGS.PROFILE.PADDLE[0]);
    // Kirajzolom a jobb ütőt
    drawPaddle(GAME_SETTINGS.CANVAS.WIDTH - GAME_SETTINGS.PADDLE.WIDTH, GAME_SETTINGS.PROFILE.PADDLE[1]);
    // Kirajzolom a labdát
    drawBall();
    // Kirajzolom az eredményt
    drawScore();
}
```

8. Implementálom a játék indításakor használt megjelenítést
Fontos megemlíteni, hogy itt a áttűnésekhez, külső forrást használtam, jQuery-t[^9].
Úgy szerettem volna megoldani, hogy a visszaszámláló gif-fel együtt halványodjon el a felirat is. Az-az:
3 - Ready
2 - Set
1 - Go!
Ehhez a fadeOut[^10] metódust használtam, amivel elértem a kívánt hatást. Viszont, úgy tartottam jónak, ha már volt eltűnés, akkor legyen beúszás is, így a játékmenet kezdésére a fadeIn[^11] metódust használtam.
```
function startGame() {
    // Elrejtem a 'loading' dobozt
    loading.style.display = 'none';
    // Elrejtem a 'message' szöveget
    message.style.display = 'none';
    // Megjelenítem a visszaszámláló gif-et
    countDown.style.display = 'block';
    // Megjelenítem a 'Ready' feliratot
    ready.style.display = 'block';
    // jQuery-vel áttűnéssel eltűntetem a 'Ready' feliratot (0.6 másodperc alatt)
    $('#ready').fadeOut(600, () => {
        // Megjelenítem a 'Set' feliratot
        set.style.display = 'block';
        // jQuery-vel áttűnéssel eltűntetem a 'Set' feliratot (0.6 másodperc alatt)
        $('#set').fadeOut(600, () => {
            // Megjelenítem a 'Go!' feliratot
            go.style.display = 'block';
            // jQuery-vel áttűnéssel eltűntetem a 'Go!' feliratot (0.6 másodperc alatt)
            $('#go').fadeOut(600);
        });
    });
    
    // jQuery-vel áttűnéssel eltűntetem a visszaszámláló gifet (1.9 másodperc alatt)
    $('#count-down').fadeOut(1900);

    // 2 másodpercre állítom be hogy elindítsa a következő kód blokkot
    setTimeout(() => {
        // jQuery-vel áttűnéssel megjelenítem 'loading' dobozt
        $('#loading').fadeIn(3500);
        // Elrejtem a 'message' szöveget, már nem várunk játékosra
        message.style.display = 'none';
        // Beállítom a 'canvas' felülről vett 200px-es méretét
        canvas.style.top = '200px';
        // Megjelenítem a 'info' szöveget, a játék információt
        info.style.display = 'block';
    }, 2000)
}
```
9. Játék befejezésnek implementálása
Itt az volt a gondolatmenet, hogy a játék, vagy győzelemmel ér véget vagy azzal hogy az egyik kliens kilép.
```
function endGame(isWinner = false) {
    // Ha nem nyeréssel ért véget a játék, megjelenítem az üzenetet, hogy várjuk a második játékos csatlakozását
    if (!isWinner) {
        message.style.display = 'block';
    }

    // Beállítom a 'canvas' felülről vett 200px-es méretét
    canvas.style.top = '200px';

    // Törlöm a 'canvas' teljes területét
    // Paraméterei: x, y, szélesség, hosszúság
    context.clearRect(0, 0, GAME_SETTINGS.CANVAS.WIDTH, GAME_SETTINGS.CANVAS.HEIGHT);

    // Elrejtem az 'info' szöveget, mivel már nem kell az az üzenet
    info.style.display = 'none';
    }
```
10. Játékos vezérlésének implementációja
Itt röviden elküldöm a játékos által leütött billentyű nevét, és az alapján fogom kezelni a szerveren.

```
// Lellenőrzi a WebSocket kapcsolat állapotát, és ha az nyitott állapotban van, elküld egy üzenetet a szervernek a WebSocketen keresztül
// Az üzenet tartalmazza az ütők mozgatását, illetve a leütött billentyűt
document.addEventListener('keydown', event => ws.readyState === WebSocket.OPEN && ws.send(JSON.stringify({ type: MESSAGE_TYPES.PADDLE_MOVE, paddle: event.key })));
```

11. Kliens üzenet fogadásának implementációja
Itt kezelem le, amikor egy üzenet érkezik a WebSocket-en keresztül. Ez a rész ami miatt, frissül az egész játék menet.
```
ws.onmessage = event => {
    // Ellenőrzöm hogy a kapcsolat nyitott-e
    if (ws.readyState === WebSocket.OPEN) {
        // Objektummá alakítom a kapott üzenetetet amit byte-ba kapok
        const message = JSON.parse(event.data);

        switch (message.type) {
            // A szerver elindította a játékot
            case MESSAGE_TYPES.START:
                // Meghívom a játék fancy megjelenítését
                startGame();
                break;
            // A szerver mozgatta a labdát
            case MESSAGE_TYPES.BALL_MOVE:
                // Elmentem a kapott 'ball' adatot a 'GAME_SETTINGS.PROFILE.BALL' objektumba, amit használni fogok a 'canvas' frissítésénél
                GAME_SETTINGS.PROFILE.BALL = message.ball;
                // Frissítem a 'canvas'-t a frissített labda mozgással
                updateCanvas();
                break;
            // A szerver módosította az eredményt
            case MESSAGE_TYPES.SCORE:
                // Elmentem a kapott 'score' adatot a 'GAME_SETTINGS.PROFILE.SCORE' tömbbe, amit használni fogok a 'canvas' frissítésénél
                GAME_SETTINGS.PROFILE.SCORE = message.score;
                // Megvizsgálom, hogy az eredmény tartalmaz-e 10-et
                if (GAME_SETTINGS.PROFILE.SCORE.includes(10)) {
                    // Megtalálom a csatlakozott játékosok indexét, hogy melyik érte el a 10-et
                    const winnerIndex = GAME_SETTINGS.PROFILE.SCORE.indexOf(1) + 1;
                    // Megjelenítem a 'winner' szöveget
                    winner.style.display = 'block';
                    // Módosítom a 'winner' szövegét
                    winner.innerText = `The winner is Player ${winnerIndex}`;
                    // Meghívom a játék befejezését
                    endGame(true);
                    // Küldök üzenetet a szervernek, hogy egy játékos nyert
                    ws.send(JSON.stringify({ type: MESSAGE_TYPES.WIN }))
                } else {
                    // Ha nem találta meg a 10-et akkor frissíti a 'canvas'-t
                    updateCanvas();
                }

                break;
            // A szerver frissítette az ütők koordinátáját
            case MESSAGE_TYPES.PADDLE_MOVE:
                // Elmentem a kapott 'paddle' adatot a 'GAME_SETTINGS.PROFILE.PADDLE' tömbbe, amit használni fogok a 'canvas' frissítésénél
                GAME_SETTINGS.PROFILE.PADDLE = message.paddle;
                // Frissítem a 'canvas'-t
                updateCanvas();
                break;
            // A szerver alaphelyzetbe állította a játékot
            case MESSAGE_TYPES.RESET:
                // Befejezem az aktuális játékot
                endGame();
                break;
        }
    }
};
```
### Konstansok létrehozása
Ebben a modulban implementáltam a játékmenet rajzolásához, üzleti logikájához és szerver kapcsolathoz használt értékeket.

1. Szerverhez használt konfigurációs rész
```
export const CONFIGURATION = {
    // IP cím beállítása, ez teszi lehetővé, hogy az adott hálózaton, más gépről is elérhető legyen a 'host'-oló ip-vel a játék
    API_BASE_URL: '0.0.0.0',
    // A beállított port a szervernek
    PORT: 3000
}
```

2.  Üzenetekhez használt típusok létrehozása
```
export const MESSAGE_TYPES = {
    // Játék kezdése
    START: 'start',
    // Játék befejezése
    RESET: 'reset',
    // Játékban pont szerzés
    SCORE: 'score',
    // Labda mozgás a játékban
    BALL_MOVE: 'ballMove',
    // Ütő mozgás a játékban
    PADDLE_MOVE: 'paddleMove',
    // Játék győzelemmel ért véget
    WIN: 'win'
};
```

3. Játékban használt beállítások a kliens, szerver oldalon
```
export const GAME_SETTINGS = {
  // A Játékban használt 'canvas' méretének beállítása
  CANVAS: {
    HEIGHT: 400,
    WIDTH: 800
  },
  // A játékban használt ütők méretének beállítása
  PADDLE: {
    HEIGHT: 100,
    WIDTH: 10
  },
  // A játékban használt labda mérete és képnek a forrása
  BALL: {
    SIZE: 10,
    IMAGE_SRC: 'assets/img/ball.png'
  },
  // A játékban használt billentyű kombinációk elmentése
  CONTROLS: {
    W: 'w',
    S: 's',
    UP: 'ArrowUp',
    DOWN: 'ArrowDown'
  },
  //A játékban résztvevő játékosok, eredményeik illetve játék specifikus adatok mentése
  PROFILE : {
    // A játékhoz csatlakozott kliensek, (ws)
    PLAYERS: [],
    // A játékosok eredményei (első játékos bal oldali, második játékos jobb oldali)
    SCORE: [0, 0],
    // Labda mérete és sebessége
    BALL: {
      SPEED: { x: 2, y: 2 },
      COORD: { x: 400, y: 200 }
    },
    // Ütők helyzete
    PADDLE: [150, 150],
    // A játék-ot frissítő üzleti logika intervalluma
    INTERVAL: 10
  }
};
```

## Kiegészítések
Markdown-hoz szükséges bővítményeket telepítettem. 
- Draw Folder Structure: Egy olyan kiegészítő bővítmény VS Code-hoz, ami lehetővé teszi Markdown file-ba a file struktúra felépítést.[^9]
- Markdown Footnotes: Egy olyan kiegészítő bővítmény VS Code-hoz, ami lehetővé teszi a lábjegyzetek írását.[^10]

[^1]: https://hu.wikipedia.org/wiki/Pong.
[^2]: https://nodejs.org/en
[^3]: https://docs.npmjs.com/cli/v10/commands/npm-init
[^4]: https://www.npmjs.com/package/express
[^5]: https://www.npmjs.com/package/ws
[^6]: https://git-scm.com/docs/gitignore
[^7]: https://hu.wikipedia.org/wiki/Document_Object_Model
[^8]: https://developer.mozilla.org/en-US/docs/Web/API/Document/DOMContentLoaded_event
[^9]: https://jquery.com/
[^10]: https://api.jquery.com/fadeOut/
[^11]: https://api.jquery.com/fadeIn/
[^12]: https://css-tricks.com/snippets/css/a-guide-to-flexbox/
[^13]: https://developer.mozilla.org/en-US/docs/Web/CSS/@keyframes
[^14]: https://marketplace.visualstudio.com/items?itemName=jmkrivocapich.drawfolderstructure
[^15]: https://marketplace.visualstudio.com/items?itemName=bierner.markdown-footnotes
