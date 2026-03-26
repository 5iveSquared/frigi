import asyncio
import json
from pathlib import Path

import asyncpg

from app.content.global_level import GLOBAL_LEVEL_ID
from app.services.level_generator import LevelGeneratorService
from app.services.progression_model import CampaignProgressionModel

SEED_LEVELS = CampaignProgressionModel().seed_specs()


def load_env() -> dict[str, str]:
    env = {}
    for line in Path("backend/.env").read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        env[key] = value
    return env


async def main():
    env = load_env()
    schema = env.get("DB_SCHEMA", "frigi")
    database_url = env["DATABASE_URL"].replace("+asyncpg", "")
    conn = await asyncpg.connect(
        database_url,
        server_settings={"search_path": f"{schema},public"},
    )
    generator = LevelGeneratorService(None)

    try:
        invalid_ids = await conn.fetch(
            f"""
            SELECT l.id
            FROM {schema}.levels l
            LEFT JOIN (
              SELECT level_id, COUNT(*) AS session_count
              FROM {schema}.game_sessions
              GROUP BY level_id
            ) gs ON gs.level_id = l.id
            LEFT JOIN (
              SELECT level_id, COUNT(*) AS score_count
              FROM {schema}.scores
              GROUP BY level_id
            ) sc ON sc.level_id = l.id
            WHERE l.is_daily = FALSE
              AND l.progression_index = 0
              AND l.id <> $1
              AND COALESCE(gs.session_count, 0) = 0
              AND COALESCE(sc.score_count, 0) = 0
            ORDER BY l.created_at ASC, l.id ASC
            """,
            GLOBAL_LEVEL_ID,
        )
        invalid_ids = [row["id"] for row in invalid_ids]

        if invalid_ids:
            await conn.execute(
                f"DELETE FROM {schema}.levels WHERE id = ANY($1::text[])",
                invalid_ids,
            )

        existing_seed_ids = {
            row["id"]
            for row in await conn.fetch(
                f"SELECT id FROM {schema}.levels WHERE id = ANY($1::text[])",
                [seed.id for seed in SEED_LEVELS],
            )
        }

        created = 0
        updated = 0

        for seed in SEED_LEVELS:
            raw = generator._generate_procedural_level(
                difficulty=seed.difficulty,
                theme=seed.theme,
                player_id=seed.id,
                seed_key=seed.id,
            )
            normalized = generator._normalize_level_data(raw)
            optimal_score = generator._estimate_optimal(normalized)

            payload = (
                seed.id,
                json.dumps(normalized["grid"]),
                json.dumps(normalized["items"]),
                json.dumps(normalized.get("constraints", [])),
                normalized["theme"],
                normalized["difficulty"],
                seed.progression_index,
                optimal_score,
            )

            await conn.execute(
                f"""
                INSERT INTO {schema}.levels (
                  id,
                  grid_config,
                  items,
                  constraints,
                  theme,
                  difficulty,
                  progression_index,
                  optimal_score,
                  is_daily,
                  daily_date
                )
                VALUES (
                  $1,
                  $2::jsonb,
                  $3::jsonb,
                  $4::jsonb,
                  $5,
                  $6,
                  $7,
                  $8,
                  FALSE,
                  NULL
                )
                ON CONFLICT (id) DO UPDATE SET
                  grid_config = EXCLUDED.grid_config,
                  items = EXCLUDED.items,
                  constraints = EXCLUDED.constraints,
                  theme = EXCLUDED.theme,
                  difficulty = EXCLUDED.difficulty,
                  progression_index = EXCLUDED.progression_index,
                  optimal_score = EXCLUDED.optimal_score,
                  is_daily = FALSE,
                  daily_date = NULL
                """,
                *payload,
            )

            if seed.id in existing_seed_ids:
                updated += 1
            else:
                created += 1

        print(
            {
                "deleted_invalid_levels": invalid_ids,
                "deleted_count": len(invalid_ids),
                "seed_levels_created": created,
                "seed_levels_updated": updated,
            }
        )
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(main())
