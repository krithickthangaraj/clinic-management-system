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
