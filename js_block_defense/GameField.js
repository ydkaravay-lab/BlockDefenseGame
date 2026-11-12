export class GameField {
    constructor(width = 10, height = 20) {
        if (
            !Number.isInteger(width) || width <= 0 ||
            !Number.isInteger(height) || height <= 0
        ) {
            throw new Error("Размеры стакана должны быть положительными целыми числами.");
        }
        this.width = width;
        this.height = height;
        this.grid = Array.from(
            { length: height },
            () => Array(width).fill(null)
        );
    }
    canPlace(shape, offsetX = 0, offsetY = 0) {
        return shape.getCells().every(cell => {
            const x = cell.x + offsetX;
            const y = cell.y + offsetY;
            if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
                return false;
            }
            return this.grid[y][x] === null;
        });
    }
    drop(shape) {
        if (shape.isEmpty() || !this.canPlace(shape, 0, 1)) {
            return false;
        }
        shape.y += 1;
        return true;
    }
    lock(shape) {
        if (shape.isEmpty() || !this.canPlace(shape)) {
            throw new Error("Нельзя зафиксировать фигуру в этой позиции.");
        }
        for (const { x, y } of shape.getCells()) {
            this.grid[y][x] = shape.color;
        }
    }
    clearFullRows() {
        const remaining = this.grid.filter(
            row => !row.every(cell => cell !== null)
        );
        const cleared = this.height - remaining.length;
        const emptyRows = Array.from(
            { length: cleared },
            () => Array(this.width).fill(null)
        );
        this.grid = [...emptyRows, ...remaining];
        return cleared;
    }
}