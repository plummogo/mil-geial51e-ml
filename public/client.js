/*
 * CLIENT.JS leírás
 * Ebben a modulban implementáltam a játékmenet rajzolásának logikáját, ezt a kliens használja
 */
import { GAME_SETTINGS, MESSAGE_TYPES } from './constants.js';

// Új WebSocket kapcsolatot regisztrálok és használok kliens oldalon, ezzel összekötöm a klienst a WebSocket szerverrel
const ws = new WebSocket('ws://192.168.1.163:3000');

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

    // Kirajzolom az ütőket koordináta alapján
    function drawPaddle(x, y) {
        // Beállítom kitöltési világoskék színt a következő rajzolási műveletekhez
        context.fillStyle = '#0095DD';
        // Rajzolok a koordináták alapján a kitöltési színnel egy téglalapot ami az ütő lesz
        context.fillRect(x, y, GAME_SETTINGS.PADDLE.WIDTH, GAME_SETTINGS.PADDLE.HEIGHT);
    }

    // Kirajzolom a labdát
    function drawBall() {
        // Ellenőrzöm hogy betöltődött-e a kép teljesen
        // Ha igen kirajzolok egy képet a 'canvas'-ra
        // Paraméterek: labda képe, x coordináta ami figyelembe veszi a méretét, y coordináta figyelembe veszi a méretét, szélesség, magasság megadása a labda méretének kétszeresével, így jobban látható
        ballImage.complete && context.drawImage(ballImage, GAME_SETTINGS.PROFILE.BALL.COORD.x - GAME_SETTINGS.BALL.SIZE, GAME_SETTINGS.PROFILE.BALL.COORD.y - GAME_SETTINGS.BALL.SIZE, GAME_SETTINGS.BALL.SIZE * 2, GAME_SETTINGS.BALL.SIZE * 2);
    }

    // Kirajzolom az eredmény táblát
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

    // Kirajzolom a játék pálya felezővonalát
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

    // Frissítem a pályát és az azt tartalmazó elemeket
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

    // Játék indításakor raktam bele fancy gif-et, áttűnéseket jQueryvel
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

    // Játék befejezése
    // Paramétere egy isWinner flag aminek default értéke false
    // Ez jelzi hogy nyeréssel ért-e véget a játék, vagy hogy kilépett-e egy kliens
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

    // Javascript eseménykezelő, a billentyűleütésekre reagál 
    // Lellenőrzi a WebSocket kapcsolat állapotát, és ha az nyitott állapotban van, elküld egy üzenetet a szervernek a WebSocketen keresztül
    // Az üzenet tartalmazza az ütők mozgatását, illetve a leütött billentyűt
    document.addEventListener('keydown', event => ws.readyState === WebSocket.OPEN && ws.send(JSON.stringify({ type: MESSAGE_TYPES.PADDLE_MOVE, paddle: event.key })));

    // Eseménykezelő, amikor egy üzenet érkezik a WebSocket-en keresztül
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
});