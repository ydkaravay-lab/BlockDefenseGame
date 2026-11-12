export class FallingShape {
    constructor(mask, x, y = 0, color = "cyan") {
        if (
            !Array.isArray(mask) ||
            mask.length === 0 ||
            !Array.isArray(mask[0]) ||
            mask[0].length === 0
        ) {
            throw new Error("Маска должна быть непустой матрицей.");
        }
        const width = mask[0].length;
        if (
            mask.some(
                row =>
                    !Array.isArray(row) ||
                    row.length !== width ||
                    row.some(cell => cell !== 0 && cell !== 1)
            )
        ) {
            throw new Error("Маска должна быть прямоугольной и содержать только 0 и 1.");
        }
        this.blocks = [];
        mask.forEach((row, dy) => {
            row.forEach((cell, dx) => {
                if (cell === 1) {
                    this.blocks.push({ x: dx, y: dy });
                }
            });
        });
        if (this.blocks.length === 0) {
            throw new Error("Фигура должна содержать хотя бы один кубик.");
        }
        this.x = x;
        this.y = y;
        this.color = color;
    }
    getCells() {
        return this.blocks.map(block => ({
            x: this.x + block.x,
            y: this.y + block.y,
        }));
    }
    removeCell(x, y) {
        const index = this.blocks.findIndex(
            block => this.x + block.x === x && this.y + block.y === y
        );
        if (index === -1) {
            return false;
        }
        this.blocks.splice(index, 1);
        return true;
    }
    isEmpty() {
        return this.blocks.length === 0;
    }
}