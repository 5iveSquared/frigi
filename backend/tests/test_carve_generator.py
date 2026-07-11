from app.services.carve_generator import CarveGenerator
from app.services.pack_solver import PackSolver
from app.services.progression_model import CampaignProgressionModel, MechanicProfile


def _generate(level_number: int, seed: str = "test"):
    model = CampaignProgressionModel()
    return CarveGenerator().generate(
        difficulty=model.base_difficulty_for_level(level_number),
        theme="kitchen",
        mechanics=model.mechanics_for_level(level_number),
        seed_key=f"{seed}-{level_number}",
    )


def test_carved_levels_are_solvable_by_construction():
    for level_number in (1, 7, 14, 20):
        result = _generate(level_number)
        solution_ids = {p["itemId"] for p in result.solution}
        real_items = [i for i in result.level_data["items"] if i["id"] in solution_ids]
        report = PackSolver().solve(result.level_data["grid"], real_items)
        assert report.solvable, f"level {level_number} unsolvable"


def test_known_solution_matches_emitted_items():
    result = _generate(10)
    items_by_id = {item["id"]: item for item in result.level_data["items"]}
    for placement in result.solution:
        item = items_by_id[placement["itemId"]]
        assert item["shape"] == [list(row) for row in placement["shape"]]


def test_decoys_cannot_join_a_full_pack():
    result = _generate(14)
    solution_ids = {p["itemId"] for p in result.solution}
    decoys = [i for i in result.level_data["items"] if i["id"] not in solution_ids]
    if not decoys:
        return
    grid = result.level_data["grid"]
    packable = sum(
        1 for row in grid["cells"] for cell in row if not cell.get("blocked")
    )
    solution_area = sum(
        sum(cell for row in p["shape"] for cell in row) for p in result.solution
    )
    slack = packable - solution_area
    for decoy in decoys:
        decoy_area = sum(sum(row) for row in decoy["shape"])
        assert decoy_area > slack


def test_generation_is_deterministic_per_seed():
    first = _generate(8, seed="determinism")
    second = _generate(8, seed="determinism")
    assert first.level_data == second.level_data
    assert first.optimal_score == second.optimal_score


def test_constraints_are_satisfied_by_the_known_solution():
    from app.services.constraint_engine import evaluate_constraints

    result = _generate(16)
    constraints = result.level_data["constraints"]
    assert constraints, "L16 should carry constraints"
    placed = [
        {
            "id": p["itemId"],
            "anchorRow": p["anchorRow"],
            "anchorCol": p["anchorCol"],
            "rotatedShape": p["shape"],
        }
        for p in result.solution
    ]
    results = evaluate_constraints(result.level_data["grid"], placed, constraints)
    assert all(r.satisfied for r in results)


def test_early_levels_have_no_extra_mechanics():
    result = _generate(1)
    grid = result.level_data["grid"]
    assert all(not cell["blocked"] for row in grid["cells"] for cell in row)
    assert result.level_data["constraints"] == []
    solution_ids = {p["itemId"] for p in result.solution}
    assert all(item["id"] in solution_ids for item in result.level_data["items"])
