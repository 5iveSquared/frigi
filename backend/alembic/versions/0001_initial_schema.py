"""Initial schema — all 5 tables

Revision ID: 0001
Revises:
Create Date: 2026-03-18
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "players",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("username", sa.String(64), nullable=False, unique=True),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("elo_rating", sa.Float(), nullable=False, server_default="1000.0"),
        sa.Column("total_games", sa.Integer(), nullable=False, server_default="0"),
    )
    op.create_index("ix_players_email", "players", ["email"])

    op.create_table(
        "levels",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("grid_config", postgresql.JSONB(), nullable=False),
        sa.Column("items", postgresql.JSONB(), nullable=False),
        sa.Column("constraints", postgresql.JSONB(), nullable=False),
        sa.Column("theme", sa.String(64), nullable=False),
        sa.Column("difficulty", sa.Float(), nullable=False),
        sa.Column("optimal_score", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_daily", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("daily_date", sa.Date(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index("ix_levels_difficulty", "levels", ["difficulty"])
    op.create_index("ix_levels_daily", "levels", ["is_daily", "daily_date"])

    op.create_table(
        "game_sessions",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("player_id", sa.String(), sa.ForeignKey("players.id"), nullable=False),
        sa.Column("level_id", sa.String(), sa.ForeignKey("levels.id"), nullable=False),
        sa.Column("status", sa.String(32), nullable=False, server_default="pending"),
        sa.Column("duration_ms", sa.Integer(), nullable=True),
        sa.Column("move_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("final_placement", postgresql.JSONB(), nullable=True),
        sa.Column(
            "started_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_game_sessions_player_id", "game_sessions", ["player_id"])
    op.create_index("ix_game_sessions_level_id", "game_sessions", ["level_id"])

    op.create_table(
        "scores",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("session_id", sa.String(), sa.ForeignKey("game_sessions.id"), nullable=False),
        sa.Column("player_id", sa.String(), sa.ForeignKey("players.id"), nullable=False),
        sa.Column("level_id", sa.String(), sa.ForeignKey("levels.id"), nullable=False),
        sa.Column("total_score", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("efficiency_score", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("time_score", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("constraint_score", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("move_score", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("efficiency_pct", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index("ix_scores_player_id", "scores", ["player_id"])
    op.create_index("ix_scores_level_id", "scores", ["level_id"])
    op.create_index("ix_scores_total_score", "scores", ["total_score"])

    op.create_table(
        "player_difficulty_history",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("player_id", sa.String(), sa.ForeignKey("players.id"), nullable=False),
        sa.Column("session_id", sa.String(), sa.ForeignKey("game_sessions.id"), nullable=False),
        sa.Column("difficulty_in", sa.Float(), nullable=False),
        sa.Column("performance_pct", sa.Float(), nullable=False),
        sa.Column("new_elo", sa.Float(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index("ix_pdh_player_id", "player_difficulty_history", ["player_id"])


def downgrade() -> None:
    op.drop_table("player_difficulty_history")
    op.drop_table("scores")
    op.drop_table("game_sessions")
    op.drop_table("levels")
    op.drop_table("players")
