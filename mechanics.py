import random
from config import GRID_W, GRID_H
def empty_grid():
    return [[None for _ in range(GRID_W)] for _ in range(GRID_H)]
def piece_cells(piece):
    ox, oy = piece["origin"]
    return [(ox + dx, oy + dy) for (dx, dy) in piece["blocks"]]
def valid_piece_position(piece, grid):
    for x, y in piece_cells(piece):
        if x < 0 or x >= GRID_W or y < 0 or y >= GRID_H:
            return False
        if grid[y][x] is not None:
            return False
    return True
def spawn_piece(grid, shapes):
    shape = random.choice(shapes)
    blocks = shape["blocks"]
    color = shape["color"]
    min_dx = min(dx for dx, dy in blocks)
    max_dx = max(dx for dx, dy in blocks)
    ox_min = -min_dx
    ox_max = (GRID_W - 1) - max_dx
    ox = random.randint(ox_min, ox_max)
    oy = 0
    piece = {"origin": [ox, oy], "blocks": blocks[:], "color": color}
    if not valid_piece_position(piece, grid):
        return None
    return piece
def lock_piece(piece, grid):
    for x, y in piece_cells(piece):
        if 0 <= x < GRID_W and 0 <= y < GRID_H:
            grid[y][x] = piece["color"]
def clear_full_rows(grid):
    new_rows = [row for row in grid if not all(cell is not None for cell in row)]
    cleared = GRID_H - len(new_rows)
    for _ in range(cleared):
        new_rows.insert(0, [None for _ in range(GRID_W)])
    grid[:] = new_rows
    return cleared
def bullet_hit_falling_piece_and_remove(piece, bx, by):
    if piece is None:
        return False
    ox, oy = piece["origin"]
    for i, (dx, dy) in enumerate(piece["blocks"]):
        if ox + dx == bx and oy + dy == by:
            piece["blocks"].pop(i)
            return True
    return False