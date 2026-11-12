import { GameField } from "./GameField.js";
import { FallingShape } from "./FallingShape.js";
import { Cannon } from "./Cannon.js";
const field = new GameField(10, 20);
const cannon = new Cannon(field.width);
const shapes = [
    { mask: [[1, 1, 1, 1]], color: "cyan" },
    { mask: [[1, 1], [1, 1]], color: "yellow" },
    { mask: [[0, 1, 0], [1, 1, 1]], color: "purple" },
    { mask: [[1, 0], [1, 0], [1, 1]], color: "orange" },
];
function createShape() {
    const template = shapes[Math.floor(Math.random() * shapes.length)];
    const shapeWidth = template.mask[0].length;
    const x = Math.floor(Math.random() * (field.width - shapeWidth + 1));
    return new FallingShape(template.mask, x, 0, template.color);
}
let currentShape = createShape();
const timer = setInterval(() => {
    if (currentShape.isEmpty()) {
        currentShape = createShape();
        if (!field.canPlace(currentShape)) {
            console.log("Игра окончена: нет места для новой фигуры.");
            clearInterval(timer);
        }
        return;
    }
    if (!field.drop(currentShape)) {
        field.lock(currentShape);
        const cleared = field.clearFullRows();
        if (cleared > 0) {
            console.log(`Очищено рядов: ${cleared}`);
        }
        currentShape = createShape();
        if (!field.canPlace(currentShape)) {
            console.log("Игра окончена: нет места для новой фигуры.");
            clearInterval(timer);
            return;
        }
    }
    console.log("Падающая фигура:", currentShape.getCells());
    console.log("Стакан:", field.grid);
}, 1000);