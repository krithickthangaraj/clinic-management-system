import unittest
import asyncio
from datetime import datetime, date, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi import HTTPException

from app.core.database import Base
from app.models.user import User
from app.models.enums import UserRole, VisitStatus
from app.models.patient import Patient
from app.models.visit import Visit
from app.models.prescription import Prescription, PrescriptionDrug
from app.models.pharmacy import PharmacyItem, PharmacyDispenseLog
from app.schemas.pharmacy import DispenseRequest
from seed_pharmacy_inventory import MEDICINES_DATA
from app.api.v1.endpoints.pharmacy import (
    list_pharmacy_inventory,
    get_pharmacy_queue,
    get_prescription_for_dispensing,
    dispense_prescription_and_bill,
)


class TestPharmacyFlow(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
        Base.metadata.create_all(bind=cls.engine)
        cls.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=cls.engine)

    def setUp(self):
        self.db = self.SessionLocal()

        # Seed Pharmacist
        self.pharmacist = self.db.query(User).filter_by(username="pharmacist_ravi").first()
        if not self.pharmacist:
            self.pharmacist = User(
                username="pharmacist_ravi",
                hashed_password="pw",
                full_name="Pharmacist Ravi",
                role=UserRole.PHARMACY.value,
            )
            self.db.add(self.pharmacist)

        # Seed Doctor
        self.doctor = self.db.query(User).filter_by(username="dr_jeyagowthaman").first()
        if not self.doctor:
            self.doctor = User(
                username="dr_jeyagowthaman",
                hashed_password="pw",
                full_name="Dr. T.S.Jeyagowthaman",
                role=UserRole.DOCTOR.value,
            )
            self.db.add(self.doctor)

        # Seed Inventory with the 50 medicines if empty
        if self.db.query(PharmacyItem).count() == 0:
            for med in MEDICINES_DATA:
                self.db.add(PharmacyItem(**med))
        self.db.commit()

    def tearDown(self):
        self.db.close()

    def test_seed_contains_exactly_50_items(self):
        """1. Seed Verification: Assert exactly 50 items exist in the inventory database"""
        count = self.db.query(PharmacyItem).count()
        self.assertEqual(count, 50)

        # Verify recognizable medicines exist
        dolo = self.db.query(PharmacyItem).filter(PharmacyItem.brand_name.ilike("Dolo 650%")).first()
        self.assertIsNotNone(dolo)
        self.assertEqual(dolo.drug_name, "Paracetamol 650mg")
        self.assertEqual(dolo.unit_price, 3.50)

        augmentin = self.db.query(PharmacyItem).filter(PharmacyItem.brand_name.ilike("Augmentin%")).first()
        self.assertIsNotNone(augmentin)

        panpro = self.db.query(PharmacyItem).filter(PharmacyItem.brand_name.ilike("Panpro%")).first()
        self.assertIsNotNone(panpro)

    def test_dispense_prescription_success_and_stock_deduction(self):
        """
        2. Dispensing Flow:
        - Mock a pending prescription with 'Dolo 650mg Tab' (Qty: 10) & 'Panpro 40mg Tab' (Qty: 5).
        - Record initial stock levels.
        - Trigger dispense endpoint.
        - Assert stock decreases by exactly the dispensed quantities.
        - Assert visit status becomes DISPENSED and PharmacyDispenseLog is recorded.
        """
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        # 1. Create Patient & Visit
        patient = Patient(name="Ramesh Kumar", gender="Male", age_years=45, phone="9876543201")
        self.db.add(patient)
        self.db.flush()

        visit = Visit(
            visit_number="V-PHARM-001",
            patient_id=patient.id,
            doctor_id=self.doctor.id,
            status=VisitStatus.COMPLETED.value,
            consultant_assigned="Dr. T.S.Jeyagowthaman",
        )
        self.db.add(visit)
        self.db.flush()

        # 2. Add Prescription with Dolo (qty 10) and Panpro (qty 5)
        prescription = Prescription(
            visit_id=visit.id,
            doctor_id=self.doctor.id,
            created_at=datetime.utcnow(),
        )
        self.db.add(prescription)
        self.db.flush()

        drug1 = PrescriptionDrug(
            prescription_id=prescription.id,
            s_no=1,
            brand_name="Dolo 650mg Tab",
            drug_name="Paracetamol 650mg",
            dosage="1 Tab",
            frequency="TDS (1-1-1)",
            number_of_days=3,
            quantity=10,
        )
        drug2 = PrescriptionDrug(
            prescription_id=prescription.id,
            s_no=2,
            brand_name="Panpro 40mg Tab",
            drug_name="Pantoprazole 40mg",
            dosage="1 Tab",
            frequency="OD (1-0-0)",
            number_of_days=5,
            quantity=5,
        )
        self.db.add(drug1)
        self.db.add(drug2)
        self.db.commit()

        # Note initial stock
        dolo_item = self.db.query(PharmacyItem).filter(PharmacyItem.brand_name.ilike("Dolo 650%")).first()
        panpro_item = self.db.query(PharmacyItem).filter(PharmacyItem.brand_name.ilike("Panpro 40%")).first()
        initial_dolo_stock = dolo_item.stock_quantity
        initial_panpro_stock = panpro_item.stock_quantity

        # 3. Check Pharmacy Queue contains this patient
        queue = loop.run_until_complete(
            get_pharmacy_queue(db=self.db, current_user=self.pharmacist)
        )
        queue_visit_ids = [q.visit_id for q in queue]
        self.assertIn(visit.id, queue_visit_ids)

        # 4. Check Prescription Match Details
        details = loop.run_until_complete(
            get_prescription_for_dispensing(visit_id=visit.id, db=self.db, current_user=self.pharmacist)
        )
        self.assertEqual(len(details.medicines), 2)
        expected_bill = (10 * dolo_item.unit_price) + (5 * panpro_item.unit_price)
        self.assertAlmostEqual(details.total_estimated_amount, expected_bill, places=2)
        self.assertTrue(details.can_dispense)

        # 5. Trigger Dispense Transaction
        dispense_req = DispenseRequest(payment_mode="Cash")
        dispense_res = loop.run_until_complete(
            dispense_prescription_and_bill(visit_id=visit.id, payload=dispense_req, db=self.db, current_user=self.pharmacist)
        )

        self.assertTrue(dispense_res.success)
        self.assertEqual(dispense_res.total_items_dispensed, 2)
        self.assertAlmostEqual(dispense_res.total_amount, expected_bill, places=2)

        # 6. Verify Stock Decreases & Visit Status Updated
        self.db.refresh(dolo_item)
        self.db.refresh(panpro_item)
        self.db.refresh(visit)

        self.assertEqual(dolo_item.stock_quantity, initial_dolo_stock - 10)
        self.assertEqual(panpro_item.stock_quantity, initial_panpro_stock - 5)
        self.assertEqual(visit.status, VisitStatus.DISPENSED.value)

        # 7. Verify Dispense Log
        log = self.db.query(PharmacyDispenseLog).filter(PharmacyDispenseLog.visit_id == visit.id).first()
        self.assertIsNotNone(log)
        self.assertAlmostEqual(log.total_amount, expected_bill, places=2)
        self.assertEqual(log.payment_mode, "Cash")

        loop.close()

    def test_out_of_stock_prevention_raises_400(self):
        """
        3. Out of Stock Prevention:
        - Mock a prescription requesting quantity greater than available stock.
        - Assert the API raises 400 Bad Request with informative error message.
        - Assert stock is NOT deducted.
        """
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        # 1. Create Patient & Visit
        patient = Patient(name="Suresh Raina", gender="Male", age_years=36, phone="9876543202")
        self.db.add(patient)
        self.db.flush()

        visit = Visit(
            visit_number="V-PHARM-002",
            patient_id=patient.id,
            doctor_id=self.doctor.id,
            status=VisitStatus.COMPLETED.value,
        )
        self.db.add(visit)
        self.db.flush()

        # Item with 0 stock (e.g. Kenacort 40mg Inj has stock: 0)
        kenacort = self.db.query(PharmacyItem).filter(PharmacyItem.brand_name.ilike("Kenacort%")).first()
        self.assertIsNotNone(kenacort)
        self.assertEqual(kenacort.stock_quantity, 0)

        prescription = Prescription(visit_id=visit.id, doctor_id=self.doctor.id)
        self.db.add(prescription)
        self.db.flush()

        drug = PrescriptionDrug(
            prescription_id=prescription.id,
            brand_name="Kenacort 40mg Inj 1ml",
            drug_name="Triamcinolone Acetonide",
            dosage="1 Inj",
            frequency="STAT",
            quantity=2,
        )
        self.db.add(drug)
        self.db.commit()

        # Attempt to dispense -> Must raise HTTPException 400
        with self.assertRaises(HTTPException) as ctx:
            loop.run_until_complete(
                dispense_prescription_and_bill(visit_id=visit.id, db=self.db, current_user=self.pharmacist)
            )

        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("Insufficient stock", ctx.exception.detail)

        # Assert status remains COMPLETED (not dispensed)
        self.db.refresh(visit)
        self.assertEqual(visit.status, VisitStatus.COMPLETED.value)

        loop.close()


if __name__ == "__main__":
    unittest.main()
