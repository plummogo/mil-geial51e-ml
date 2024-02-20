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
                └── down.png
                └── favicon.png
                └── loading.gif
                └── s.png
                └── up.png
                └── w.png
            └── 📁styles
                └── style.css
        └── game.js
        └── index.html
└── .gitignore
└── package-lock.json
└── package.json
└── README.md
└── server.js
```

### Websocket implementálása
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

    //Kapcsolat bontása
    ws.on('close', () => clients.indexOf(ws) > -1 && clients.splice(index, 1));
});
```

### UI tervezés

Kettéválasztottam az ``` index.html``` file-ban a megjelenítendő ```div```-eket. A loading dobozba, a második játékosig várakozó képernyőt raktam bele, míg a ```canvas```-nak addig egy ```display=none``` inline style-t adtam át. Ezt majd a ```game.js```-be fogom kezelni.

#### Loading screen
```flex```-et használtam az egymást követő cím, üzenet, első/második játékos irányítása és loading gif formázásához.[^7] 
A cuki cica loading gif-et internetről szedtem le, míg az irányító gombokat én terveztem meg. Lényegében ami kiemelendő a villogó üzenet megvalósítása, ```@keyframes```-el.[^8]

#### Canvas screen
Ezt a ```game.js```-be fogom módosítani: az ütők, labda, pálya illetve a mozgás stílusát. 

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
[^7]: https://css-tricks.com/snippets/css/a-guide-to-flexbox/
[^8]: https://developer.mozilla.org/en-US/docs/Web/CSS/@keyframes
[^9]: https://marketplace.visualstudio.com/items?itemName=jmkrivocapich.drawfolderstructure
[^10]: https://marketplace.visualstudio.com/items?itemName=bierner.markdown-footnotes
