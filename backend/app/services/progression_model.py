from dataclasses import dataclass


@dataclass(frozen=True)
class CampaignSeedSpec:
    id: str
    progression_index: int
    difficulty: float
    theme: str


@dataclass(frozen=True)
class MechanicProfile:
    """Which mechanics are active for a level. New mechanics unlock on a
    schedule so the campaign introduces novelty, not just a bigger grid."""

    blocked_cells: int
    decoy_items: int
    constraint_count: int
    exact_cover: bool


class CampaignProgressionModel:
    SEED_LEVEL_COUNT = 50
    # Difficulty values live on the measured scale produced by
    # pack_solver.measured_difficulty — recalibrate them together.
    MAX_DIFFICULTY = 0.85
    _MILESTONES: tuple[tuple[int, float], ...] = (
        (1, 0.26),
        (2, 0.30),
        (3, 0.34),
        (4, 0.38),
        (5, 0.43),
        (6, 0.47),
        (7, 0.51),
        (8, 0.55),
        (9, 0.59),
        (10, 0.63),
        (15, 0.74),
        (20, MAX_DIFFICULTY),
    )
    _THEME_CYCLE: tuple[str, ...] = (
        "kitchen",
        "meal_prep",
        "grocery",
        "holiday",
        "camping",
    )

    def base_difficulty_for_level(self, level_number: int) -> float:
        level_number = max(1, level_number)
        milestones = self._MILESTONES

        if level_number <= milestones[0][0]:
            return milestones[0][1]
        if level_number >= milestones[-1][0]:
            return milestones[-1][1]

        for index in range(len(milestones) - 1):
            left_level, left_difficulty = milestones[index]
            right_level, right_difficulty = milestones[index + 1]
            if left_level <= level_number <= right_level:
                if level_number == left_level:
                    return left_difficulty
                span = right_level - left_level
                progress = (level_number - left_level) / span
                interpolated = left_difficulty + ((right_difficulty - left_difficulty) * progress)
                return round(interpolated, 2)

        return milestones[-1][1]

    def difficulty_band_for_level(self, level_number: int) -> tuple[float, float]:
        base = self.base_difficulty_for_level(level_number)
        if level_number <= 3:
            window = 0.03
        elif level_number <= 10:
            window = 0.05
        else:
            window = 0.06
        return round(max(0.16, base - window), 2), round(min(self.MAX_DIFFICULTY, base + window), 2)

    def theme_for_level(self, level_number: int) -> str:
        return self._THEME_CYCLE[(max(level_number, 1) - 1) % len(self._THEME_CYCLE)]

    def seed_specs(self, count: int | None = None) -> list[CampaignSeedSpec]:
        target_count = count or self.SEED_LEVEL_COUNT
        return [
            CampaignSeedSpec(
                id=f"campaign-seed-{level_number:02d}",
                progression_index=level_number,
                difficulty=self.base_difficulty_for_level(level_number),
                theme=self.theme_for_level(level_number),
            )
            for level_number in range(1, target_count + 1)
        ]

    def clamp_to_level_band(self, level_number: int, difficulty: float) -> float:
        minimum, maximum = self.difficulty_band_for_level(level_number)
        return round(max(minimum, min(maximum, difficulty)), 2)

    # Mechanic introduction schedule:
    # L1-3 pure packing, L4 blocked cells, L7 decoys, L10 constraints,
    # L13 bigger leftover blocks, L16+ periodic exact-cover levels.
    def mechanics_for_level(self, level_number: int) -> MechanicProfile:
        level_number = max(1, level_number)
        if level_number < 4:
            blocked = 0
        elif level_number < 8:
            blocked = 1
        elif level_number < 13:
            blocked = 2
        else:
            blocked = 4

        if level_number < 7:
            decoys = 0
        elif level_number < 12:
            decoys = 1
        else:
            decoys = 2

        if level_number < 10:
            constraints = 0
        elif level_number < 15:
            constraints = 1
        else:
            constraints = 2

        exact_cover = level_number >= 16 and level_number % 3 == 1
        return MechanicProfile(
            blocked_cells=blocked,
            decoy_items=decoys,
            constraint_count=constraints,
            exact_cover=exact_cover,
        )

    def mechanics_for_daily(self) -> MechanicProfile:
        return MechanicProfile(
            blocked_cells=2,
            decoy_items=2,
            constraint_count=2,
            exact_cover=False,
        )
