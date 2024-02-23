export const CONFIGURATION = {
    API_BASE_URL: '0.0.0.0',
    PORT: 3000
}

export const MESSAGE_TYPES = {
    START: 'start',
    RESET: 'reset',
    SCORE: 'score',
    BALL_MOVE: 'ballMove',
    PADDLE_MOVE: 'paddleMove',
    WIN: 'win'
};
  
export const GAME_SETTINGS = {
  CANVAS: {
    HEIGHT: 400,
    WIDTH: 800
  },
  PADDLE: {
    HEIGHT: 100,
    WIDTH: 10
  },
  BALL: {
    SIZE: 10,
    IMAGE_SRC: 'assets/img/ball.png'
  },
  CONTROLS: {
    W: 'w',
    S: 's',
    UP: 'ArrowUp',
    DOWN: 'ArrowDown'
  },
  PROFILE : {
    PLAYERS: [],
    SCORE: [0, 0],
    BALL: {
      SPEED: { x: 2, y: 2 },
      COORD: { x: 400, y: 200 }
    },
    PADDLE: [150, 150],
    INTERVAL: 10
  }
};