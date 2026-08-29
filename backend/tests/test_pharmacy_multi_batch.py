import unittest
from datetime import date, datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi import HTTPException

from app.core.database import Base
from app.models.user import User
from app.models.enums import UserRole, VisitStatus
from app.models.patient import Patient
from app.models.visit import Visit
from app.models.prescription import Prescription, PrescriptionDrug
from app.models.pharmacy import PharmacyItem, PharmacyStockLog, PharmacyDispenseLog
from app.schemas.pharmacy import DispenseRequest, DispenseItemRequest
from app.api.v1.endpoints.pharmacy import (
    get_prescription_for_dispensing,
    dispense_prescription_and_bill,
)


class TestPharmacyMultiBatchAndPartialDispense(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(self.engine)
        self.Session = sessionmaker(bind=self.engine)
        self.session = self.Session()

        # Seed Pharmacist User
        self.pharmacist = User(
            username="pharmacy_lead",
            hashed_password="hash",
            full_name="Senior Pharmacist",
            role=UserRole.PHARMACY.value,
        )
        self.session.add(self.pharmacist)

        # Seed Doctor
        self.doctor = User(
            username="doc_jeyagowthaman",
            hashed_password="hash",
            full_name="Dr. T.S.Jeyagowthaman",
            role=UserRole.DOCTOR.value,
        )
        self.session.add(self.doctor)

        # Seed Patient
        self.patient = Patient(
            name="Ramesh Sundaram",
            gender="Male",
            age=52,
            phone="9840112345",
            patient_id="PAT-10482",
        )
        self.session.add(self.patient)
        self.session.flush()

        # Seed Visit & Prescription
        self.visit = Visit(
            visit_number="V-20260829-001",
            patient_id=self.patient.id,
            doctor_id=self.doctor.id,
            status=VisitStatus.COMPLETED.value,
            consultant_assigned="Dr. T.S.Jeyagowthaman",
        )
        self.session.add(self.visit)
        self.session.flush()

        self.prescription = Prescription(
            visit_id=self.visit.id,
            doctor_id=self.doctor.id,
        )
        self.session.add(self.prescription)
        self.session.flush()

        # Add Prescribed Drug: Metformin 500mg (60 tabs prescribed)
        self.drug = PrescriptionDrug(
            prescription_id=self.prescription.id,
            brand_name="Glycomet 500",
            drug_name="Metformin 500mg",
            dosage="1 Tab",
            frequency="1-0-1",
            number_of_days=30,
            quantity=60,
        )
        self.session.add(self.drug)
        self.session.commit()

    def tearDown(self):
        self.session.close()
        Base.metadata.drop_all(self.engine)

    async def test_fefo_batch_ordering_and_recommendation(self):
        """Verify FEFO logic tags the earliest non-expired batch as FEFO recommended."""
        today = date.today()
        # Batch 1: Expires in 6 months (FEFO winner)
        batch1 = PharmacyItem(
            brand_name="Glycomet 500",
            drug_name="Metformin 500mg",
            batch_number="MF2604",
            expiry_date=today + timedelta(days=180),
            stock_quantity=15,
            unit_price=2.5,
        )
        # Batch 2: Expires in 18 months
        batch2 = PharmacyItem(
            brand_name="Glycomet 500",
            drug_name="Metformin 500mg",
            batch_number="MF2701",
            expiry_date=today + timedelta(days=540),
            stock_quantity=200,
            unit_price=2.5,
        )
        self.session.add_all([batch1, batch2])
        self.session.commit()

        details = await get_prescription_for_dispensing(
            visit_id=self.visit.id,
            db=self.session,
            current_user=self.pharmacist,
        )

        self.assertEqual(len(details.medicines), 1)
        med = details.medicines[0]
        self.assertEqual(len(med.available_batches), 2)
        self.assertEqual(med.recommended_batch_id, batch1.id)
        self.assertTrue(med.available_batches[0].is_fefo_recommended)
        self.assertEqual(med.available_batches[0].batch_number, "MF2604")
        self.assertEqual(med.total_available_stock, 215)

    async def test_dispense_deducts_exact_selected_batch_and_partial_quantity(self):
        """Verify dispensing deducts stock ONLY from chosen batch and honors partial quantity."""
        today = date.today()
        batch1 = PharmacyItem(
            brand_name="Glycomet 500",
            drug_name="Metformin 500mg",
            batch_number="MF-BATCH-1",
            expiry_date=today + timedelta(days=90),
            stock_quantity=20,
            unit_price=2.0,
        )
        batch2 = PharmacyItem(
            brand_name="Glycomet 500",
            drug_name="Metformin 500mg",
            batch_number="MF-BATCH-2",
            expiry_date=today + timedelta(days=365),
            stock_quantity=100,
            unit_price=2.5,
        )
        self.session.add_all([batch1, batch2])
        self.session.commit()

        # Dispense partial quantity (15 tabs) specifically from Batch 2
        payload = DispenseRequest(
            visit_id=self.visit.id,
            payment_mode="Cash",
            dispensed_items=[
                DispenseItemRequest(
                    prescription_item_id=self.drug.id,
                    drug_name="Metformin 500mg",
                    brand_name="Glycomet 500",
                    batch_id=batch2.id,
                    prescribed_quantity=60,
                    dispensed_quantity=15,
                    unit_price=2.5,
                )
            ],
        )

        res = await dispense_prescription_and_bill(
            visit_id=self.visit.id,
            payload=payload,
            db=self.session,
            current_user=self.pharmacist,
        )

        self.assertTrue(res.success)
        self.assertEqual(res.total_amount, 37.50)  # 15 × 2.50

        # Assert Batch 2 stock decreased by exactly 15 (100 -> 85), Batch 1 untouched (20)
        self.session.refresh(batch1)
        self.session.refresh(batch2)
        self.assertEqual(batch1.stock_quantity, 20)
        self.assertEqual(batch2.stock_quantity, 85)

        # Assert stock deduction audit log was created
        log = (
            self.session.query(PharmacyStockLog)
            .filter(PharmacyStockLog.item_id == batch2.id)
            .order_by(PharmacyStockLog.id.desc())
            .first()
        )
        self.assertIsNotNone(log)
        self.assertEqual(log.change_type, "DISPENSE")
        self.assertEqual(log.quantity_change, -15)
        self.assertEqual(log.new_stock_level, 85)

        # Assert visit status changed to DISPENSED
        self.session.refresh(self.visit)
        self.assertEqual(self.visit.status, VisitStatus.DISPENSED.value)

    async def test_dispense_fails_cleanly_on_insufficient_batch_stock(self):
        """Verify backend rejects dispense request when requested quantity exceeds selected batch stock."""
        today = date.today()
        low_batch = PharmacyItem(
            brand_name="Zomelis 50",
            drug_name="Vildagliptin 50mg",
            batch_number="ZM-01",
            expiry_date=today + timedelta(days=120),
            stock_quantity=5,
            unit_price=10.0,
        )
        self.session.add(low_batch)
        self.session.commit()

        payload = DispenseRequest(
            visit_id=self.visit.id,
            payment_mode="Cash",
            dispensed_items=[
                DispenseItemRequest(
                    prescription_item_id=self.drug.id,
                    drug_name="Vildagliptin 50mg",
                    brand_name="Zomelis 50",
                    batch_id=low_batch.id,
                    dispensed_quantity=10,  # Exceeds available 5
                    unit_price=10.0,
                )
            ],
        )

        with self.assertRaises(HTTPException) as ctx:
            await dispense_prescription_and_bill(
                visit_id=self.visit.id,
                payload=payload,
                db=self.session,
                current_user=self.pharmacist,
            )

        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("Insufficient stock", ctx.exception.detail)

        # Verify stock was untouched on abort
        self.session.refresh(low_batch)
        self.assertEqual(low_batch.stock_quantity, 5)


if __name__ == "__main__":
    unittest.main()
