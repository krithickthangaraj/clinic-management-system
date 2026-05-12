"""add patient vitals fields

Revision ID: add_pv_001
Revises: bcae22ba6cdf
Create Date: 2025-01-24

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = 'add_pv_001'
down_revision = 'bcae22ba6cdf'
branch_labels = None
depends_on = None


def upgrade():
    # Patient: add new columns
    op.add_column('patients', sa.Column('guardian_name', sa.String(), nullable=True))
    op.add_column('patients', sa.Column('address', sa.Text(), nullable=True))
    op.add_column('patients', sa.Column('district', sa.String(), nullable=True))
    op.add_column('patients', sa.Column('age_years', sa.Integer(), nullable=True))
    op.add_column('patients', sa.Column('age_months', sa.Integer(), nullable=True))
    op.alter_column('patients', 'age', existing_type=sa.INTEGER(), nullable=True)

    # Vitals: add pr, spo2, height_cm
    op.add_column('vitals', sa.Column('pr', sa.Integer(), nullable=True))
    op.add_column('vitals', sa.Column('spo2', sa.Integer(), nullable=True))
    op.add_column('vitals', sa.Column('height_cm', sa.Float(), nullable=True))


def downgrade():
    op.drop_column('vitals', 'height_cm')
    op.drop_column('vitals', 'spo2')
    op.drop_column('vitals', 'pr')
    op.drop_column('patients', 'age_months')
    op.drop_column('patients', 'age_years')
    op.drop_column('patients', 'district')
    op.drop_column('patients', 'address')
    op.drop_column('patients', 'guardian_name')
    op.alter_column('patients', 'age', existing_type=sa.INTEGER(), nullable=False)
