"""Add level progression index and player level progress table.

Revision ID: 0003
Revises: 0002
Create Date: 2026-03-23
"""

from alembic import op
import sqlalchemy as sa

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "levels",
        sa.Column("progression_index", sa.Integer(), nullable=False, server_default="0"),
    )
    op.create_index("ix_levels_progression_index", "levels", ["progression_index"])

    op.create_table(
        "player_level_progress",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("player_id", sa.String(), sa.ForeignKey("players.id"), nullable=False),
        sa.Column("level_number", sa.Integer(), nullable=False),
        sa.Column("attempts", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("completions", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("best_score", sa.Integer(), nullable=True),
        sa.Column("best_duration_ms", sa.Integer(), nullable=True),
        sa.Column("best_efficiency_pct", sa.Float(), nullable=True),
        sa.Column("stars", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("first_completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.UniqueConstraint("player_id", "level_number", name="uq_player_level_progress_player_level"),
    )
    op.create_index("ix_player_level_progress_player_id", "player_level_progress", ["player_id"])
    op.create_index("ix_player_level_progress_level_number", "player_level_progress", ["level_number"])


def downgrade() -> None:
    op.drop_index("ix_player_level_progress_level_number", table_name="player_level_progress")
    op.drop_index("ix_player_level_progress_player_id", table_name="player_level_progress")
    op.drop_table("player_level_progress")
    op.drop_index("ix_levels_progression_index", table_name="levels")
    op.drop_column("levels", "progression_index")
