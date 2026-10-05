import random
import pygame
GRID_W, GRID_H = 10, 20
CELL = 30
TOP_MARGIN = 20
BOTTOM_UI = 70
WIDTH = GRID_W * CELL
HEIGHT = TOP_MARGIN + GRID_H * CELL + BOTTOM_UI
DROP_INTERVAL_MS = 1000
BULLET_STEP_MS = 25
BG = (18, 18, 22)
GRID_LINE = (55, 55, 65)
CANNON_COLOR = (220, 220, 220)
BULLET_COLOR = (255, 220, 60)
SHAPES = [
    ([(0, 0), (1, 0), (2, 0), (3, 0)], (80, 200, 240)),
    ([(0, 0), (1, 0), (0, 1), (1, 1)], (240, 220, 80)),
    ([(1, 0), (0, 1), (1, 1), (2, 1)], (180, 80, 220)),
    ([(0, 0), (0, 1), (0, 2), (1, 2)], (240, 140, 60)),
    ([(1, 0), (1, 1), (1, 2), (0, 2)], (80, 120, 240)),
    ([(1, 0), (2, 0), (0, 1), (1, 1)], (80, 220, 120)),
    ([(0, 0), (1, 0), (1, 1), (2, 1)], (240, 80, 80)),
]
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
def spawn_piece(grid):
    blocks, color = random.choice(SHAPES)
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
def draw_grid(screen, grid):
    for y in range(GRID_H):
        for x in range(GRID_W):
            rect = pygame.Rect(x * CELL, TOP_MARGIN + y * CELL, CELL, CELL)
            col = grid[y][x]
            if col is not None:
                pygame.draw.rect(screen, col, rect.inflate(-2, -2))
    for x in range(GRID_W + 1):
        pygame.draw.line(
            screen, GRID_LINE,
            (x * CELL, TOP_MARGIN),
            (x * CELL, TOP_MARGIN + GRID_H * CELL), 1
        )
    for y in range(GRID_H + 1):
        pygame.draw.line(
            screen, GRID_LINE,
            (0, TOP_MARGIN + y * CELL),
            (GRID_W * CELL, TOP_MARGIN + y * CELL), 1
        )
def draw_piece(screen, piece):
    if piece is None:
        return
    for x, y in piece_cells(piece):
        rect = pygame.Rect(x * CELL, TOP_MARGIN + y * CELL, CELL, CELL)
        pygame.draw.rect(screen, piece["color"], rect.inflate(-2, -2))
def draw_cannon(screen, cannon_x):
    base_y = TOP_MARGIN + GRID_H * CELL + 12
    body = pygame.Rect(cannon_x * CELL + 6, base_y, CELL - 12, 18)
    barrel = pygame.Rect(cannon_x * CELL + CELL // 2 - 4, base_y - 14, 8, 16)
    pygame.draw.rect(screen, CANNON_COLOR, body, border_radius=4)
    pygame.draw.rect(screen, CANNON_COLOR, barrel, border_radius=3)
def draw_bullet(screen, bullet):
    if bullet is None:
        return
    x, y = bullet["pos"]
    rect = pygame.Rect(
        x * CELL + CELL // 2 - 3,
        TOP_MARGIN + y * CELL + 6,
        6,
        CELL - 12
    )
    pygame.draw.rect(screen, BULLET_COLOR, rect, border_radius=3)
def bullet_hit_falling_piece_and_remove(piece, bx, by):
    if piece is None:
        return False
    ox, oy = piece["origin"]
    for i, (dx, dy) in enumerate(piece["blocks"]):
        if ox + dx == bx and oy + dy == by:
            piece["blocks"].pop(i)
            return True
    return False
def main():
    pygame.init()
    screen = pygame.display.set_mode((WIDTH, HEIGHT))
    pygame.display.set_caption("Лабораторная 1")
    clock = pygame.time.Clock()
    font = pygame.font.SysFont(None, 22)
    grid = empty_grid()
    piece = spawn_piece(grid)
    cannon_x = GRID_W
    bullet = None
    last_drop = pygame.time.get_ticks()
    last_bullet = pygame.time.get_ticks()
    running = True
    while running:
        clock.tick(60)
        now = pygame.time.get_ticks()
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_a:
                    cannon_x = max(0, cannon_x - 1)
                elif event.key == pygame.K_d:
                    cannon_x = min(GRID_W - 1, cannon_x + 1)
                elif event.key == pygame.K_SPACE:
                    if bullet is None:
                        bullet = {"pos": [cannon_x, GRID_H - 1]}
        if piece is None:
            grid = empty_grid()
            piece = spawn_piece(grid)
        if now - last_drop >= DROP_INTERVAL_MS:
            last_drop = now
            if piece is not None and len(piece["blocks"]) > 0:
                piece["origin"][1] += 1
                if not valid_piece_position(piece, grid):
                    piece["origin"][1] -= 1
                    lock_piece(piece, grid)
                    clear_full_rows(grid)
                    piece = spawn_piece(grid)
            else:
                piece = spawn_piece(grid)
        if bullet is not None and now - last_bullet >= BULLET_STEP_MS:
            last_bullet = now
            bx, by = bullet["pos"]
            if bullet_hit_falling_piece_and_remove(piece, bx, by):
                bullet = None
                clear_full_rows(grid)
            else:
                bullet["pos"][1] -= 1
                if bullet["pos"][1] < 0:
                    bullet = None
        screen.fill(BG)
        draw_grid(screen, grid)
        draw_piece(screen, piece)
        draw_bullet(screen, bullet)
        draw_cannon(screen, cannon_x)
        text = "A/D: пушка | Space: выстрел"
        screen.blit(font.render(text, True, (210, 210, 220)), (10, 2))
        pygame.display.flip()
    pygame.quit()
if __name__ == "__main__":
    main()