"""Add admin audit trail table.

Revision ID: 20260930_0004
Revises: 20260930_0003
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "20260930_0004"
down_revision: Union[str, None] = "20260930_0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "audit_log",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("admin_key_fingerprint", sa.String(16), nullable=False),
        sa.Column("action", sa.String(100), nullable=False),
        sa.Column("target_table", sa.String(50), nullable=False),
        sa.Column("target_id", sa.Integer(), nullable=True),
        sa.Column("changes", sa.Text(), nullable=True),
        sa.Column("ip_address", sa.String(64), nullable=True),
        sa.Column("user_agent", sa.String(500), nullable=True),
        sa.Column("request_id", sa.String(128), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_audit_log_admin_key_fingerprint", "audit_log", ["admin_key_fingerprint"])
    op.create_index("ix_audit_log_action", "audit_log", ["action"])
    op.create_index("ix_audit_log_target_table", "audit_log", ["target_table"])
    op.create_index("ix_audit_log_action_created_at", "audit_log", ["action", "created_at"])
    op.create_index("ix_audit_log_target", "audit_log", ["target_table", "target_id"])


def downgrade() -> None:
    op.drop_index("ix_audit_log_target", table_name="audit_log")
    op.drop_index("ix_audit_log_action_created_at", table_name="audit_log")
    op.drop_index("ix_audit_log_target_table", table_name="audit_log")
    op.drop_index("ix_audit_log_action", table_name="audit_log")
    op.drop_index("ix_audit_log_admin_key_fingerprint", table_name="audit_log")
    op.drop_table("audit_log")
