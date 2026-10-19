from pathlib import Path
import pygame
import config
from shapes_loader import load_shapes
from logger import log_game_over
from mechanics import (
    empty_grid, spawn_piece, valid_piece_position, lock_piece,
    clear_full_rows, bullet_hit_falling_piece_and_remove
)
from render import draw_grid, draw_piece, draw_cannon, draw_bullet
def main():
    pygame.init()
    screen = pygame.display.set_mode((config.WIDTH, config.HEIGHT))
    pygame.display.set_caption("Тетрис-защита")
    clock = pygame.time.Clock()
    font = pygame.font.SysFont(None, 22)
    shapes_path = Path(__file__).with_name("shapes.json")
    shapes = load_shapes(shapes_path)
    grid = empty_grid()
    piece = spawn_piece(grid, shapes)
    cannon_x = config.GRID_W // 2
    bullet = None
    score = 0
    shots = 0
    session_start_ms = pygame.time.get_ticks()
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
                    cannon_x = min(config.GRID_W - 1, cannon_x + 1)
                elif event.key == pygame.K_SPACE:
                    if bullet is None:
                        bullet = {"pos": [cannon_x, config.GRID_H - 1]}
                        shots += 1
        if piece is None:
            duration = (now - session_start_ms) / 1000.0
            log_game_over(score=score, duration_sec=duration, shots=shots, path="defense.log")
            running = False
            continue
        if now - last_drop >= config.DROP_INTERVAL_MS:
            last_drop = now
            if piece is not None and len(piece["blocks"]) > 0:
                piece["origin"][1] += 1
                if not valid_piece_position(piece, grid):
                    piece["origin"][1] -= 1
                    lock_piece(piece, grid)
                    cleared = clear_full_rows(grid)
                    score += cleared * config.SCORE_ROW
                    piece = spawn_piece(grid, shapes)
            else:
                piece = spawn_piece(grid, shapes)
        if bullet is not None and now - last_bullet >= config.BULLET_STEP_MS:
            last_bullet = now
            bx, by = bullet["pos"]
            if bullet_hit_falling_piece_and_remove(piece, bx, by):
                bullet = None
                score += config.SCORE_HIT
            else:
                bullet["pos"][1] -= 1
                if bullet["pos"][1] < 0:
                    bullet = None
        screen.fill(config.BG)
        draw_grid(screen, grid)
        draw_piece(screen, piece)
        draw_bullet(screen, bullet)
        draw_cannon(screen, cannon_x)
        duration = (now - session_start_ms) / 1000.0
        hud = f"A/D: пушка | Space: выстрел | score: {score} | shots: {shots} | time: {duration:.1f}s"
        screen.blit(font.render(hud, True, (210, 210, 220)), (10, 2))
        pygame.display.flip()
    pygame.quit()
if __name__ == "__main__":
    main()