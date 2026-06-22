from app.services.game_master import GameMasterService, LevelAudit


def test_game_master_campaign_review_flags_no_blocking_errors():
    report = GameMasterService().review_campaign()

    assert report.passed
    assert len(report.levels) == 50
    assert len({level.signature for level in report.levels}) == len(report.levels)
    assert all(
        previous.difficulty <= current.difficulty
        for previous, current in zip(report.levels, report.levels[1:])
    )


def test_game_master_flags_repeated_signature_and_difficulty_drop():
    service = GameMasterService()
    levels = (
        _audit(id="level-1", difficulty=0.5, signature="same"),
        _audit(id="level-2", progression_index=2, difficulty=0.4, signature="same"),
    )

    issues = service._find_issues(levels)

    assert any(issue.severity == "error" and "repeats" in issue.message for issue in issues)
    assert any(issue.severity == "error" and "Difficulty decreased" in issue.message for issue in issues)


def _audit(
    id: str,
    difficulty: float,
    signature: str,
    progression_index: int = 1,
) -> LevelAudit:
    return LevelAudit(
        id=id,
        progression_index=progression_index,
        difficulty=difficulty,
        theme="kitchen",
        rows=5,
        cols=4,
        item_ids=("milk", "cheese", "butter"),
        item_signatures=("milk:1/1:cold", "cheese:11:any", "butter:1:shelf"),
        zone_requirements=("any", "cold", "shelf"),
        constraint_ids=(),
        item_area=5,
        fill_ratio=0.25,
        complexity_score=5.0,
        signature=signature,
    )
