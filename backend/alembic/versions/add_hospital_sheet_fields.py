"""add hospital spreadsheet fields for patient and vitals

Revision ID: hosp_fields_001
Revises: med_master_001
Create Date: 2026-08-22

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'hosp_fields_001'
down_revision = 'med_master_001'
branch_labels = None
depends_on = None


def upgrade():
    # Patients table additions
    op.add_column('patients', sa.Column('patient_id', sa.String(), nullable=True))
    op.add_column('patients', sa.Column('barcode', sa.String(), nullable=True))
    op.add_column('patients', sa.Column('registration_timestamp', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True))
    op.add_column('patients', sa.Column('dob', sa.Date(), nullable=True))
    op.add_column('patients', sa.Column('age_format', sa.String(), server_default='Years', nullable=True))
    op.add_column('patients', sa.Column('guardian_relation', sa.String(), nullable=True))
    
    op.create_index(op.f('ix_patients_patient_id'), 'patients', ['patient_id'], unique=True)
    op.create_index(op.f('ix_patients_barcode'), 'patients', ['barcode'], unique=False)

    # Vitals table additions
    op.add_column('vitals', sa.Column('weight_kg', sa.Float(), nullable=True))
    op.add_column('vitals', sa.Column('bmi', sa.Float(), nullable=True))
    op.add_column('vitals', sa.Column('blood_pressure', sa.String(), nullable=True))
    op.add_column('vitals', sa.Column('temperature_f', sa.Float(), nullable=True))
    op.add_column('vitals', sa.Column('spo2_percent', sa.Integer(), nullable=True))
    op.add_column('vitals', sa.Column('pulse_rate_bpm', sa.Integer(), nullable=True))
    op.add_column('vitals', sa.Column('grbs_mg_dl', sa.Integer(), nullable=True))
    op.add_column('vitals', sa.Column('consultant_assigned', sa.String(), nullable=True))
    op.add_column('vitals', sa.Column('remarks', sa.Text(), nullable=True))

    # Visits table additions
    op.add_column('visits', sa.Column('consultant_assigned', sa.String(), nullable=True))


def downgrade():
    op.drop_column('visits', 'consultant_assigned')

    op.drop_column('vitals', 'remarks')
    op.drop_column('vitals', 'consultant_assigned')
    op.drop_column('vitals', 'grbs_mg_dl')
    op.drop_column('vitals', 'pulse_rate_bpm')
    op.drop_column('vitals', 'spo2_percent')
    op.drop_column('vitals', 'temperature_f')
    op.drop_column('vitals', 'blood_pressure')
    op.drop_column('vitals', 'bmi')
    op.drop_column('vitals', 'weight_kg')

    op.drop_index(op.f('ix_patients_barcode'), table_name='patients')
    op.drop_index(op.f('ix_patients_patient_id'), table_name='patients')
    op.drop_column('patients', 'guardian_relation')
    op.drop_column('patients', 'age_format')
    op.drop_column('patients', 'dob')
    op.drop_column('patients', 'registration_timestamp')
    op.drop_column('patients', 'barcode')
    op.drop_column('patients', 'patient_id')
