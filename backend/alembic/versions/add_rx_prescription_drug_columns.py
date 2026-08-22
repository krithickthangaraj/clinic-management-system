"""add s_no and brand_name to prescription_drugs

Revision ID: rx_drugs_001
Revises: hosp_fields_001
Create Date: 2026-08-22

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'rx_drugs_001'
down_revision = 'hosp_fields_001'
branch_labels = None
depends_on = None


def upgrade():
    # Add s_no and brand_name columns to prescription_drugs
    op.add_column('prescription_drugs', sa.Column('s_no', sa.Integer(), nullable=True))
    op.add_column('prescription_drugs', sa.Column('brand_name', sa.String(), nullable=True))


def downgrade():
    op.drop_column('prescription_drugs', 'brand_name')
    op.drop_column('prescription_drugs', 's_no')
