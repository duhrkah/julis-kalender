"""add organizer to events

Revision ID: add_organizer
Revises:
Create Date: 2026-02-03

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision = 'add_organizer'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = inspect(conn)
    if 'events' in inspector.get_table_names():
        columns = [c['name'] for c in inspector.get_columns('events')]
        if 'organizer' not in columns:
            op.add_column('events', sa.Column('organizer', sa.String(255), nullable=True))


def downgrade() -> None:
    conn = op.get_bind()
    inspector = inspect(conn)
    if 'events' in inspector.get_table_names():
        columns = [c['name'] for c in inspector.get_columns('events')]
        if 'organizer' in columns:
            op.drop_column('events', 'organizer')
