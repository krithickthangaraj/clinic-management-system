"""add template consultation fields

Revision ID: tmpl_fields_001
Revises: emr_tables_001
Create Date: 2026-05-24

"""
from alembic import op
import sqlalchemy as sa


revision = 'tmpl_fields_001'
down_revision = 'emr_tables_001'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('templates', sa.Column('vitals', sa.Text(), nullable=True))
    op.add_column('templates', sa.Column('tests', sa.Text(), nullable=True))
    op.add_column('templates', sa.Column('follow_up_date', sa.String(), nullable=True))
    op.add_column('templates', sa.Column('follow_up_notes', sa.Text(), nullable=True))


def downgrade():
    op.drop_column('templates', 'follow_up_notes')
    op.drop_column('templates', 'follow_up_date')
    op.drop_column('templates', 'tests')
    op.drop_column('templates', 'vitals')
