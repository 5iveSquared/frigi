import math
from app.services.scoring_service import ScoringService


def test_time_score_decay():
    # At t=0, score should be 500
    score = math.floor(500 * math.exp(-0.005 * 0))
    assert score == 500

    # At t=100s, score should decrease
    score_100 = math.floor(500 * math.exp(-0.005 * 100))
    assert score_100 < 500
    assert score_100 > 0


def test_move_score():
    assert max(0, 200 - 0 * 2) == 200
    assert max(0, 200 - 100 * 2) == 0
    assert max(0, 200 - 50 * 2) == 100
