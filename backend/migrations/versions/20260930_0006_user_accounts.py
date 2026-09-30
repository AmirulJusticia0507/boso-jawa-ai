"""Add public user accounts and personal data.

Revision ID: 20260930_0006
Revises: 20260930_0005
"""

from alembic import op
import sqlalchemy as sa

revision = "20260930_0006"
down_revision = "20260930_0005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table("user_account", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("username", sa.String(64), nullable=False), sa.Column("password_hash", sa.String(255), nullable=False), sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False))
    op.create_index("ix_user_account_username", "user_account", ["username"], unique=True)
    op.create_table("user_history", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("user_id", sa.Integer(), sa.ForeignKey("user_account.id", ondelete="CASCADE"), nullable=False), sa.Column("client_id", sa.String(64), nullable=False), sa.Column("type", sa.String(30), nullable=False), sa.Column("input", sa.Text(), nullable=False), sa.Column("output", sa.Text(), nullable=False), sa.Column("timestamp", sa.BigInteger(), nullable=False), sa.UniqueConstraint("user_id", "client_id", name="uq_user_history_client"))
    op.create_index("ix_user_history_user_id", "user_history", ["user_id"])
    op.create_table("user_bookmark", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("user_id", sa.Integer(), sa.ForeignKey("user_account.id", ondelete="CASCADE"), nullable=False), sa.Column("resource_type", sa.String(30), nullable=False), sa.Column("resource_id", sa.String(100), nullable=False), sa.Column("title", sa.String(255), nullable=False), sa.Column("collection", sa.String(100), nullable=False, server_default="Favorit"), sa.Column("note", sa.Text()), sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False), sa.UniqueConstraint("user_id", "resource_type", "resource_id", name="uq_user_bookmark_resource"))
    op.create_index("ix_user_bookmark_user_id", "user_bookmark", ["user_id"])
    op.create_table("user_feedback", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("user_id", sa.Integer(), sa.ForeignKey("user_account.id", ondelete="CASCADE"), nullable=False), sa.Column("resource_type", sa.String(30), nullable=False), sa.Column("resource_id", sa.String(100)), sa.Column("message", sa.Text(), nullable=False), sa.Column("suggestion", sa.Text()), sa.Column("status", sa.String(20), nullable=False, server_default="open"), sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False))
    op.create_index("ix_user_feedback_user_id", "user_feedback", ["user_id"])


def downgrade() -> None:
    op.drop_table("user_feedback")
    op.drop_table("user_bookmark")
    op.drop_table("user_history")
    op.drop_table("user_account")
