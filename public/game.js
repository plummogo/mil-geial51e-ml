import { GAME_SETTINGS, MESSAGE_TYPES } from './constants.js'

const ws = new WebSocket('ws://192.168.1.163:3000');

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('canvas');
    const context = canvas.getContext('2d');
    const ballImage = new Image();
    ballImage.src = GAME_SETTINGS.BALL.IMAGE_SRC;

    const initPaddlePosition = (canvas.height - GAME_SETTINGS.PADDLE.HEIGHT) / 2;
    let paddle = [initPaddlePosition, initPaddlePosition];

    let ball = {
        speed: { x: 2, y: 2 },
        coord: { x: canvas.width / 2, y: canvas.height / 2 }
    }
    let scores = [0, 0];

    function drawPaddle(x, y) {
        context.fillStyle = '#0095DD';
        context.fillRect(x, y, GAME_SETTINGS.PADDLE.WIDTH, GAME_SETTINGS.PADDLE.HEIGHT);
    }

    function drawBall() {
        ballImage.complete && context.drawImage(ballImage, ball.coord.x - GAME_SETTINGS.BALL.SIZE, ball.coord.y - GAME_SETTINGS.BALL.SIZE, GAME_SETTINGS.BALL.SIZE * 2, GAME_SETTINGS.BALL.SIZE * 2);
    }

    function drawScore() {
        context.font = "48px Arial";
        context.fillStyle = "#FFFFFF";
        context.textAlign = "center";
        context.fillText(`${scores[0]} - ${scores[1]}`, canvas.width / 2, 50);
    }

    function drawMiddleLine() {
        context.beginPath();
        context.setLineDash([10, 15]);
        context.moveTo(canvas.width / 2, 0);
        context.lineTo(canvas.width / 2, canvas.height);
        context.strokeStyle = '#FFFFFF';
        context.stroke();
        context.closePath();
        context.setLineDash([]);
    }

    function resetBall() {
        ball.coord.x = canvas.width / 2;
        ball.coord.y = canvas.height / 2;
        ball.speed.x = -ball.speed.x;
        ball.speed.y = 2;
    }

    function update() {
        ball.coord.x += ball.speed.x;
        ball.coord.y += ball.speed.y;

        if (ball.coord.y + ball.speed.y > canvas.height-GAME_SETTINGS.BALL.SIZE || ball.coord.y + ball.speed.y < GAME_SETTINGS.BALL.SIZE) {
            ball.speed.y = -ball.speed.y;
        }

        if (ball.coord.x + ball.speed.x > canvas.width - GAME_SETTINGS.PADDLE.WIDTH - GAME_SETTINGS.BALL.SIZE) {
            if (ball.coord.y > paddle[1] && ball.coord.y < paddle[1] + GAME_SETTINGS.PADDLE.HEIGHT) {
                ball.speed.x = -ball.speed.x;
                ws.send(JSON.stringify({ type: MESSAGE_TYPES.BALL_MOVE, ball: ball }));
            } else {
                scores[0]++;
                ws.send(JSON.stringify({ type: MESSAGE_TYPES.SCORE, score: scores }));
                resetBall();
            }
        }

        if (ball.coord.x + ball.speed.x < GAME_SETTINGS.PADDLE.WIDTH + GAME_SETTINGS.BALL.SIZE) {
            if (ball.coord.y > paddle[0] && ball.coord.y < paddle[0] + GAME_SETTINGS.PADDLE.HEIGHT) {
                ball.speed.x = -ball.speed.x;
                ws.send(JSON.stringify({ type: MESSAGE_TYPES.BALL_MOVE, ball: ball }));
            } else {
                scores[1]++;
                ws.send(JSON.stringify({ type: MESSAGE_TYPES.SCORE, score: scores }));
                resetBall();
            }
        }

        context.clearRect(0, 0, canvas.width, canvas.height);
        drawMiddleLine();
        drawPaddle(0, paddle[0]);
        drawPaddle(canvas.width - GAME_SETTINGS.PADDLE.WIDTH, paddle[1]);
        drawBall();
        drawScore();
    }

    document.addEventListener('keydown', event => {
        switch(event.key) {
            case GAME_SETTINGS.CONTROLS.UP:
                paddle[1] -= 20;
                if (paddle[1] < 0) paddle[1] = 0;
                break;
            case GAME_SETTINGS.CONTROLS.DOWN:
                paddle[1] += 20;
                if (paddle[1] > canvas.height - GAME_SETTINGS.PADDLE.HEIGHT) paddle[1] = canvas.height - GAME_SETTINGS.PADDLE.HEIGHT;
                break;
            case GAME_SETTINGS.CONTROLS.W:
                paddle[0] -= 20;
                if (paddle[0] < 0) paddle[0] = 0;
                break;
            case GAME_SETTINGS.CONTROLS.S:
                paddle[0] += 20;
                if (paddle[0] > canvas.height - GAME_SETTINGS.PADDLE.HEIGHT) paddle[0] = canvas.height - GAME_SETTINGS.PADDLE.HEIGHT;
                break;
        }
        ws.send(JSON.stringify({ type: MESSAGE_TYPES.PADDLE_MOVE, paddle: paddle }));
    });

    ws.onmessage = event => {
        const message = JSON.parse(event.data);
        switch (message.type) {
            case MESSAGE_TYPES.START:
                document.getElementById('message').style.display = 'none';
                document.getElementById('canvas').style.top = '200px';
                setInterval(update, 10);                
                break;
            case MESSAGE_TYPES.RESET:
                document.getElementById('message').style.display = 'visible';
                document.getElementById('canvas').style.top = '200px';
                context.clearRect(0, 0, canvas.width, canvas.height);
                break;
            case MESSAGE_TYPES.SCORE:
                scores = message.data;
                break;
            case MESSAGE_TYPES.BALL_MOVE:
                ball = message.data;
                break;
            case MESSAGE_TYPES.PADDLE_MOVE:
                paddle = message.data;
                break;
        }
    };
});