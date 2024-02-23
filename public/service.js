import { GAME_SETTINGS, MESSAGE_TYPES } from './constants.js';

//üzenetet küdlő segéd metódus (pl.: 'start', 'reset')
export const sendMessage = (message) => {
    GAME_SETTINGS.PROFILE.PLAYERS.forEach(player => player.send(JSON.stringify(message)));
}

export const calculatePaddle = (player, key) => {
    let paddle = GAME_SETTINGS.PROFILE.PADDLE;
    switch (key) {
        case GAME_SETTINGS.CONTROLS.W:
        case GAME_SETTINGS.CONTROLS.UP:
            paddle[player] -= 20;
            if (paddle[player] < 0) {
                paddle[player] = 0;
            }
            break;
        case GAME_SETTINGS.CONTROLS.S:
        case GAME_SETTINGS.CONTROLS.DOWN:
            GAME_SETTINGS.PROFILE.PADDLE[player] += 20;
            if (paddle[player] > GAME_SETTINGS.CANVAS.HEIGHT - GAME_SETTINGS.PADDLE.HEIGHT){
                paddle[player] = GAME_SETTINGS.CANVAS.HEIGHT - GAME_SETTINGS.PADDLE.HEIGHT;
            } 
            break;
    }

    sendMessage({ type: MESSAGE_TYPES.PADDLE_MOVE, paddle: paddle });
}

export const update = () => {
    let ball = GAME_SETTINGS.PROFILE.BALL; 
    let score = GAME_SETTINGS.PROFILE.SCORE;
    ball.COORD.x += GAME_SETTINGS.PROFILE.BALL.SPEED.x;
    ball.COORD.y += GAME_SETTINGS.PROFILE.BALL.SPEED.y;
    sendMessage({ type: MESSAGE_TYPES.BALL_MOVE, ball: ball });

    if (ball.COORD.y + GAME_SETTINGS.PROFILE.BALL.SPEED.y > GAME_SETTINGS.CANVAS.HEIGHT-GAME_SETTINGS.BALL.SIZE || ball.COORD.y + GAME_SETTINGS.PROFILE.BALL.SPEED.y < GAME_SETTINGS.BALL.SIZE) {
        ball.SPEED.y = -GAME_SETTINGS.PROFILE.BALL.SPEED.y;
        sendMessage({ type: MESSAGE_TYPES.BALL_MOVE, ball: ball });
    }

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

function resetBall(ball) {
    ball.COORD.x = GAME_SETTINGS.CANVAS.WIDTH / 2;
    ball.COORD.y = GAME_SETTINGS.CANVAS.HEIGHT / 2;
    ball.SPEED.x = -GAME_SETTINGS.PROFILE.BALL.SPEED.x;
    ball.SPEED.y = 2;
    sendMessage({ type: MESSAGE_TYPES.BALL_MOVE, ball: ball });
}