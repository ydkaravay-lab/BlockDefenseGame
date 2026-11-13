import { GameField } from "./GameField.js";
import { FallingShape } from "./FallingShape.js";
import { Cannon } from "./Cannon.js";
const GRID_W = 10;
const GRID_H = 20;
const CELL = 30;
const FIELD_HEIGHT = GRID_H * CELL;
const DROP_INTERVAL = 1000;
const BULLET_SPEED = 450;
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const status = document.getElementById("status");
const field = new GameField(GRID_W, GRID_H);
const cannon = new Cannon(GRID_W);
const templates = [
    { mask: [[1, 1, 1, 1]], color: "#50c8f0" },
    { mask: [[1, 1], [1, 1]], color: "#f0dc50" },
    { mask: [[0, 1, 0], [1, 1, 1]], color: "#b450dc" },
    { mask: [[1, 0], [1, 0], [1, 1]], color: "#f08c3c" },
    { mask: [[0, 1], [0, 1], [1, 1]], color: "#5078f0" },
    { mask: [[0, 1, 1], [1, 1, 0]], color: "#50dc78" },
    { mask: [[1, 1, 0], [0, 1, 1]], color: "#f05050" },
];
let currentShape = createShape();
let bullets = [];
let score = 0;
let gameOver = false;
let previousTime = null;
let dropElapsed = 0;
function createShape() {
    const template = templates[
        Math.floor(Math.random() * templates.length)
    ];
    const shapeWidth = template.mask[0].length;
    const x = Math.floor(Math.random() * (GRID_W - shapeWidth + 1));
    return new FallingShape(template.mask, x, 0, template.color);
}
function spawnShape() {
    currentShape = createShape();
    if (!field.canPlace(currentShape)) {
        gameOver = true;
        status.textContent = `Игра окончена. Счёт: ${score}`;
    }
}
function dropShape() {
    if (currentShape.isEmpty()) {
        spawnShape();
        return;
    }
    if (!field.drop(currentShape)) {
        field.lock(currentShape);
        const cleared = field.clearFullRows();
        score += cleared * 10;
        spawnShape();
    }
}
function shoot() {
    bullets.push({
        x: cannon.x * CELL + CELL / 2,
        y: FIELD_HEIGHT,
        width: 6,
        height: 12,
    });
    cannon.shots += 1;
}
function findBulletHit(bullet, previousY, newY) {
    if (!currentShape || currentShape.isEmpty()) {
        return null;
    }
    const bulletLeft = bullet.x - bullet.width / 2;
    const bulletRight = bullet.x + bullet.width / 2;
    const sweptTop = newY;
    const sweptBottom = previousY + bullet.height;
    const targets = currentShape.getCells().filter(cell => {
        const left = cell.x * CELL;
        const right = left + CELL;
        const top = cell.y * CELL;
        const bottom = top + CELL;
        return (
            bulletRight > left &&
            bulletLeft < right &&
            sweptBottom > top &&
            sweptTop < bottom
        );
    });
    if (targets.length === 0) {
        return null;
    }
    return targets.reduce(
        (lowest, cell) => cell.y > lowest.y ? cell : lowest
    );
}
function updateBullets(deltaSeconds) {
    const remaining = [];
    for (const bullet of bullets) {
        const previousY = bullet.y;
        const newY = previousY - BULLET_SPEED * deltaSeconds;
        const target = findBulletHit(bullet, previousY, newY);
        if (target) {
            currentShape.removeCell(target.x, target.y);
            score += 1;
            continue;
        }
        bullet.y = newY;
        if (bullet.y + bullet.height >= 0) {
            remaining.push(bullet);
        }
    }
    bullets = remaining;
}
function drawCell(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(
        x * CELL + 1,
        y * CELL + 1,
        CELL - 2,
        CELL - 2
    );
}
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < GRID_H; y++) {
        for (let x = 0; x < GRID_W; x++) {
            const color = field.grid[y][x];
            if (color !== null) {
                drawCell(x, y, color);
            }
        }
    }
    if (currentShape) {
        for (const cell of currentShape.getCells()) {
            drawCell(cell.x, cell.y, currentShape.color);
        }
    }
    ctx.strokeStyle = "#373741";
    ctx.lineWidth = 1;
    for (let x = 0; x <= GRID_W; x++) {
        ctx.beginPath();
        ctx.moveTo(x * CELL, 0);
        ctx.lineTo(x * CELL, FIELD_HEIGHT);
        ctx.stroke();
    }
    for (let y = 0; y <= GRID_H; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * CELL);
        ctx.lineTo(GRID_W * CELL, y * CELL);
        ctx.stroke();
    }
    ctx.fillStyle = "#ffdc3c";
    for (const bullet of bullets) {
        ctx.fillRect(
            bullet.x - bullet.width / 2,
            bullet.y,
            bullet.width,
            bullet.height
        );
    }
    const centerX = cannon.x * CELL + CELL / 2;
    ctx.fillStyle = "#dddddd";
    ctx.fillRect(centerX - 9, FIELD_HEIGHT + 15, 18, 15);
    ctx.fillRect(centerX - 3, FIELD_HEIGHT + 3, 6, 16);
    if (gameOver) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
        ctx.fillRect(0, 0, canvas.width, FIELD_HEIGHT);
        ctx.fillStyle = "#ffffff";
        ctx.font = "24px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Игра окончена", canvas.width / 2, FIELD_HEIGHT / 2);
    }
}
window.addEventListener("keydown", event => {
    const controls = ["ArrowLeft", "ArrowRight", "Space"];
    if (!controls.includes(event.code)) {
        return;
    }
    event.preventDefault();
    if (gameOver) {
        return;
    }
    if (event.code === "ArrowLeft") {
        cannon.moveLeft();
    } else if (event.code === "ArrowRight") {
        cannon.moveRight();
    } else if (event.code === "Space" && !event.repeat) {
        shoot();
    }
});
function gameLoop(timestamp) {
    if (previousTime === null) {
        previousTime = timestamp;
    }
    const deltaMs = timestamp - previousTime;
    previousTime = timestamp;
    if (!gameOver) {
        updateBullets(deltaMs / 1000);
        if (currentShape.isEmpty()) {
            spawnShape();
            dropElapsed = 0;
        } else {
            dropElapsed += deltaMs;
            while (dropElapsed >= DROP_INTERVAL && !gameOver) {
                dropElapsed -= DROP_INTERVAL;
                dropShape();
            }
        }
        if (!gameOver) {
            status.textContent = `Счёт: ${score} | Выстрелы: ${cannon.shots}`;
        }
    }
    draw();
    if (!gameOver) {
        requestAnimationFrame(gameLoop);
    }
}
requestAnimationFrame(gameLoop);