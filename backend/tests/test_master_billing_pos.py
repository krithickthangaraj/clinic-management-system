import unittest
from datetime import date, datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.models.user import User
from app.models.enums import UserRole, VisitStatus
from app.models.patient import Patient
from app.models.visit import Visit
from app.models.visit_relations import VisitPayment
from app.models.test import Test
from app.models.lab import LabTestMaster
from app.models.prescription import Prescription, PrescriptionDrug
from app.models.pharmacy import PharmacyItem
from app.models.invoice import Invoice, InvoiceItem
from app.schemas.invoice import (
    ServiceLineItem,
    InvoiceSettlementPayload,
)
from app.api.v1.endpoints.billing import (
    get_visit_billing_rollup_summary,
    settle_master_invoice,
    get_invoice_by_visit_id,
)


class TestMasterBillingPOSEngine(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(self.engine)
        self.Session = sessionmaker(bind=self.engine)
        self.session = self.Session()

        # Seed Receptionist
        self.receptionist = User(
            username="reception_1",
            hashed_password="hash",
            full_name="Front Desk Officer",
            role=UserRole.RECEPTION.value,
        )
        self.session.add(self.receptionist)

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

        # Seed Visit
        self.visit = Visit(
            visit_number="V-20260829-012",
            patient_id=self.patient.id,
            doctor_id=self.doctor.id,
            status=VisitStatus.IN_CONSULTATION.value,
            consultant_assigned="Dr. T.S.Jeyagowthaman",
        )
        self.session.add(self.visit)
        self.session.flush()

        # Tier 1: Seed VisitPayment
        self.payment = VisitPayment(
            visit_id=self.visit.id,
            doctor_fee=200.0,
            total=200.0,
            payment_status="pending",
        )
        self.session.add(self.payment)

        # Tier 2: Seed Lab Test Master & Ordered Test
        self.lab_master = LabTestMaster(
            test_name="Complete Blood Count (CBC)",
            category="Hematology",
            normal_range="13.0 - 17.0",
            unit="g/dL",
            price=250.0,
            is_active=True,
        )
        self.session.add(self.lab_master)

        self.test_order = Test(
            visit_id=self.visit.id,
            test_type="Blood Test",
            test_name="Complete Blood Count (CBC)",
            status="COMPLETED",
        )
        self.session.add(self.test_order)

        # Tier 3: Seed Pharmacy Inventory & Prescription Drugs
        self.pharm_item_1 = PharmacyItem(
            brand_name="Telmisartan 40mg Tab",
            drug_name="Telmisartan 40mg",
            category="Tablet",
            batch_number="BAT-TEL-001",
            expiry_date=date(2027, 12, 31),
            unit_price=4.0,
            stock_quantity=100,
        )
        self.pharm_item_2 = PharmacyItem(
            brand_name="Metformin 500mg Tab",
            drug_name="Metformin 500mg",
            category="Tablet",
            batch_number="BAT-MET-001",
            expiry_date=date(2027, 10, 31),
            unit_price=2.5,
            stock_quantity=100,
        )
        self.session.add(self.pharm_item_1)
        self.session.add(self.pharm_item_2)
        self.session.flush()

        self.prescription = Prescription(
            visit_id=self.visit.id,
            doctor_id=self.doctor.id,
        )
        self.session.add(self.prescription)
        self.session.flush()

        self.drug_1 = PrescriptionDrug(
            prescription_id=self.prescription.id,
            s_no=1,
            drug_name="Telmisartan 40mg",
            dosage="1 Tab",
            frequency="1-0-0",
            number_of_days=30,
            quantity=30,
        )
        self.drug_2 = PrescriptionDrug(
            prescription_id=self.prescription.id,
            s_no=2,
            drug_name="Metformin 500mg",
            dosage="1 Tab",
            frequency="1-0-1",
            number_of_days=15,
            quantity=15,
        )
        self.session.add(self.drug_1)
        self.session.add(self.drug_2)
        self.session.commit()

    def tearDown(self):
        self.session.close()
        Base.metadata.drop_all(self.engine)

    async def test_billing_summary_rollup_aggregates_all_three_tiers(self):
        """Verify GET /api/v1/billing/visit/{visit_id}/summary aggregates Doctor + Labs + Pharmacy accurately."""
        summary = await get_visit_billing_rollup_summary(
            visit_id=self.visit.id,
            db=self.session,
            current_user=self.receptionist,
        )

        self.assertEqual(summary.visit_id, self.visit.id)
        self.assertEqual(summary.patient_name, "Ramesh Sundaram")
        self.assertEqual(summary.consultation_fee, 200.00)
        self.assertEqual(summary.lab_total, 250.00)
        self.assertEqual(summary.pharmacy_total, 157.50)  # (30 * 4.0) + (15 * 2.5) = 120 + 37.5 = 157.5
        self.assertEqual(summary.gross_total, 607.50)     # 200 + 250 + 157.5 = 607.5
        self.assertEqual(len(summary.line_items), 4)

    async def test_invoice_settlement_creates_atomic_invoice_and_sequential_number(self):
        """Verify settling invoice creates Invoice record with sequential INV-YYYYMMDD-XXXX numbering."""
        payload = InvoiceSettlementPayload(
            visit_id=self.visit.id,
            patient_id=self.patient.id,
            subtotal=607.50,
            discount_amount=60.75,
            discount_percentage=10.0,
            tax_amount=0.0,
            grand_total=546.75,
            payment_mode="UPI",
            transaction_reference="UPI-REF-99882233",
            items=[
                ServiceLineItem(category="CONSULTATION", item_name="Doctor Fee", quantity=1, unit_price=200.0, subtotal=200.0),
                ServiceLineItem(category="LABORATORY", item_name="CBC Test", quantity=1, unit_price=250.0, subtotal=250.0),
                ServiceLineItem(category="PHARMACY", item_name="Telmisartan 40mg", quantity=30, unit_price=4.0, subtotal=120.0),
                ServiceLineItem(category="PHARMACY", item_name="Metformin 500mg", quantity=15, unit_price=2.5, subtotal=37.5),
            ],
        )

        res = await settle_master_invoice(
            payload=payload,
            db=self.session,
            current_user=self.receptionist,
        )

        self.assertTrue(res.invoice_number.startswith("INV-"))
        self.assertEqual(res.grand_total, 546.75)
        self.assertEqual(res.payment_mode, "UPI")
        self.assertEqual(len(res.items), 4)

        # Verify DB records
        inv_in_db = self.session.query(Invoice).filter(Invoice.id == res.id).first()
        self.assertIsNotNone(inv_in_db)
        self.assertEqual(inv_in_db.payment_status, "PAID")

        # Verify VisitPayment updated
        self.session.refresh(self.payment)
        self.assertEqual(self.payment.total, 546.75)
        self.assertEqual(self.payment.payment_status, "paid")
        self.assertEqual(self.payment.payment_mode, "UPI")

        # Verify Visit status transitioned to COMPLETED
        self.session.refresh(self.visit)
        self.assertEqual(self.visit.status, VisitStatus.COMPLETED.value)

        # Verify get_invoice_by_visit_id returns the settled invoice
        fetch_res = await get_invoice_by_visit_id(
            visit_id=self.visit.id,
            db=self.session,
            current_user=self.receptionist,
        )
        self.assertIsNotNone(fetch_res)
        self.assertEqual(fetch_res.invoice_number, res.invoice_number)


if __name__ == "__main__":
    unittest.main()
