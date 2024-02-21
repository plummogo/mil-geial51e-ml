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
};
  
export const GAME_SETTINGS = {
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
  }
};