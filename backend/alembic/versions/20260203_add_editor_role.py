"""add editor role

Revision ID: add_editor_role
Revises: add_organizer
Create Date: 2026-02-03

"""
from alembic import op


revision = 'add_editor_role'
down_revision = 'add_organizer'
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table('users') as batch_op:
        batch_op.drop_constraint('check_role_type', type_='check')
        batch_op.create_check_constraint(
            'check_role_type',
            "role IN ('admin', 'editor', 'user')"
        )


def downgrade() -> None:
    with op.batch_alter_table('users') as batch_op:
        batch_op.drop_constraint('check_role_type', type_='check')
        batch_op.create_check_constraint(
            'check_role_type',
            "role IN ('admin', 'user')"
        )
