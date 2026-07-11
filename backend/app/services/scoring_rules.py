"""Score formula constants shared by the generator (par computation) and the
scoring service. Mirrors shared/src/constants/scoring.ts SCORE_WEIGHTS."""

PACKING_MULTIPLIER = 10
TIME_BASE = 500
TIME_DECAY = 0.005
MOVE_BASE = 200
MOVE_PENALTY = 2

# Par assumes a clean run: one move per item and a brisk-but-human solve time
# (~70s). Used when computing a level's optimal_score.
PAR_TIME_BONUS = 250
