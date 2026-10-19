import pygame
from config import (
    GRID_W, GRID_H, CELL, TOP_MARGIN,
    GRID_LINE, CANNON_COLOR, BULLET_COLOR
)
from mechanics import piece_cells
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
    base_y = TOP_MARGIN + GRID_H * 30 + 12  # CELL = 30 (можно взять из config, если хочешь)
    body = pygame.Rect(cannon_x * 30 + 6, base_y, 30 - 12, 18)
    barrel = pygame.Rect(cannon_x * 30 + 30 // 2 - 4, base_y - 14, 8, 16)
    pygame.draw.rect(screen, CANNON_COLOR, body, border_radius=4)
    pygame.draw.rect(screen, CANNON_COLOR, barrel, border_radius=3)
def draw_bullet(screen, bullet):
    if bullet is None:
        return
    x, y = bullet["pos"]
    rect = pygame.Rect(
        x * 30 + 30 // 2 - 3,
        TOP_MARGIN + y * 30 + 6,
        6,
        30 - 12
    )
    pygame.draw.rect(screen, BULLET_COLOR, rect, border_radius=3)