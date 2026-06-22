from dataclasses import dataclass

from app.services.level_generator import LevelGeneratorService
from app.services.progression_model import CampaignProgressionModel, CampaignSeedSpec


@dataclass(frozen=True)
class LevelAudit:
    id: str
    progression_index: int
    difficulty: float
    theme: str
    rows: int
    cols: int
    item_ids: tuple[str, ...]
    item_signatures: tuple[str, ...]
    zone_requirements: tuple[str, ...]
    constraint_ids: tuple[str, ...]
    item_area: int
    fill_ratio: float
    complexity_score: float
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
    def __init__(
        self,
        progression_model: CampaignProgressionModel | None = None,
        generator: LevelGeneratorService | None = None,
    ):
        self.progression_model = progression_model or CampaignProgressionModel()
        self.generator = generator or LevelGeneratorService(db=None)

    def review_campaign(self, count: int | None = None) -> GameMasterReport:
        specs = self.progression_model.seed_specs(count)
        audits = tuple(self._audit_seed(spec) for spec in specs)
        return GameMasterReport(levels=audits, issues=tuple(self._find_issues(audits)))

    def _audit_seed(self, seed: CampaignSeedSpec) -> LevelAudit:
        raw = self.generator._generate_procedural_level(
            difficulty=seed.difficulty,
            theme=seed.theme,
            player_id=seed.id,
            seed_key=seed.id,
        )
        level = self.generator._normalize_level_data(raw)
        grid = level["grid"]
        items = level["items"]
        rows = grid["rows"]
        cols = grid["cols"]
        item_area = sum(self._item_area(item) for item in items)
        fill_ratio = item_area / (rows * cols)
        zone_requirements = tuple(
            sorted(item.get("zoneRequirement") or "any" for item in items)
        )
        item_ids = tuple(sorted(item["id"] for item in items))
        item_signatures = tuple(sorted(self._item_signature(item) for item in items))
        constraint_ids = tuple(sorted(constraint["id"] for constraint in level.get("constraints", [])))
        complexity_score = self._complexity_score(
            grid_area=rows * cols,
            item_area=item_area,
            item_count=len(items),
            constrained_item_count=sum(1 for item in items if item.get("zoneRequirement")),
            awkward_item_count=sum(1 for item in items if self._is_awkward_shape(item["shape"])),
        )

        return LevelAudit(
            id=seed.id,
            progression_index=seed.progression_index,
            difficulty=seed.difficulty,
            theme=seed.theme,
            rows=rows,
            cols=cols,
            item_ids=item_ids,
            item_signatures=item_signatures,
            zone_requirements=zone_requirements,
            constraint_ids=constraint_ids,
            item_area=item_area,
            fill_ratio=round(fill_ratio, 3),
            complexity_score=round(complexity_score, 3),
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
        previous_complexity_peak = 0.0

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

            if level.progression_index <= 10:
                minimum_expected_complexity = previous_complexity_peak - 0.75
                if level.complexity_score < minimum_expected_complexity:
                    issues.append(
                        GameMasterIssue(
                            severity="warning",
                            level_id=level.id,
                            message="Complexity dropped sharply for an early campaign level",
                        )
                    )
                previous_complexity_peak = max(previous_complexity_peak, level.complexity_score)

            previous = level

        return issues

    def _complexity_score(
        self,
        grid_area: int,
        item_area: int,
        item_count: int,
        constrained_item_count: int,
        awkward_item_count: int,
    ) -> float:
        fill_pressure = item_area / grid_area
        return (
            fill_pressure * 10
            + item_count * 0.7
            + constrained_item_count * 0.8
            + awkward_item_count * 0.6
        )

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

    def _is_awkward_shape(self, shape: list[list[int]]) -> bool:
        filled = [(r, c) for r, row in enumerate(shape) for c, value in enumerate(row) if value]
        if len(filled) <= 2:
            return False
        rows = {row for row, _ in filled}
        cols = {col for _, col in filled}
        return len(rows) > 1 and len(cols) > 1
