from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from app.models.enums import TestStatus


class Test(Base):
    __tablename__ = "tests"

    id = Column(Integer, primary_key=True, index=True)
    visit_id = Column(Integer, ForeignKey("visits.id"), nullable=False)
    
    test_type = Column(String, nullable=False)  # e.g., "Blood Test", "Urine Test", "X-ray", "Scan"
    test_name = Column(String, nullable=False)  # Specific test name
    status = Column(String, default=TestStatus.ORDERED.value, nullable=False)
    
    # Results
    results = Column(Text, nullable=True)  # JSON or text
    report_url = Column(String, nullable=True)  # Path to uploaded report (PDF/Image)
    
    ordered_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    visit = relationship("Visit", back_populates="tests")
