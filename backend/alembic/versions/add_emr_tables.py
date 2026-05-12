"""Add EMR tables: master tables, patient history, visit relations

Revision ID: emr_tables_001
Revises: 
Create Date: 2026-01-24

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import sqlite

# revision identifiers
revision = 'emr_tables_001'
down_revision = 'add_pv_001'
branch_labels = None
depends_on = None


def upgrade():
    # Master tables
    op.create_table(
        'chief_complaints_master',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=True, server_default='1'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    op.create_index(op.f('ix_chief_complaints_master_id'), 'chief_complaints_master', ['id'], unique=False)
    op.create_index(op.f('ix_chief_complaints_master_name'), 'chief_complaints_master', ['name'], unique=False)

    op.create_table(
        'diagnosis_master',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=True, server_default='1'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    op.create_index(op.f('ix_diagnosis_master_id'), 'diagnosis_master', ['id'], unique=False)
    op.create_index(op.f('ix_diagnosis_master_name'), 'diagnosis_master', ['name'], unique=False)

    op.create_table(
        'doctor_advice_master',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=True, server_default='1'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    op.create_index(op.f('ix_doctor_advice_master_id'), 'doctor_advice_master', ['id'], unique=False)
    op.create_index(op.f('ix_doctor_advice_master_name'), 'doctor_advice_master', ['name'], unique=False)

    op.create_table(
        'lab_tests_master',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('test_type', sa.String(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=True, server_default='1'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_lab_tests_master_id'), 'lab_tests_master', ['id'], unique=False)
    op.create_index(op.f('ix_lab_tests_master_name'), 'lab_tests_master', ['name'], unique=False)

    # Patient history tables
    op.create_table(
        'patient_allergy_history',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('patient_id', sa.Integer(), nullable=False),
        sa.Column('value', sa.Text(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=True, server_default='1'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_patient_allergy_history_id'), 'patient_allergy_history', ['id'], unique=False)
    op.create_index(op.f('ix_patient_allergy_history_patient_id'), 'patient_allergy_history', ['patient_id'], unique=False)

    op.create_table(
        'patient_family_history',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('patient_id', sa.Integer(), nullable=False),
        sa.Column('value', sa.Text(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=True, server_default='1'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_patient_family_history_id'), 'patient_family_history', ['id'], unique=False)
    op.create_index(op.f('ix_patient_family_history_patient_id'), 'patient_family_history', ['patient_id'], unique=False)

    op.create_table(
        'patient_surgical_history',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('patient_id', sa.Integer(), nullable=False),
        sa.Column('value', sa.Text(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=True, server_default='1'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_patient_surgical_history_id'), 'patient_surgical_history', ['id'], unique=False)
    op.create_index(op.f('ix_patient_surgical_history_patient_id'), 'patient_surgical_history', ['patient_id'], unique=False)

    op.create_table(
        'patient_past_history',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('patient_id', sa.Integer(), nullable=False),
        sa.Column('value', sa.Text(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=True, server_default='1'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_patient_past_history_id'), 'patient_past_history', ['id'], unique=False)
    op.create_index(op.f('ix_patient_past_history_patient_id'), 'patient_past_history', ['patient_id'], unique=False)

    # Visit relation tables
    op.create_table(
        'visit_complaints',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('visit_id', sa.Integer(), nullable=False),
        sa.Column('complaint_id', sa.Integer(), nullable=True),
        sa.Column('custom_complaint', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['complaint_id'], ['chief_complaints_master.id'], ),
        sa.ForeignKeyConstraint(['visit_id'], ['visits.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_visit_complaints_id'), 'visit_complaints', ['id'], unique=False)
    op.create_index(op.f('ix_visit_complaints_visit_id'), 'visit_complaints', ['visit_id'], unique=False)

    op.create_table(
        'visit_diagnosis',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('visit_id', sa.Integer(), nullable=False),
        sa.Column('diagnosis_id', sa.Integer(), nullable=True),
        sa.Column('custom_diagnosis', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['diagnosis_id'], ['diagnosis_master.id'], ),
        sa.ForeignKeyConstraint(['visit_id'], ['visits.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_visit_diagnosis_id'), 'visit_diagnosis', ['id'], unique=False)
    op.create_index(op.f('ix_visit_diagnosis_visit_id'), 'visit_diagnosis', ['visit_id'], unique=False)

    op.create_table(
        'visit_payments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('visit_id', sa.Integer(), nullable=False),
        sa.Column('doctor_fee', sa.Float(), nullable=True, server_default='0.0'),
        sa.Column('lab_fee', sa.Float(), nullable=True, server_default='0.0'),
        sa.Column('total', sa.Float(), nullable=True, server_default='0.0'),
        sa.Column('payment_status', sa.String(), nullable=True, server_default='pending'),
        sa.Column('payment_mode', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['visit_id'], ['visits.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('visit_id')
    )
    op.create_index(op.f('ix_visit_payments_id'), 'visit_payments', ['id'], unique=False)
    op.create_index(op.f('ix_visit_payments_visit_id'), 'visit_payments', ['visit_id'], unique=False)

    # Add instructions column to prescription_drugs
    op.add_column('prescription_drugs', sa.Column('instructions', sa.Text(), nullable=True))


def downgrade():
    op.drop_column('prescription_drugs', 'instructions')
    op.drop_table('visit_payments')
    op.drop_table('visit_diagnosis')
    op.drop_table('visit_complaints')
    op.drop_table('patient_past_history')
    op.drop_table('patient_surgical_history')
    op.drop_table('patient_family_history')
    op.drop_table('patient_allergy_history')
    op.drop_table('lab_tests_master')
    op.drop_table('doctor_advice_master')
    op.drop_table('diagnosis_master')
    op.drop_table('chief_complaints_master')
