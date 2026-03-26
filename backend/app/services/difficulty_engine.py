import math


class DifficultyEngine:
    DEFAULT_ELO = 1000.0
    K_FACTOR = 32.0
    SCALE = 400.0
    SIGMOID_SCALE = 200.0
    MIN_DIFFICULTY = 0.1
    MAX_DIFFICULTY = 0.95

    def update_elo(
        self,
        old_elo: float,
        player_score: int,
        optimal_score: int,
    ) -> tuple[float, float]:
        if optimal_score <= 0:
            return old_elo, 0.5

        expected_perf = 1 / (1 + 10 ** ((optimal_score - player_score) / self.SCALE))
        actual_perf = min(player_score / optimal_score, 1.0)
        new_elo = old_elo + self.K_FACTOR * (actual_perf - expected_perf)
        return new_elo, actual_perf

    def next_difficulty(self, new_elo: float) -> float:
        raw = 1 / (1 + math.exp(-(new_elo - self.DEFAULT_ELO) / self.SIGMOID_SCALE))
        return max(self.MIN_DIFFICULTY, min(self.MAX_DIFFICULTY, raw))
