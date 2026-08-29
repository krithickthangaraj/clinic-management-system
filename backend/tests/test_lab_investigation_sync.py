import unittest
from datetime import date, datetime, timedelta
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
    LabOrderFinalizePayload,
    LabParameterEntry,
    LabOrderFinalizeRequest,
    LabResultItem,
)
from app.api.v1.endpoints.lab import (
    finalize_lab_order_by_id,
    finalize_lab_order,
)
from app.api.v1.endpoints.doctor import get_doctor_dashboard


class TestLabInvestigationSyncEngine(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(self.engine)
        self.Session = sessionmaker(bind=self.engine)
        self.session = self.Session()

        # Seed Lab Tech User
        self.lab_tech = User(
            username="lab_tech_1",
            hashed_password="hash",
            full_name="Lead Lab Technician",
            role=UserRole.LAB.value,
        )
        self.session.add(self.lab_tech)

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

        # Seed Visit with consultant
        self.visit = Visit(
            visit_number="V-20260829-004",
            patient_id=self.patient.id,
            doctor_id=self.doctor.id,
            status=VisitStatus.REPORTS_PENDING.value,
            consultant_assigned="Dr. T.S.Jeyagowthaman",
        )
        self.session.add(self.visit)
        self.session.flush()

        # Seed Ordered Test record in tests table
        self.ordered_test = Test(
            visit_id=self.visit.id,
            test_type="Blood Test",
            test_name="Complete Blood Count (CBC)",
            status=TestStatus.ORDERED.value,
        )
        self.session.add(self.ordered_test)

        # Seed Lab Test Master Catalog Item
        self.cbc_master = LabTestMaster(
            test_name="Complete Blood Count",
            category="Hematology",
            normal_range="13.0 - 17.0",
            unit="g/dL",
            price=250.0,
            is_active=True,
        )
        self.session.add(self.cbc_master)
        self.session.flush()

        # Seed LabOrder
        self.lab_order = LabOrder(
            visit_id=self.visit.id,
            patient_id=self.patient.id,
            status="IN_PROGRESS",
            total_amount=250.0,
        )
        self.session.add(self.lab_order)
        self.session.commit()

    def tearDown(self):
        self.session.close()
        Base.metadata.drop_all(self.engine)

    async def test_lab_order_finalization_syncs_tests_table_and_alerts_doctor(self):
        """Verify finalizing lab order updates LabOrder, Test record, and transitions Visit to REPORTS_READY."""
        payload = LabOrderFinalizePayload(
            order_id=self.lab_order.id,
            visit_id=self.visit.id,
            test_name="Complete Blood Count",
            result_summary="Hb: 10.2 g/dL [Low] • WBC: 12,500 [High] • Platelets: 2.4L [Normal]",
            parameters=[
                LabParameterEntry(
                    parameter_name="Hemoglobin",
                    observed_value="10.2",
                    unit="g/dL",
                    reference_range_low=13.0,
                    reference_range_high=17.0,
                    flag="LOW",
                ),
                LabParameterEntry(
                    parameter_name="Total WBC Count",
                    observed_value="12500",
                    unit="/cu.mm",
                    reference_range_low=4000,
                    reference_range_high=11000,
                    flag="HIGH",
                ),
                LabParameterEntry(
                    parameter_name="Platelet Count",
                    observed_value="2.4",
                    unit="Lakhs/cumm",
                    reference_range_low=1.5,
                    reference_range_high=4.5,
                    flag="NORMAL",
                ),
            ],
            technician_remarks="Sample non-hemolyzed. High WBC count correlates with clinical infection.",
        )

        res = await finalize_lab_order_by_id(
            order_id=self.lab_order.id,
            payload=payload,
            db=self.session,
            current_user=self.lab_tech,
        )

        self.assertTrue(res.success)
        self.assertIn("Complete Blood Count", res.message)
        self.assertEqual(res.total_tests_processed, 3)
        self.assertEqual(res.total_abnormal_flags, 2)

        # 1. Assert Visit status transitioned to REPORTS_READY
        self.session.refresh(self.visit)
        self.assertEqual(self.visit.status, VisitStatus.REPORTS_READY.value)
        self.assertIn("Hb: 10.2", self.visit.laboratory_reports)
        self.assertIn("WBC: 12,500", self.visit.laboratory_reports)

        # 2. Assert LabOrder status is COMPLETED
        self.session.refresh(self.lab_order)
        self.assertEqual(self.lab_order.status, "COMPLETED")
        self.assertIsNotNone(self.lab_order.completed_at)

        # 3. Assert Test table status synchronized to COMPLETED
        self.session.refresh(self.ordered_test)
        self.assertEqual(self.ordered_test.status, TestStatus.COMPLETED.value)
        self.assertIsNotNone(self.ordered_test.completed_at)

        # 4. Assert Doctor Desk returns lab_results_ready = True
        dashboard = await get_doctor_dashboard(
            db=self.session,
            current_user=self.doctor,
        )
        patient_queue_item = next((p for p in dashboard.queue if p.visit_id == self.visit.id), None)
        self.assertIsNotNone(patient_queue_item)
        self.assertTrue(patient_queue_item.lab_results_ready)
        self.assertEqual(patient_queue_item.status, VisitStatus.REPORTS_READY.value)

    async def test_legacy_finalize_endpoint_supports_parameter_arrays(self):
        """Verify POST /api/v1/lab/order/finalize also synchronizes visit to REPORTS_READY."""
        req = LabOrderFinalizeRequest(
            visit_id=self.visit.id,
            test_name="Renal Function Test",
            result_summary="Creat: 1.8 mg/dL [High] • Urea: 45 mg/dL [High]",
            parameters=[
                LabParameterEntry(
                    parameter_name="Serum Creatinine",
                    observed_value="1.8",
                    unit="mg/dL",
                    reference_range_low=0.6,
                    reference_range_high=1.2,
                    flag="HIGH",
                )
            ],
        )

        res = await finalize_lab_order(
            payload=req,
            db=self.session,
            current_user=self.lab_tech,
        )

        self.assertTrue(res.success)
        self.session.refresh(self.visit)
        self.assertEqual(self.visit.status, VisitStatus.REPORTS_READY.value)
        self.assertIn("Creat: 1.8", self.visit.laboratory_reports)

    async def test_finalized_lab_order_is_removed_from_pending_lab_queue(self):
        """Verify that after finalization, the visit no longer appears in GET /api/v1/lab/queue."""
        from app.api.v1.endpoints.lab import get_lab_queue

        # 1. Before finalization: Visit is in pending queue
        queue_before = await get_lab_queue(db=self.session, current_user=self.lab_tech)
        self.assertTrue(any(item.visit_id == self.visit.id for item in queue_before))

        # 2. Finalize the order
        req = LabOrderFinalizeRequest(
            visit_id=self.visit.id,
            test_name="Complete Blood Count",
            result_summary="Hb: 14.5 g/dL [Normal]",
            parameters=[
                LabParameterEntry(
                    parameter_name="Hemoglobin",
                    observed_value="14.5",
                    unit="g/dL",
                    reference_range_low=13.0,
                    reference_range_high=17.0,
                    flag="NORMAL",
                )
            ],
        )
        await finalize_lab_order(payload=req, db=self.session, current_user=self.lab_tech)

        # 3. After finalization: Visit is cleanly excluded from pending queue
        queue_after = await get_lab_queue(db=self.session, current_user=self.lab_tech)
        self.assertFalse(any(item.visit_id == self.visit.id for item in queue_after))


if __name__ == "__main__":
    unittest.main()
