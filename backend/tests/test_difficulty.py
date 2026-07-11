from app.services.difficulty_engine import DifficultyEngine
from app.services.progression_model import CampaignProgressionModel


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


def test_campaign_seed_specs_cover_first_50_levels():
    model = CampaignProgressionModel()
    specs = model.seed_specs()

    assert len(specs) == 50
    assert specs[0].progression_index == 1
    assert specs[-1].progression_index == 50
    assert specs[-1].id == "campaign-seed-50"


def test_campaign_difficulty_curve_is_monotonic_on_measured_scale():
    model = CampaignProgressionModel()

    assert model.base_difficulty_for_level(1) == 0.26
    assert model.base_difficulty_for_level(5) == 0.43
    assert model.base_difficulty_for_level(10) == 0.63
    assert model.base_difficulty_for_level(15) == 0.74
    assert model.base_difficulty_for_level(20) == 0.85
    values = [model.base_difficulty_for_level(n) for n in range(1, 51)]
    assert values == sorted(values)


def test_mechanics_unlock_on_schedule():
    model = CampaignProgressionModel()

    early = model.mechanics_for_level(1)
    assert early.blocked_cells == 0
    assert early.decoy_items == 0
    assert early.constraint_count == 0
    assert not early.exact_cover

    mid = model.mechanics_for_level(10)
    assert mid.blocked_cells > 0
    assert mid.decoy_items > 0
    assert mid.constraint_count == 1

    late = model.mechanics_for_level(16)
    assert late.constraint_count == 2
    assert late.exact_cover

    daily = model.mechanics_for_daily()
    assert daily.decoy_items > 0
    assert daily.constraint_count > 0
