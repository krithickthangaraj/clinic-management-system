"""add medicine master tables

Revision ID: med_master_001
Revises: tmpl_fields_001
Create Date: 2026-06-13

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'med_master_001'
down_revision = 'tmpl_fields_001'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'medicine_drugs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=True, server_default='1'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    op.create_index(op.f('ix_medicine_drugs_id'), 'medicine_drugs', ['id'], unique=False)
    op.create_index(op.f('ix_medicine_drugs_name'), 'medicine_drugs', ['name'], unique=False)

    op.create_table(
        'medicine_types',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=True, server_default='1'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    op.create_index(op.f('ix_medicine_types_id'), 'medicine_types', ['id'], unique=False)
    op.create_index(op.f('ix_medicine_types_name'), 'medicine_types', ['name'], unique=False)

    op.create_table(
        'medicine_brands',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('drug_id', sa.Integer(), nullable=False),
        sa.Column('type_id', sa.Integer(), nullable=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=True, server_default='1'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['drug_id'], ['medicine_drugs.id'], ),
        sa.ForeignKeyConstraint(['type_id'], ['medicine_types.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_medicine_brands_id'), 'medicine_brands', ['id'], unique=False)
    op.create_index(op.f('ix_medicine_brands_name'), 'medicine_brands', ['name'], unique=False)

    op.create_table(
        'medicine_dosages',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('brand_id', sa.Integer(), nullable=False),
        sa.Column('label', sa.String(), nullable=False),
        sa.Column('default_instruction', sa.String(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True, server_default='1'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['brand_id'], ['medicine_brands.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_medicine_dosages_id'), 'medicine_dosages', ['id'], unique=False)
    op.create_index(op.f('ix_medicine_dosages_label'), 'medicine_dosages', ['label'], unique=False)


def downgrade():
    op.drop_index(op.f('ix_medicine_dosages_label'), table_name='medicine_dosages')
    op.drop_index(op.f('ix_medicine_dosages_id'), table_name='medicine_dosages')
    op.drop_table('medicine_dosages')

    op.drop_index(op.f('ix_medicine_brands_name'), table_name='medicine_brands')
    op.drop_index(op.f('ix_medicine_brands_id'), table_name='medicine_brands')
    op.drop_table('medicine_brands')

    op.drop_index(op.f('ix_medicine_types_name'), table_name='medicine_types')
    op.drop_index(op.f('ix_medicine_types_id'), table_name='medicine_types')
    op.drop_table('medicine_types')

    op.drop_index(op.f('ix_medicine_drugs_name'), table_name='medicine_drugs')
    op.drop_index(op.f('ix_medicine_drugs_id'), table_name='medicine_drugs')
    op.drop_table('medicine_drugs')
