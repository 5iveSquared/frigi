from dataclasses import dataclass

from app.services.carve_generator import CarveGenerator
from app.services.progression_model import CampaignProgressionModel, CampaignSeedSpec


@dataclass(frozen=True)
class LevelAudit:
    id: str
    progression_index: int
    difficulty: float
    measured_difficulty: float
    theme: str
    rows: int
    cols: int
    item_ids: tuple[str, ...]
    item_signatures: tuple[str, ...]
    zone_requirements: tuple[str, ...]
    constraint_ids: tuple[str, ...]
    item_area: int
    fill_ratio: float
    solution_count: int
    backtracks: int
    blocked_cells: int
    signature: str


@dataclass(frozen=True)
class GameMasterIssue:
    severity: str
    level_id: str
    message: str


@dataclass(frozen=True)
class GameMasterReport:
    levels: tuple[LevelAudit, ...]
    issues: tuple[GameMasterIssue, ...]

    @property
    def passed(self) -> bool:
        return not any(issue.severity == "error" for issue in self.issues)


class GameMasterService:
    MEASURED_BAND_ERROR = 0.15
    MEASURED_BAND_WARNING = 0.08

    def __init__(
        self,
        progression_model: CampaignProgressionModel | None = None,
        generator: CarveGenerator | None = None,
    ):
        self.progression_model = progression_model or CampaignProgressionModel()
        self.generator = generator or CarveGenerator()

    def review_campaign(self, count: int | None = None) -> GameMasterReport:
        specs = self.progression_model.seed_specs(count)
        audits: list[LevelAudit] = []
        issues: list[GameMasterIssue] = []
        for spec in specs:
            try:
                audits.append(self._audit_seed(spec))
            except RuntimeError as error:
                issues.append(
                    GameMasterIssue(severity="error", level_id=spec.id, message=str(error))
                )
        issues.extend(self._find_issues(tuple(audits)))
        return GameMasterReport(levels=tuple(audits), issues=tuple(issues))

    def _audit_seed(self, seed: CampaignSeedSpec) -> LevelAudit:
        mechanics = self.progression_model.mechanics_for_level(seed.progression_index)
        carve = self.generator.generate(
            difficulty=seed.difficulty,
            theme=seed.theme,
            mechanics=mechanics,
            seed_key=seed.id,
        )
        level = carve.level_data
        grid = level["grid"]
        items = level["items"]
        rows = grid["rows"]
        cols = grid["cols"]
        blocked_cells = sum(
            1 for row in grid["cells"] for cell in row if cell.get("blocked")
        )
        item_area = sum(self._item_area(item) for item in items)
        packable = rows * cols - blocked_cells
        zone_requirements = tuple(
            sorted(item.get("zoneRequirement") or "any" for item in items)
        )
        item_ids = tuple(sorted(item["id"] for item in items))
        item_signatures = tuple(sorted(self._item_signature(item) for item in items))
        constraint_ids = tuple(sorted(constraint["id"] for constraint in level.get("constraints", [])))

        return LevelAudit(
            id=seed.id,
            progression_index=seed.progression_index,
            difficulty=seed.difficulty,
            measured_difficulty=carve.measured,
            theme=seed.theme,
            rows=rows,
            cols=cols,
            item_ids=item_ids,
            item_signatures=item_signatures,
            zone_requirements=zone_requirements,
            constraint_ids=constraint_ids,
            item_area=item_area,
            fill_ratio=round(item_area / packable, 3) if packable else 0.0,
            solution_count=carve.solution_count,
            backtracks=carve.backtracks,
            blocked_cells=blocked_cells,
            signature=self._signature(
                rows=rows,
                cols=cols,
                theme=seed.theme,
                item_signatures=item_signatures,
                constraint_ids=constraint_ids,
            ),
        )

    def _find_issues(self, levels: tuple[LevelAudit, ...]) -> list[GameMasterIssue]:
        issues: list[GameMasterIssue] = []
        seen_signatures: dict[str, str] = {}
        previous: LevelAudit | None = None

        for level in levels:
            if level.signature in seen_signatures:
                issues.append(
                    GameMasterIssue(
                        severity="error",
                        level_id=level.id,
                        message=f"Level repeats layout/items from {seen_signatures[level.signature]}",
                    )
                )
            seen_signatures[level.signature] = level.id

            band_gap = abs(level.measured_difficulty - level.difficulty)
            if band_gap > self.MEASURED_BAND_ERROR:
                issues.append(
                    GameMasterIssue(
                        severity="error",
                        level_id=level.id,
                        message=(
                            f"Measured difficulty {level.measured_difficulty} is far from "
                            f"target {level.difficulty}"
                        ),
                    )
                )
            elif band_gap > self.MEASURED_BAND_WARNING:
                issues.append(
                    GameMasterIssue(
                        severity="warning",
                        level_id=level.id,
                        message=(
                            f"Measured difficulty {level.measured_difficulty} drifts from "
                            f"target {level.difficulty}"
                        ),
                    )
                )

            if previous:
                if level.difficulty < previous.difficulty:
                    issues.append(
                        GameMasterIssue(
                            severity="error",
                            level_id=level.id,
                            message="Difficulty decreased from previous level",
                        )
                    )

                if level.item_ids == previous.item_ids:
                    issues.append(
                        GameMasterIssue(
                            severity="warning",
                            level_id=level.id,
                            message="Item set matches previous level",
                        )
                    )

                if level.rows == previous.rows and level.cols == previous.cols and level.theme == previous.theme:
                    issues.append(
                        GameMasterIssue(
                            severity="warning",
                            level_id=level.id,
                            message="Grid size and theme match previous level",
                        )
                    )

            previous = level

        return issues

    def _signature(
        self,
        rows: int,
        cols: int,
        theme: str,
        item_signatures: tuple[str, ...],
        constraint_ids: tuple[str, ...],
    ) -> str:
        return "|".join(
            [
                f"{rows}x{cols}",
                theme,
                ",".join(item_signatures),
                ",".join(constraint_ids),
            ]
        )

    def _item_signature(self, item: dict) -> str:
        shape = "/".join("".join(str(cell) for cell in row) for row in item["shape"])
        zone = item.get("zoneRequirement") or "any"
        return f"{item['id']}:{shape}:{zone}"

    def _item_area(self, item: dict) -> int:
        return sum(sum(row) for row in item["shape"])
