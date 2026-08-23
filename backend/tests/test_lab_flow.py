import unittest
import asyncio
from datetime import datetime, date, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi import HTTPException

from app.core.database import Base
from app.models.user import User
from app.models.enums import UserRole, VisitStatus, TestStatus
from app.models.patient import Patient
from app.models.visit import Visit
from app.models.test import Test
from app.models.lab import LabTestMaster, LabOrder, LabResult
from app.schemas.lab import (
    LabTestMasterCreate,
    LabTestMasterUpdate,
    LabOrderFinalizeRequest,
    LabResultItem,
)
from seed_lab_master import LAB_TESTS_SEEDS
from app.api.v1.endpoints.lab import (
    list_lab_test_master,
    create_lab_test_master,
    update_lab_test_master,
    get_lab_queue,
    get_lab_order_details,
    finalize_lab_order,
)


class TestLabFlow(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
        Base.metadata.create_all(bind=cls.engine)
        cls.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=cls.engine)

    def setUp(self):
        self.db = self.SessionLocal()

        # Seed Admin
        self.admin = self.db.query(User).filter_by(username="admin_lab_test").first()
        if not self.admin:
            self.admin = User(
                username="admin_lab_test",
                hashed_password="pw",
                full_name="Admin Officer",
                role=UserRole.ADMIN.value,
            )
            self.db.add(self.admin)

        # Seed Doctor
        self.doctor = self.db.query(User).filter_by(username="dr_jeyagowthaman_lab").first()
        if not self.doctor:
            self.doctor = User(
                username="dr_jeyagowthaman_lab",
                hashed_password="pw",
                full_name="Dr. T.S.Jeyagowthaman",
                role=UserRole.DOCTOR.value,
            )
            self.db.add(self.doctor)

        # Seed Lab Technician
        self.technician = self.db.query(User).filter_by(username="tech_anita").first()
        if not self.technician:
            self.technician = User(
                username="tech_anita",
                hashed_password="pw",
                full_name="Lab Technician Anita",
                role=UserRole.LAB.value,
            )
            self.db.add(self.technician)

        # Seed LabTestMaster if empty
        if self.db.query(LabTestMaster).count() == 0:
            for item in LAB_TESTS_SEEDS:
                self.db.add(LabTestMaster(**item))

        self.db.commit()

    def tearDown(self):
        self.db.close()

    # -------------------------------------------------------------------------
    # 1. Lab Master Seed Test
    # -------------------------------------------------------------------------
    def test_01_lab_master_catalog_loaded_correctly(self):
        """Verify the 20 standard lab test profiles are seeded with clinical reference ranges."""
        count = self.db.query(LabTestMaster).filter(LabTestMaster.is_active == True).count()
        self.assertEqual(count, 20, "LabTestMaster must contain exactly 20 standard test profiles.")

        # Test Hemoglobin (Hb)
        hb = self.db.query(LabTestMaster).filter_by(test_name="Hemoglobin (Hb)").first()
        self.assertIsNotNone(hb)
        self.assertEqual(hb.category, "Hematology")
        self.assertEqual(hb.normal_range, "13.0 - 17.0")
        self.assertEqual(hb.unit, "g/dL")
        self.assertEqual(hb.price, 120.00)

        # Test Fasting Blood Sugar (FBS)
        fbs = self.db.query(LabTestMaster).filter_by(test_name="Fasting Blood Sugar (FBS)").first()
        self.assertIsNotNone(fbs)
        self.assertEqual(fbs.category, "Biochemistry")
        self.assertEqual(fbs.normal_range, "70 - 100")
        self.assertEqual(fbs.unit, "mg/dL")

        # Test Serum Creatinine
        creat = self.db.query(LabTestMaster).filter_by(test_name="Serum Creatinine").first()
        self.assertIsNotNone(creat)
        self.assertEqual(creat.normal_range, "0.6 - 1.2")
        self.assertEqual(creat.unit, "mg/dL")

    # -------------------------------------------------------------------------
    # 2. Master Catalog Search & CRUD Test
    # -------------------------------------------------------------------------
    def test_02_lab_master_crud_and_search(self):
        """Test search filtering and adding a new test profile to the catalog."""
        # 1. Test search endpoint
        results = asyncio.run(
            list_lab_test_master(search="Sugar", category="Biochemistry", db=self.db, current_user=self.doctor)
        )
        self.assertGreaterEqual(len(results), 2)  # FBS and PPBS

        # 2. Create custom lab test
        create_payload = LabTestMasterCreate(
            test_name="Serum Ferritin",
            category="Biochemistry",
            normal_range="30 - 400",
            unit="ng/mL",
            price=480.00,
        )
        created = asyncio.run(
            create_lab_test_master(payload=create_payload, db=self.db, current_user=self.technician)
        )
        self.assertEqual(created.test_name, "Serum Ferritin")
        self.assertEqual(created.price, 480.00)

        # 3. Update reference range
        update_payload = LabTestMasterUpdate(normal_range="20 - 300", price=500.00)
        updated = asyncio.run(
            update_lab_test_master(item_id=created.id, payload=update_payload, db=self.db, current_user=self.technician)
        )
        self.assertEqual(updated.normal_range, "20 - 300")
        self.assertEqual(updated.price, 500.00)

    # -------------------------------------------------------------------------
    # 3. Doctor Orders Investigation & Patient Appears in Queue
    # -------------------------------------------------------------------------
    def test_03_doctor_orders_tests_and_appears_in_lab_queue(self):
        """Doctor orders investigations for a patient -> Patient appears in lab queue."""
        # 1. Register Patient & Visit
        patient = Patient(
            patient_id="PAT-LAB-001",
            name="Murugan Velu",
            age=54,
            gender="Male",
            phone="9845012345",
        )
        self.db.add(patient)
        self.db.commit()

        visit = Visit(
            visit_number="T-LAB-01",
            patient_id=patient.id,
            doctor_id=self.doctor.id,
            consultant_assigned="Dr. T.S.Jeyagowthaman",
            status=VisitStatus.CONSULTED.value,
        )
        self.db.add(visit)
        self.db.commit()

        # 2. Doctor prescribes tests
        test1 = Test(
            visit_id=visit.id,
            test_type="Blood Test",
            test_name="Hemoglobin (Hb)",
            status=TestStatus.ORDERED.value,
        )
        test2 = Test(
            visit_id=visit.id,
            test_type="Blood Test",
            test_name="Serum Creatinine",
            status=TestStatus.ORDERED.value,
        )
        self.db.add_all([test1, test2])
        self.db.commit()

        # 3. Technician views queue
        queue = asyncio.run(
            get_lab_queue(db=self.db, current_user=self.technician)
        )
        found_item = next((q for q in queue if q.visit_id == visit.id), None)
        self.assertIsNotNone(found_item, "Patient visit with ordered investigations must appear in lab queue")
        self.assertEqual(found_item.patient_name, "Murugan Velu")
        self.assertEqual(found_item.visit_number, "T-LAB-01")
        self.assertEqual(len(found_item.prescribed_tests), 2)
        self.assertIn("Hemoglobin (Hb)", found_item.prescribed_tests)
        self.assertIn("Serum Creatinine", found_item.prescribed_tests)

    # -------------------------------------------------------------------------
    # 4. Lab Tech Finalizes Results & "Close the Loop"
    # -------------------------------------------------------------------------
    def test_04_finalize_lab_order_and_sync_to_doctor_desk(self):
        """Lab technician inputs results (with abnormal flag) and finalizes -> Result syncs to visit.laboratory_reports."""
        # 1. Fetch Order Details
        visit = self.db.query(Visit).filter_by(visit_number="T-LAB-01").first()
        self.assertIsNotNone(visit)

        hb_master = self.db.query(LabTestMaster).filter_by(test_name="Hemoglobin (Hb)").first()
        creat_master = self.db.query(LabTestMaster).filter_by(test_name="Serum Creatinine").first()

        order_details = asyncio.run(
            get_lab_order_details(visit_id=visit.id, db=self.db, current_user=self.technician)
        )
        self.assertEqual(order_details.visit_id, visit.id)
        self.assertEqual(len(order_details.prescribed_tests), 2)

        # 2. Finalize Results:
        # Hb = 10.5 g/dL (Abnormal low, range 13.0-17.0)
        # Creatinine = 0.9 mg/dL (Normal, range 0.6-1.2)
        finalize_payload = LabOrderFinalizeRequest(
            visit_id=visit.id,
            results=[
                LabResultItem(
                    test_id=hb_master.id,
                    test_name="Hemoglobin (Hb)",
                    result_value="10.5",
                    unit="g/dL",
                    normal_range="13.0 - 17.0",
                    is_abnormal=True,
                    notes="Mild microcytic anemia pattern",
                ),
                LabResultItem(
                    test_id=creat_master.id,
                    test_name="Serum Creatinine",
                    result_value="0.9",
                    unit="mg/dL",
                    normal_range="0.6 - 1.2",
                    is_abnormal=False,
                    notes="Normal renal parameter",
                ),
            ],
            payment_mode="Cash",
        )

        res = asyncio.run(
            finalize_lab_order(payload=finalize_payload, db=self.db, current_user=self.technician)
        )

        # Assert response
        self.assertTrue(res.success)
        self.assertEqual(res.total_tests_processed, 2)
        self.assertEqual(res.total_abnormal_flags, 1)
        self.assertIn("Hemoglobin (Hb): 10.5 g/dL (H)", res.summary_results)
        self.assertIn("Serum Creatinine: 0.9 mg/dL", res.summary_results)

        # 3. Assert LabOrder saved in DB
        lab_order = self.db.query(LabOrder).filter_by(visit_id=visit.id).first()
        self.assertIsNotNone(lab_order)
        self.assertEqual(lab_order.status, "COMPLETED")
        self.assertEqual(lab_order.total_amount, hb_master.price + creat_master.price)

        # 4. Assert Individual LabResults saved with abnormal flag
        results_in_db = self.db.query(LabResult).filter_by(lab_order_id=lab_order.id).all()
        self.assertEqual(len(results_in_db), 2)
        hb_res = next(r for r in results_in_db if r.test_name == "Hemoglobin (Hb)")
        self.assertEqual(hb_res.result_value, "10.5")
        self.assertTrue(hb_res.is_abnormal)

        # 5. "Close the Loop" Verification:
        # Assert visit.laboratory_reports is automatically populated with the summary string!
        self.db.refresh(visit)
        self.assertIsNotNone(visit.laboratory_reports)
        self.assertEqual(visit.laboratory_reports, res.summary_results)
        self.assertIn("Hemoglobin (Hb): 10.5 g/dL (H)", visit.laboratory_reports)

        # 6. Assert all Test records for this visit are marked COMPLETED
        for t in visit.tests:
            self.assertEqual(t.status, TestStatus.COMPLETED.value)
            self.assertEqual(t.results, res.summary_results)


if __name__ == "__main__":
    unittest.main()
