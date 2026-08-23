from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class MedicineDrug(Base):
    __tablename__ = 'medicine_drugs'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True, index=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class MedicineType(Base):
    __tablename__ = 'medicine_types'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True, index=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class MedicineBrand(Base):
    __tablename__ = 'medicine_brands'

    id = Column(Integer, primary_key=True, index=True)
    drug_id = Column(Integer, ForeignKey('medicine_drugs.id'), nullable=False)
    type_id = Column(Integer, ForeignKey('medicine_types.id'), nullable=True)
    name = Column(String, nullable=False, index=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    drug = relationship('MedicineDrug')
    type = relationship('MedicineType')


class MedicineDosage(Base):
    __tablename__ = 'medicine_dosages'

    id = Column(Integer, primary_key=True, index=True)
    brand_id = Column(Integer, ForeignKey('medicine_brands.id'), nullable=False)
    label = Column(String, nullable=False, index=True)  # e.g. '650 mg' or '5 ml'
    default_instruction = Column(String, nullable=True)  # e.g. 'After Food'
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    brand = relationship('MedicineBrand')


class MedicineMaster(Base):
    __tablename__ = 'medicine_master'

    id = Column(Integer, primary_key=True, index=True)
    brand_name = Column(String, nullable=False, unique=True, index=True)  # e.g. 'Zental 400mg Tab.'
    drug_name = Column(String, nullable=False, index=True)               # e.g. 'Albendazole'
    category = Column(String, nullable=True, default='Tablet')          # Tablet, Syrup, Capsule, Injection, Ointment, Drops
    default_dosage = Column(String, nullable=True, default='1 Tab')     # e.g. '1 Tab', '10ml', '0.5 Tab'
    default_frequency = Column(String, nullable=True, default='TDS (1-1-1)')  # e.g. 'STAT', 'OD (1-0-0)', 'TDS (1-1-1)'
    default_days = Column(Integer, nullable=True, default=3)            # e.g. 1, 3, 5
    default_instructions = Column(String, nullable=True, default='')    # e.g. 'To chew at bed time', 'Before Food', 'After food'
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

