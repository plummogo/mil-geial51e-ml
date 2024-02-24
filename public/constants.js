/*
 * CONSTANTS.JS leírás
 * Ebben a modulban implementáltam a játékmenet rajzolásához, üzleti logikájához és szerver kapcsolathoz használt értékeket
 * Felfogható mint egy közös model osztály illetve konstans osztály
 */

// Szerverhez használt konfigurációs rész
export const CONFIGURATION = {
    // IP cím beállítása, ez teszi lehetővé, hogy az adott hálózaton, más gépről is elérhető legyen a 'host'-oló ip-vel a játék
    API_BASE_URL: '0.0.0.0',
    // A beállított port a szervernek
    PORT: 3000
}

// Üzenetekhez használt típusok létrehozása
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
  
// Játékban használt beállítások a kliens, szerver oldalon
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