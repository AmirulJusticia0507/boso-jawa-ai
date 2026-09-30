"""Add the missing trigram index for krama lugu searches.

Revision ID: 20260930_0002
Revises: 20260930_0001
"""

from typing import Sequence, Union

from alembic import op

revision: str = "20260930_0002"
down_revision: Union[str, None] = "20260930_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index(
        "idx_kawruh_krama_lugu_trgm",
        "kawruh_basa",
        ["krama_lugu"],
        postgresql_using="gin",
        postgresql_ops={"krama_lugu": "gin_trgm_ops"},
    )


def downgrade() -> None:
    op.drop_index("idx_kawruh_krama_lugu_trgm", table_name="kawruh_basa")
