export class Cannon {
    constructor(fieldWidth, x = Math.floor(fieldWidth / 2)) {
        if (
            !Number.isInteger(fieldWidth) || fieldWidth <= 0 ||
            !Number.isInteger(x) || x < 0 || x >= fieldWidth
        ) {
            throw new Error("Некорректная позиция или ширина поля.");
        }
        this.fieldWidth = fieldWidth;
        this.x = x;
        this.shots = 0;
    }
    moveLeft() {
        this.x = Math.max(0, this.x - 1);
    }
    moveRight() {
        this.x = Math.min(this.fieldWidth - 1, this.x + 1);
    }
    shoot(shape) {
        this.shots += 1;
        if (!shape || shape.isEmpty()) {
            return null;
        }
        const targets = shape.getCells().filter(cell => cell.x === this.x);
        if (targets.length === 0) {
            return null;
        }
        const target = targets.reduce(
            (lowest, cell) => cell.y > lowest.y ? cell : lowest
        );
        shape.removeCell(target.x, target.y);
        return target;
    }
}