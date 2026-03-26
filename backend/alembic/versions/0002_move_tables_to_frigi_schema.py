"""Create frigi schema and move existing tables into it.

Revision ID: 0002
Revises: 0001
Create Date: 2026-03-23
"""

from alembic import op

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None

SCHEMA = "frigi"
TABLES = [
    "players",
    "levels",
    "game_sessions",
    "scores",
    "player_difficulty_history",
]


def _move_table(source_schema: str, target_schema: str, table_name: str) -> None:
    op.execute(
        f"""
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1
                FROM information_schema.tables
                WHERE table_schema = '{source_schema}'
                  AND table_name = '{table_name}'
            ) AND NOT EXISTS (
                SELECT 1
                FROM information_schema.tables
                WHERE table_schema = '{target_schema}'
                  AND table_name = '{table_name}'
            ) THEN
                EXECUTE 'ALTER TABLE "{source_schema}"."{table_name}" SET SCHEMA "{target_schema}"';
            END IF;
        END $$;
        """
    )


def upgrade() -> None:
    op.execute(f'CREATE SCHEMA IF NOT EXISTS "{SCHEMA}"')
    for table_name in TABLES:
        _move_table("public", SCHEMA, table_name)


def downgrade() -> None:
    for table_name in reversed(TABLES):
        _move_table(SCHEMA, "public", table_name)
    op.execute(f'DROP SCHEMA IF EXISTS "{SCHEMA}"')
