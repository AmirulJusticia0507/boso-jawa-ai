"""Add flashcard scheduling and fix progress uniqueness.

Revision ID: 20260930_0005
Revises: a93339882e32
"""

from alembic import op
import sqlalchemy as sa

revision = "20260930_0005"
down_revision = "a93339882e32"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_index("ix_user_progress_user_identifier", table_name="user_progress")
    op.create_index("ix_user_progress_user_identifier", "user_progress", ["user_identifier"], unique=False)
    op.create_table(
        "flashcard_review",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_identifier", sa.String(128), nullable=False),
        sa.Column("question_id", sa.Integer(), sa.ForeignKey("quiz_question.id"), nullable=False),
        sa.Column("repetitions", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("interval_days", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("ease_factor", sa.Float(), nullable=False, server_default="2.5"),
        sa.Column("due_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("last_reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint("user_identifier", "question_id", name="uq_flashcard_user_question"),
    )
    op.create_index("ix_flashcard_review_user_identifier", "flashcard_review", ["user_identifier"])
    op.create_index("ix_flashcard_review_question_id", "flashcard_review", ["question_id"])


def downgrade() -> None:
    op.drop_table("flashcard_review")
    op.drop_index("ix_user_progress_user_identifier", table_name="user_progress")
    op.create_index("ix_user_progress_user_identifier", "user_progress", ["user_identifier"], unique=True)
