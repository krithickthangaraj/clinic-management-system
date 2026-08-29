import unittest
import json
from datetime import date, datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.models.user import User
from app.models.enums import UserRole, VisitStatus
from app.models.patient import Patient
from app.models.visit import Visit
from app.models.prescription import Prescription, PrescriptionDrug
from app.schemas.consultation import (
    FullPrescriptionPayload,
    ClinicalAssessmentPayload,
    DiagnosisItem,
    ChiefComplaintItem,
    RXDrugItem,
    BillingAndPlanPayload,
)
from app.api.v1.endpoints.prescriptions import (
    save_full_prescription,
    get_full_prescription,
)


class TestPrescriptionIdempotentDiffAndDiagnosis(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(self.engine)
        self.Session = sessionmaker(bind=self.engine)
        self.session = self.Session()

        # Seed Doctor
        self.doctor = User(
            username="doc_anuradha",
            hashed_password="hash",
            full_name="Dr. Anuradha",
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

        # Seed Visit
        self.visit = Visit(
            visit_number="V-20260829-008",
            patient_id=self.patient.id,
            doctor_id=self.doctor.id,
            status=VisitStatus.IN_CONSULTATION.value,
            consultant_assigned="Dr. Anuradha",
        )
        self.session.add(self.visit)
        self.session.commit()

    def tearDown(self):
        self.session.close()
        Base.metadata.drop_all(self.engine)

    async def test_idempotent_drug_upsert_preserves_primary_key_ids(self):
        """Verify auto-saving a prescription draft does NOT delete and recreate drug IDs."""
        v_id = self.visit.id

        # 1. First Save: Add 2 Drugs
        payload1 = FullPrescriptionPayload(
            visit_id=v_id,
            patient_id=self.patient.id,
            consultant_name="Dr. Anuradha",
            medicines=[
                RXDrugItem(
                    s_no=1,
                    drug_name="Telmisartan 40mg",
                    dosage="1 Tab",
                    frequency="1-0-0",
                    days=30,
                    instructions="Before breakfast",
                    quantity=30,
                ),
                RXDrugItem(
                    s_no=2,
                    drug_name="Metformin 500mg",
                    dosage="1 Tab",
                    frequency="1-0-1",
                    days=30,
                    instructions="After food",
                    quantity=60,
                ),
            ],
            status_action="save_draft",
        )

        res1 = await save_full_prescription(
            payload=payload1,
            db=self.session,
            current_user=self.doctor,
        )
        self.assertEqual(len(res1.medicines), 2)

        drugs_after_first = (
            self.session.query(PrescriptionDrug)
            .join(Prescription)
            .filter(Prescription.visit_id == v_id)
            .order_by(PrescriptionDrug.s_no)
            .all()
        )
        first_id_1 = drugs_after_first[0].id
        first_id_2 = drugs_after_first[1].id
        self.assertIsNotNone(first_id_1)
        self.assertIsNotNone(first_id_2)

        # 2. Second Save (Auto-Save): Update quantity of Drug 1 and keep Drug 2
        payload2 = FullPrescriptionPayload(
            visit_id=v_id,
            patient_id=self.patient.id,
            consultant_name="Dr. Anuradha",
            medicines=[
                RXDrugItem(
                    id=first_id_1,
                    s_no=1,
                    drug_name="Telmisartan 40mg",
                    dosage="1 Tab",
                    frequency="1-0-0",
                    days=15,
                    instructions="Before breakfast",
                    quantity=15,
                ),
                RXDrugItem(
                    id=first_id_2,
                    s_no=2,
                    drug_name="Metformin 500mg",
                    dosage="1 Tab",
                    frequency="1-0-1",
                    days=30,
                    instructions="After food",
                    quantity=60,
                ),
            ],
            status_action="save_draft",
        )

        res2 = await save_full_prescription(
            payload=payload2,
            db=self.session,
            current_user=self.doctor,
        )
        self.assertEqual(len(res2.medicines), 2)

        # 3. Assert Primary Key IDs did NOT change (No ID churn)
        drugs_after_second = (
            self.session.query(PrescriptionDrug)
            .join(Prescription)
            .filter(Prescription.visit_id == v_id)
            .order_by(PrescriptionDrug.s_no)
            .all()
        )
        self.assertEqual(drugs_after_second[0].id, first_id_1)  # ID preserved!
        self.assertEqual(drugs_after_second[1].id, first_id_2)  # ID preserved!
        self.assertEqual(drugs_after_second[0].quantity, 15)  # In-place update!

    async def test_diagnosis_with_commas_never_fragments(self):
        """Verify diagnoses containing commas are preserved as single intact medical conditions."""
        v_id = self.visit.id
        payload = FullPrescriptionPayload(
            visit_id=v_id,
            patient_id=self.patient.id,
            consultant_name="Dr. Anuradha",
            assessment=ClinicalAssessmentPayload(
                diagnosis=[
                    DiagnosisItem(
                        code="I10",
                        name="Hypertension, Essential (Primary)",
                        is_chronic=True,
                    ),
                    DiagnosisItem(
                        code="E11.9",
                        name="Diabetes Mellitus, Type 2 without complications",
                        is_chronic=True,
                    ),
                ],
                complaints=[
                    ChiefComplaintItem(
                        complaint="Fever",
                        duration_value=3,
                        duration_unit="Days",
                    )
                ],
            ),
            medicines=[
                RXDrugItem(
                    drug_name="Paracetamol 650mg",
                    dosage="1 Tab",
                    frequency="SOS",
                    days=5,
                    quantity=5,
                )
            ],
            status_action="completed",
        )

        await save_full_prescription(
            payload=payload,
            db=self.session,
            current_user=self.doctor,
        )

        # Fetch full prescription and verify intact diagnoses
        get_res = await get_full_prescription(
            visit_id=v_id,
            db=self.session,
            current_user=self.doctor,
        )

        diag_list = get_res.assessment.diagnosis
        self.assertEqual(len(diag_list), 2)  # Exactly 2 diagnoses, not 4 broken fragments!
        first_diag = diag_list[0]
        if isinstance(first_diag, dict):
            self.assertIn("Hypertension, Essential", first_diag.get("name", ""))
        else:
            self.assertIn("Hypertension, Essential", str(first_diag))

    async def test_removing_one_drug_deletes_only_that_drug_and_preserves_others(self):
        """Verify removing a medication only deletes that specific row and preserves remaining IDs."""
        v_id = self.visit.id

        # 1. First Save: 3 Drugs
        payload1 = FullPrescriptionPayload(
            visit_id=v_id,
            medicines=[
                RXDrugItem(s_no=1, drug_name="Drug A", dosage="1 Tab", quantity=10),
                RXDrugItem(s_no=2, drug_name="Drug B", dosage="1 Tab", quantity=20),
                RXDrugItem(s_no=3, drug_name="Drug C", dosage="1 Tab", quantity=30),
            ],
            status_action="save_draft",
        )
        res1 = await save_full_prescription(payload=payload1, db=self.session, current_user=self.doctor)
        id_a = res1.medicines[0].id
        id_b = res1.medicines[1].id
        id_c = res1.medicines[2].id

        # 2. Second Save: Remove Drug B, keep Drug A and Drug C
        payload2 = FullPrescriptionPayload(
            visit_id=v_id,
            medicines=[
                RXDrugItem(id=id_a, s_no=1, drug_name="Drug A", dosage="1 Tab", quantity=10),
                RXDrugItem(id=id_c, s_no=2, drug_name="Drug C", dosage="1 Tab", quantity=30),
            ],
            status_action="save_draft",
        )
        res2 = await save_full_prescription(payload=payload2, db=self.session, current_user=self.doctor)
        self.assertEqual(len(res2.medicines), 2)

        drugs_remaining = (
            self.session.query(PrescriptionDrug)
            .join(Prescription)
            .filter(Prescription.visit_id == v_id)
            .order_by(PrescriptionDrug.s_no)
            .all()
        )
        self.assertEqual(len(drugs_remaining), 2)
        self.assertEqual(drugs_remaining[0].id, id_a)
        self.assertEqual(drugs_remaining[1].id, id_c)
        # Verify Drug B is deleted from DB
        deleted_b = self.session.query(PrescriptionDrug).filter(PrescriptionDrug.id == id_b).first()
        self.assertIsNone(deleted_b)


if __name__ == "__main__":
    unittest.main()
