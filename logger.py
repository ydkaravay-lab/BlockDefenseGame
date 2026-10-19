from datetime import datetime
def log_game_over(score: int, duration_sec: float, shots: int, path: str = "defense.log") -> None:
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{ts}] score={score} duration={duration_sec:.1f}s shots={shots}\n"
    with open(path, "a", encoding="utf-8") as f:
        f.write(line)