"""add multi-tenancy support

Revision ID: add_multi_tenancy
Revises: add_editor_role
Create Date: 2026-02-04

This migration adds multi-tenancy support for the Verbandsstruktur:
- Bundesverband (federal level) - sees all events
- Landesverband (state level) - own instance with own users/categories
- Bezirksverband (district level) - grouped under Landesverband
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision = 'add_multi_tenancy'
down_revision = 'add_editor_role'
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = inspect(conn)
    existing_tables = inspector.get_table_names()
    
    # 1. Create tenants table
    if 'tenants' not in existing_tables:
        op.create_table(
            'tenants',
            sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column('name', sa.String(255), nullable=False, index=True),
            sa.Column('slug', sa.String(100), nullable=False, unique=True, index=True),
            sa.Column('description', sa.Text(), nullable=True),
            sa.Column('level', sa.String(50), nullable=False, server_default='landesverband'),
            sa.Column('parent_id', sa.Integer(), sa.ForeignKey('tenants.id', ondelete='CASCADE'), nullable=True, index=True),
            sa.Column('is_active', sa.Boolean(), nullable=False, server_default='1'),
            sa.Column('logo_url', sa.String(500), nullable=True),
            sa.Column('primary_color', sa.String(7), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        )
    
    # 2. Add tenant_id to users table
    if 'users' in existing_tables:
        columns = [c['name'] for c in inspector.get_columns('users')]
        if 'tenant_id' not in columns:
            op.add_column('users', sa.Column('tenant_id', sa.Integer(), nullable=True))
    
    # 3. Add tenant_id to events table
    if 'events' in existing_tables:
        columns = [c['name'] for c in inspector.get_columns('events')]
        if 'tenant_id' not in columns:
            op.add_column('events', sa.Column('tenant_id', sa.Integer(), nullable=True))
    
    # 4. Add tenant_id and is_global to categories table
    if 'categories' in existing_tables:
        columns = [c['name'] for c in inspector.get_columns('categories')]
        
        if 'tenant_id' not in columns:
            op.add_column('categories', sa.Column('tenant_id', sa.Integer(), nullable=True))
        
        if 'is_global' not in columns:
            op.add_column('categories', sa.Column('is_global', sa.Boolean(), nullable=True, server_default='0'))


def downgrade() -> None:
    conn = op.get_bind()
    inspector = inspect(conn)
    existing_tables = inspector.get_table_names()
    
    # 1. Remove tenant_id and is_global from categories
    if 'categories' in existing_tables:
        columns = [c['name'] for c in inspector.get_columns('categories')]
        if 'is_global' in columns:
            op.drop_column('categories', 'is_global')
        if 'tenant_id' in columns:
            op.drop_column('categories', 'tenant_id')
    
    # 2. Remove tenant_id from events
    if 'events' in existing_tables:
        columns = [c['name'] for c in inspector.get_columns('events')]
        if 'tenant_id' in columns:
            op.drop_column('events', 'tenant_id')
    
    # 3. Remove tenant_id from users
    if 'users' in existing_tables:
        columns = [c['name'] for c in inspector.get_columns('users')]
        if 'tenant_id' in columns:
            op.drop_column('users', 'tenant_id')
    
    # 4. Drop tenants table
    if 'tenants' in existing_tables:
        op.drop_table('tenants')
