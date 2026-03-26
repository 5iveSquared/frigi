from app.services.difficulty_engine import DifficultyEngine


def test_elo_update_improves_on_good_performance():
    engine = DifficultyEngine()
    new_elo, actual_perf = engine.update_elo(1000, optimal_score=1000, player_score=900)
    # Player scored 90% of optimal — should gain some elo
    assert isinstance(new_elo, float)
    assert 0.0 <= actual_perf <= 1.0


def test_difficulty_sigmoid_bounds():
    engine = DifficultyEngine()
    # Very low elo → min difficulty
    assert engine.next_difficulty(0) >= engine.MIN_DIFFICULTY
    # Very high elo → max difficulty
    assert engine.next_difficulty(3000) <= engine.MAX_DIFFICULTY


def test_default_elo_gives_mid_difficulty():
    engine = DifficultyEngine()
    diff = engine.next_difficulty(1000)
    # At default elo, difficulty should be ~0.5
    assert 0.45 <= diff <= 0.55
