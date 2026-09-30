"""Add content publication workflow fields.

Revision ID: 20260930_0003
Revises: 20260930_0002
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "20260930_0003"
down_revision: Union[str, None] = "20260930_0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    for table in ("kawruh_basa", "paribasan"):
        op.add_column(
            table,
            sa.Column("status", sa.String(20), server_default="published", nullable=False),
        )
        op.create_check_constraint(
            f"ck_{table}_status",
            table,
            "status IN ('draft', 'review', 'published')",
        )
        op.create_index(f"idx_{table}_status", table, ["status"])


def downgrade() -> None:
    for table in ("paribasan", "kawruh_basa"):
        op.drop_index(f"idx_{table}_status", table_name=table)
        op.drop_constraint(f"ck_{table}_status", table_name=table, type_="check")
        op.drop_column(table, "status")
