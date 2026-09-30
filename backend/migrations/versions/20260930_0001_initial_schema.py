"""Create the initial Boso Jawa schema.

Revision ID: 20260930_0001
Revises: None
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "20260930_0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute('CREATE EXTENSION IF NOT EXISTS "unaccent"')
    op.execute('CREATE EXTENSION IF NOT EXISTS "pg_trgm"')

    op.create_table(
        "aksara_jawa",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("karakter", sa.String(10), nullable=False),
        sa.Column("nama", sa.String(50), nullable=False),
        sa.Column("jenis", sa.String(30), nullable=False),
        sa.Column("latin_equivalent", sa.String(10)),
        sa.Column("deskripsi", sa.Text()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint(
            "jenis IN ('carakan', 'pasangan', 'sandhangan_swara', "
            "'sandhangan_panyigeg', 'murda', 'swara', 'rekan', 'pada')",
            name="ck_aksara_jawa_jenis",
        ),
    )
    op.create_index("idx_aksara_jenis", "aksara_jawa", ["jenis"])
    op.create_index("idx_aksara_latin", "aksara_jawa", ["latin_equivalent"])

    op.create_table(
        "kawruh_basa",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("ngoko", sa.String(100), nullable=False),
        sa.Column("krama_lugu", sa.String(100)),
        sa.Column("krama_inggil", sa.String(100)),
        sa.Column("bahasa_indonesia", sa.String(100), nullable=False),
        sa.Column("kelas_kata", sa.String(30), server_default="Tembung Aran", nullable=False),
        sa.Column("contoh_ukara", sa.Text()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("idx_kawruh_ngoko_trgm", "kawruh_basa", ["ngoko"], postgresql_using="gin", postgresql_ops={"ngoko": "gin_trgm_ops"})
    op.create_index("idx_kawruh_krama_inggil_trgm", "kawruh_basa", ["krama_inggil"], postgresql_using="gin", postgresql_ops={"krama_inggil": "gin_trgm_ops"})
    op.create_index("idx_kawruh_indonesia_trgm", "kawruh_basa", ["bahasa_indonesia"], postgresql_using="gin", postgresql_ops={"bahasa_indonesia": "gin_trgm_ops"})

    op.create_table(
        "paribasan",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("teks", sa.Text(), nullable=False),
        sa.Column("tegese", sa.Text(), nullable=False),
        sa.Column("kategori", sa.String(30), nullable=False),
        sa.Column("padanan_indonesia", sa.Text()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("kategori IN ('paribasan', 'bebasan', 'saloka')", name="ck_paribasan_kategori"),
    )
    op.create_index("idx_paribasan_kategori", "paribasan", ["kategori"])
    op.create_index("idx_paribasan_text_trgm", "paribasan", ["teks"], postgresql_using="gin", postgresql_ops={"teks": "gin_trgm_ops"})

    op.create_table(
        "macapat",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("nama_tembang", sa.String(50), nullable=False, unique=True),
        sa.Column("paugeran_gatra", sa.Integer(), nullable=False),
        sa.Column("paugeran_wilangan_lagu", postgresql.JSONB(), nullable=False),
        sa.Column("watak", sa.Text()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "ai_training_dataset",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("prompt", sa.Text(), nullable=False),
        sa.Column("completion", sa.Text(), nullable=False),
        sa.Column("kategori", sa.String(50), nullable=False),
        sa.Column("is_verified", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("idx_ai_kategori", "ai_training_dataset", ["kategori"])
    op.create_index("idx_ai_verified", "ai_training_dataset", ["is_verified"])


def downgrade() -> None:
    op.drop_table("ai_training_dataset")
    op.drop_table("macapat")
    op.drop_table("paribasan")
    op.drop_table("kawruh_basa")
    op.drop_table("aksara_jawa")
