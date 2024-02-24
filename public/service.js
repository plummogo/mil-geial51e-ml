/*
 * SERVICE.JS leírás
 * Ebben a modulban implementáltam az üzeleti logikát (ütők-labda mozgatása, üzenetküldés, játékmenet frissítése/inicializálása)
 */

import { GAME_SETTINGS, MESSAGE_TYPES } from './constants.js';

// Üzenetet küdlő metódus a server.js használja
// Paramétere egy 'message' objektum, aminek van egy típus property-je (pl.: 'paddleMove'), egy adat amit küld (pl.: az ütők helyzete)
export const sendMessage = (message) => {
    GAME_SETTINGS.PROFILE.PLAYERS.forEach(player => player.send(JSON.stringify(message)));
}

// Ütők helyzetének kiszámítása játékos és leütött billentyű alapján
// Paramétere egy 'player' csatlakozott kliens, ami meghatározza melyik ütőt mozgatom
// Paramétere egy 'key' amit a client.js küld a server.js-nek és adja át a service.js-nek. 
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

// Játékmenet fő része, itt mozgatom a labdát és küldöm tovább a client.js-nek
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

// Inicializálom a játékban használt konstans 'GAME_SETTINGS.PROFILE' objektum értékeit
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