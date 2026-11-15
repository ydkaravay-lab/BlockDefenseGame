import { GameField } from "./GameField.js";
import { FallingShape } from "./FallingShape.js";
import { Cannon } from "./Cannon.js";
import { PresetStore, DEFAULT_PRESET } from "./presets.js";
const GRID_W = 10;
const GRID_H = 20;
const CELL = 30;
const FIELD_HEIGHT = GRID_H * CELL;
const BULLET_SPEED = 450;
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const status = document.getElementById("status");
const templates = [
    { mask: [[1, 1, 1, 1]], color: "#50c8f0" },
    { mask: [[1, 1], [1, 1]], color: "#f0dc50" },
    { mask: [[0, 1, 0], [1, 1, 1]], color: "#b450dc" },
    { mask: [[1, 0], [1, 0], [1, 1]], color: "#f08c3c" },
    { mask: [[0, 1], [0, 1], [1, 1]], color: "#5078f0" },
    { mask: [[0, 1, 1], [1, 1, 0]], color: "#50dc78" },
    { mask: [[1, 1, 0], [0, 1, 1]], color: "#f05050" },
];
class DefenseGame {
    constructor() {
        this.previousTime = null;
        this.reset(DEFAULT_PRESET);
        requestAnimationFrame(this.loop.bind(this));
    }
    reset(preset) {
        this.preset = { ...preset };
        this.field = new GameField(GRID_W, GRID_H);
        this.cannon = new Cannon(GRID_W);
        this.shape = null;
        this.health = new Map();
        this.bullets = [];
        this.score = 0;
        this.gameOver = false;
        this.dropElapsed = 0;
        this.spawnRemaining = 0;
        this.previousTime = null;
        this.updateStatus();
    }
    createShape() {
        const template = templates[
            Math.floor(Math.random() * templates.length)
        ];
        const width = template.mask[0].length;
        const x = Math.floor(Math.random() * (GRID_W - width + 1));
        return new FallingShape(template.mask, x, 0, template.color);
    }
    spawnShape() {
        const shape = this.createShape();
        if (!this.field.canPlace(shape)) {
            this.gameOver = true;
            this.updateStatus();
            return;
        }
        this.shape = shape;
        this.health.clear();
        for (const block of shape.blocks) {
            this.health.set(
                this.cellKey(block.x, block.y),
                this.preset.durability
            );
        }
        this.dropElapsed = 0;
    }
    cellKey(x, y) {
        return `${x},${y}`;
    }
    finishShape() {
        this.shape = null;
        this.health.clear();
        this.dropElapsed = 0;
        this.spawnRemaining = this.preset.spawnInterval;
    }
    dropShape() {
        if (!this.shape) {
            return;
        }
        if (!this.field.drop(this.shape)) {
            this.field.lock(this.shape);
            const cleared = this.field.clearFullRows();
            this.score += cleared * 10;
            this.finishShape();
        }
    }
    shoot() {
        if (this.gameOver) {
            return;
        }
        this.bullets.push({
            x: this.cannon.x * CELL + CELL / 2,
            y: FIELD_HEIGHT,
            width: 6,
            height: 12,
        });
        this.cannon.shots += 1;
        this.updateStatus();
    }
    findBulletHit(bullet, previousY, newY) {
        if (!this.shape) {
            return null;
        }
        const bulletLeft = bullet.x - bullet.width / 2;
        const bulletRight = bullet.x + bullet.width / 2;
        const sweptTop = newY;
        const sweptBottom = previousY + bullet.height;
        const targets = this.shape.getCells().filter(cell => {
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
    damageCell(target) {
        const localX = target.x - this.shape.x;
        const localY = target.y - this.shape.y;
        const key = this.cellKey(localX, localY);
        const remainingHealth = this.health.get(key) - 1;
        if (remainingHealth <= 0) {
            this.shape.removeCell(target.x, target.y);
            this.health.delete(key);
            this.score += 1;
            if (this.shape.isEmpty()) {
                this.finishShape();
            }
        } else {
            this.health.set(key, remainingHealth);
        }
    }
    updateBullets(deltaSeconds) {
        const remaining = [];
        for (const bullet of this.bullets) {
            const previousY = bullet.y;
            const newY = previousY - BULLET_SPEED * deltaSeconds;
            const target = this.findBulletHit(bullet, previousY, newY);
            if (target) {
                this.damageCell(target);
                continue;
            }
            bullet.y = newY;
            if (bullet.y + bullet.height >= 0) {
                remaining.push(bullet);
            }
        }
        this.bullets = remaining;
    }
    update(deltaMs) {
        if (this.gameOver) {
            return;
        }
        this.updateBullets(deltaMs / 1000);
        if (!this.shape) {
            this.spawnRemaining -= deltaMs;
            if (this.spawnRemaining <= 0) {
                this.spawnShape();
            }
        } else {
            this.dropElapsed += deltaMs;
            while (
                this.shape &&
                !this.gameOver &&
                this.dropElapsed >= this.preset.dropInterval
            ) {
                this.dropElapsed -= this.preset.dropInterval;
                this.dropShape();
            }
        }
        this.updateStatus();
    }
    updateStatus() {
        if (this.gameOver) {
            status.textContent = `Игра окончена. Счёт: ${this.score}`;
            return;
        }
        status.textContent =
            `Уровень: ${this.preset.name} | ` +
            `Счёт: ${this.score} | ` +
            `Выстрелы: ${this.cannon.shots}`;
    }
    drawCell(x, y, color) {
        ctx.fillStyle = color;
        ctx.fillRect(
            x * CELL + 1,
            y * CELL + 1,
            CELL - 2,
            CELL - 2
        );
    }
    draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let y = 0; y < GRID_H; y++) {
            for (let x = 0; x < GRID_W; x++) {
                const color = this.field.grid[y][x];
                if (color !== null) {
                    this.drawCell(x, y, color);
                }
            }
        }
        if (this.shape) {
            for (const cell of this.shape.getCells()) {
                this.drawCell(cell.x, cell.y, this.shape.color);
                if (this.preset.durability > 1) {
                    const key = this.cellKey(
                        cell.x - this.shape.x,
                        cell.y - this.shape.y
                    );
                    ctx.fillStyle = "#111";
                    ctx.font = "14px Arial";
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.fillText(
                        String(this.health.get(key)),
                        cell.x * CELL + CELL / 2,
                        cell.y * CELL + CELL / 2
                    );
                }
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
        for (const bullet of this.bullets) {
            ctx.fillRect(
                bullet.x - bullet.width / 2,
                bullet.y,
                bullet.width,
                bullet.height
            );
        }
        const centerX = this.cannon.x * CELL + CELL / 2;
        ctx.fillStyle = "#dddddd";
        ctx.fillRect(centerX - 9, FIELD_HEIGHT + 15, 18, 15);
        ctx.fillRect(centerX - 3, FIELD_HEIGHT + 3, 6, 16);
        if (this.gameOver) {
            ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
            ctx.fillRect(0, 0, canvas.width, FIELD_HEIGHT);
            ctx.fillStyle = "#fff";
            ctx.font = "24px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(
                "Игра окончена",
                canvas.width / 2,
                FIELD_HEIGHT / 2
            );
        }
    }
    loop(timestamp) {
        if (this.previousTime === null) {
            this.previousTime = timestamp;
        }
        const deltaMs = Math.min(timestamp - this.previousTime, 100);
        this.previousTime = timestamp;
        this.update(deltaMs);
        this.draw();
        requestAnimationFrame(this.loop.bind(this));
    }
}
class PresetPanel {
    constructor(game) {
        this.game = game;
        this.store = new PresetStore();
        this.list = document.getElementById("preset-list");
        this.form = document.getElementById("preset-form");
        this.name = document.getElementById("name");
        this.drop = document.getElementById("drop");
        this.spawn = document.getElementById("spawn");
        this.durability = document.getElementById("durability");
        this.message = document.getElementById("panel-message");
        this.fillForm(DEFAULT_PRESET);
        this.bindEvents();
        this.run(() => this.refresh());
    }
    run(action) {
        try {
            action();
        } catch (error) {
            this.message.textContent = `Ошибка: ${error.message}`;
            console.error(error);
        }
    }
    readForm() {
        if (!this.form.reportValidity()) {
            throw new Error("Проверьте поля формы.");
        }
        return this.store.validate({
            name: this.name.value,
            dropInterval: Number(this.drop.value),
            spawnInterval: Number(this.spawn.value),
            durability: Number(this.durability.value),
        });
    }
    fillForm(preset) {
        this.name.value = preset.name;
        this.drop.value = preset.dropInterval;
        this.spawn.value = preset.spawnInterval;
        this.durability.value = preset.durability;
    }
    refresh(selectedName = "") {
        const presets = this.store.getAll();
        this.list.replaceChildren();
        if (presets.length === 0) {
            const option = document.createElement("option");
            option.value = "";
            option.textContent = "Нет сохранённых пресетов";
            this.list.append(option);
            return;
        }
        for (const preset of presets) {
            const option = document.createElement("option");
            option.value = preset.name;
            option.textContent = preset.name;
            this.list.append(option);
        }
        if (presets.some(preset => preset.name === selectedName)) {
            this.list.value = selectedName;
        }
    }
    selectedPreset() {
        const preset = this.store.getAll().find(
            item => item.name === this.list.value
        );
        if (!preset) {
            throw new Error("Выберите сохранённый пресет.");
        }
        return preset;
    }
    bindEvents() {
        this.form.addEventListener("submit", event => {
            event.preventDefault();
            this.run(() => {
                const preset = this.readForm();
                this.store.create(preset);
                this.refresh(preset.name);
                this.message.textContent = "Пресет создан.";
            });
        });
        document.getElementById("load-btn").addEventListener("click", () => {
            this.run(() => {
                this.fillForm(this.selectedPreset());
                this.message.textContent = "Пресет открыт.";
            });
        });
        document.getElementById("update-btn").addEventListener("click", () => {
            this.run(() => {
                const selected = this.selectedPreset();
                const updated = this.readForm();
                this.store.update(selected.name, updated);
                this.refresh(updated.name);
                this.message.textContent = "Пресет обновлён.";
            });
        });
        document.getElementById("delete-btn").addEventListener("click", () => {
            this.run(() => {
                const selected = this.selectedPreset();
                if (!confirm(`Удалить пресет «${selected.name}»?`)) {
                    return;
                }
                this.store.delete(selected.name);
                this.refresh();
                this.message.textContent = "Пресет удалён.";
            });
        });
        document.getElementById("apply-btn").addEventListener("click", () => {
            this.run(() => {
                const selected = this.selectedPreset();
                this.fillForm(selected);
                this.game.reset(selected);
                this.message.textContent = "Пресет применён. Игра началась заново.";
            });
        });
    }
}
const game = new DefenseGame();
new PresetPanel(game);
window.addEventListener("keydown", event => {
    const tag = event.target.tagName;
    if (["INPUT", "SELECT", "TEXTAREA", "BUTTON"].includes(tag)) {
        return;
    }
    if (!["ArrowLeft", "ArrowRight", "Space"].includes(event.code)) {
        return;
    }
    event.preventDefault();
    if (game.gameOver) {
        return;
    }
    if (event.code === "ArrowLeft") {
        game.cannon.moveLeft();
    } else if (event.code === "ArrowRight") {
        game.cannon.moveRight();
    } else if (event.code === "Space" && !event.repeat) {
        game.shoot();
    }
});