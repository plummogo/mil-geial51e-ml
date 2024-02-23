import { GAME_SETTINGS, MESSAGE_TYPES } from './constants.js';

const ws = new WebSocket('ws://192.168.1.163:3000');

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('canvas');
    const loading = document.getElementById('loading');
    const message = document.getElementById('message');
    const countDown = document.getElementById('count-down');
    const ready = document.getElementById('ready');
    const set = document.getElementById('set');
    const go = document.getElementById('go');
    const winner = document.getElementById('winner');
    const info = document.getElementById('info');

    const context = canvas.getContext('2d');
    const ballImage = new Image();
    ballImage.src = GAME_SETTINGS.BALL.IMAGE_SRC;

    function drawPaddle(x, y) {
        context.fillStyle = '#0095DD';
        context.fillRect(x, y, GAME_SETTINGS.PADDLE.WIDTH, GAME_SETTINGS.PADDLE.HEIGHT);
    }

    function drawBall() {
        ballImage.complete && context.drawImage(ballImage, GAME_SETTINGS.PROFILE.BALL.COORD.x - GAME_SETTINGS.BALL.SIZE, GAME_SETTINGS.PROFILE.BALL.COORD.y - GAME_SETTINGS.BALL.SIZE, GAME_SETTINGS.BALL.SIZE * 2, GAME_SETTINGS.BALL.SIZE * 2);
    }

    function drawScore() {
        context.font = "48px Arial";
        context.fillStyle = "#FFFFFF";
        context.textAlign = "center";
        context.fillText(`${GAME_SETTINGS.PROFILE.SCORE[0]} - ${GAME_SETTINGS.PROFILE.SCORE[1]}`, GAME_SETTINGS.CANVAS.WIDTH / 2, 50);
    }

    function drawMiddleLine() {
        context.beginPath();
        context.setLineDash([10, 15]);
        context.moveTo(GAME_SETTINGS.CANVAS.WIDTH / 2, 0);
        context.lineTo(GAME_SETTINGS.CANVAS.WIDTH / 2, GAME_SETTINGS.CANVAS.HEIGHT);
        context.strokeStyle = '#FFFFFF';
        context.stroke();
        context.closePath();
        context.setLineDash([]);
    }

    function updateCanvas() {
        context.clearRect(0, 0, canvas.width, canvas.height);
        drawMiddleLine();
        drawPaddle(0, GAME_SETTINGS.PROFILE.PADDLE[0]);
        drawPaddle(GAME_SETTINGS.CANVAS.WIDTH - GAME_SETTINGS.PADDLE.WIDTH, GAME_SETTINGS.PROFILE.PADDLE[1]);
        drawBall();
        drawScore();
    }

    function startGame() {
        loading.style.display = 'none';
        message.style.display = 'none';
        countDown.style.display = 'block';
        ready.style.display = 'block';
        $('#ready').fadeOut(600, () => {
            set.style.display = 'block';
            $('#set').fadeOut(600, () => {
                go.style.display = 'block';
                $('#go').fadeOut(600);
            });
        });

        $('#count-down').fadeOut(1900);

        setTimeout(() => {
            $('#loading').fadeIn(3500);
            message.style.display = 'none';
            canvas.style.top = '200px';
            info.style.display = 'block';
        }, 2000)
    }

    function endGame(isWinner = false) {
        if (!isWinner) {
            message.style.display = 'block';
        }
        canvas.style.top = '200px';
        context.clearRect(0, 0, GAME_SETTINGS.CANVAS.WIDTH, GAME_SETTINGS.CANVAS.HEIGHT);
        info.style.display = 'none';
    }

    document.addEventListener('keydown', event => ws.readyState === WebSocket.OPEN && ws.send(JSON.stringify({ type: MESSAGE_TYPES.PADDLE_MOVE, paddle: event.key })));

    ws.onmessage = event => {
        if (ws.readyState === WebSocket.OPEN) {
            const message = JSON.parse(event.data);

            switch (message.type) {
                case MESSAGE_TYPES.START:
                    startGame();
                    break;
                case MESSAGE_TYPES.BALL_MOVE:
                    GAME_SETTINGS.PROFILE.BALL = message.ball;
                    updateCanvas();
                    break;
                case MESSAGE_TYPES.SCORE:
                    GAME_SETTINGS.PROFILE.SCORE = message.score;
                    if (GAME_SETTINGS.PROFILE.SCORE.includes(1)) {
                        const winnerIndex = GAME_SETTINGS.PROFILE.SCORE.indexOf(1) + 1;
                        winner.style.display = 'block';
                        winner.innerText = `The winner is Player ${winnerIndex}`;
                        endGame(true);
                        ws.send(JSON.stringify({ type: MESSAGE_TYPES.WIN }))
                    } else {
                        updateCanvas();
                    }

                    break;
                case MESSAGE_TYPES.PADDLE_MOVE:
                    GAME_SETTINGS.PROFILE.PADDLE = message.paddle;
                    updateCanvas();
                    break;
                case MESSAGE_TYPES.RESET:
                    endGame();
                    break;
            }
        }
    };
});