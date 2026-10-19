import json
class ShapesFormatError(ValueError):
    pass
def _validate_mask(mask):
    if not isinstance(mask, list) or not mask:
        raise ShapesFormatError("mask должен быть непустым списком строк (list[list[int]]).")
    if not all(isinstance(row, list) and row for row in mask):
        raise ShapesFormatError("Каждая строка mask должна быть непустым list[int].")
    w = len(mask[0])
    if any(len(row) != w for row in mask):
        raise ShapesFormatError("mask должна быть прямоугольной (все строки одной длины).")
    ones = 0
    for row in mask:
        for v in row:
            if v not in (0, 1):
                raise ShapesFormatError("mask должна содержать только 0/1.")
            ones += v
    if ones == 0:
        raise ShapesFormatError("mask должна содержать хотя бы одну '1'.")
def _mask_to_blocks(mask):
    blocks = []
    for y, row in enumerate(mask):
        for x, v in enumerate(row):
            if v == 1:
                blocks.append((x, y))
    return blocks
def load_shapes(json_path):
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, list) or not data:
        raise ShapesFormatError("JSON должен быть непустым списком фигур.")
    shapes = []
    for i, item in enumerate(data):
        if not isinstance(item, dict):
            raise ShapesFormatError(f"Фигура #{i}: ожидался объект (dict).")
        name = item.get("name", f"shape_{i}")
        mask = item.get("mask")
        color = item.get("color", [200, 200, 200])
        _validate_mask(mask)
        if (not isinstance(color, list)) or len(color) != 3 or any(not isinstance(c, int) for c in color):
            raise ShapesFormatError(f"Фигура {name}: color должен быть [r,g,b] из int.")
        blocks = _mask_to_blocks(mask)
        shapes.append(
            {
                "name": str(name),
                "blocks": blocks,
                "color": (int(color[0]), int(color[1]), int(color[2])),
            }
        )
    return shapes