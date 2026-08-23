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
from app.models.medicine import MedicineMaster
from app.models.pharmacy import PharmacyItem, PharmacyDispenseLog, PharmacyStockLog
from app.schemas.pharmacy import (
    PharmacyItemCreate,
    PharmacyItemUpdate,
    StockReceiveRequest,
    StockAdjustmentRequest,
    DispenseRequest,
)
from app.schemas.medicine import MedicineMasterCreate
from seed_medicine_master import MEDICINE_MASTER_SEEDS
from app.api.v1.endpoints.pharmacy import (
    create_pharmacy_item,
    update_pharmacy_item,
    receive_pharmacy_stock,
    adjust_pharmacy_stock,
    delete_pharmacy_item,
    get_pharmacy_queue,
    get_prescription_for_dispensing,
    dispense_prescription_and_bill,
)
from app.api.v1.endpoints.master import (
    list_medicine_master,
    create_or_update_medicine_master,
)


class TestFullInventoryRXFlow(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
        Base.metadata.create_all(bind=cls.engine)
        cls.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=cls.engine)

    def setUp(self):
        self.db = self.SessionLocal()

        # Seed Users
        self.admin = self.db.query(User).filter_by(username="admin_test").first()
        if not self.admin:
            self.admin = User(
                username="admin_test",
                hashed_password="pw",
                full_name="Admin Test",
                role=UserRole.ADMIN.value,
            )
            self.db.add(self.admin)

        self.doctor = self.db.query(User).filter_by(username="doctor_test").first()
        if not self.doctor:
            self.doctor = User(
                username="doctor_test",
                hashed_password="pw",
                full_name="Dr. T.S.Jeyagowthaman",
                role=UserRole.DOCTOR.value,
            )
            self.db.add(self.doctor)

        self.pharmacist = self.db.query(User).filter_by(username="pharm_test").first()
        if not self.pharmacist:
            self.pharmacist = User(
                username="pharm_test",
                hashed_password="pw",
                full_name="Pharmacist Ravi",
                role=UserRole.PHARMACY.value,
            )
            self.db.add(self.pharmacist)

        # Seed MedicineMaster dictionary if empty
        if self.db.query(MedicineMaster).count() == 0:
            for med in MEDICINE_MASTER_SEEDS:
                self.db.add(MedicineMaster(**med))

        self.db.commit()

    def tearDown(self):
        self.db.close()

    # -------------------------------------------------------------------------
    # 1. Master Seed Test
    # -------------------------------------------------------------------------
    def test_01_master_seed_exact_records_loaded(self):
        """Verify the 40 Medicine Master items are loaded with correct defaults."""
        count = self.db.query(MedicineMaster).count()
        self.assertEqual(count, 40, "MedicineMaster must contain exactly 40 records.")

        # Test Zental 400mg Tab.
        zental = self.db.query(MedicineMaster).filter_by(brand_name="Zental 400mg Tab.").first()
        self.assertIsNotNone(zental)
        self.assertEqual(zental.drug_name, "Albendazole")
        self.assertEqual(zental.default_dosage, "1 Tab")
        self.assertEqual(zental.default_frequency, "STAT")
        self.assertEqual(zental.default_days, 1)
        self.assertEqual(zental.default_instructions, "To chew at bed time")

        # Test Panpro 40mg Tab.
        panpro = self.db.query(MedicineMaster).filter_by(brand_name="Panpro 40mg Tab.").first()
        self.assertIsNotNone(panpro)
        self.assertEqual(panpro.drug_name, "Pantoprazole")
        self.assertEqual(panpro.default_dosage, "1 Tab")
        self.assertEqual(panpro.default_frequency, "OD (1-0-0)")
        self.assertEqual(panpro.default_days, 3)
        self.assertEqual(panpro.default_instructions, "Before Food")

        # Test Dolo 650mg Tab.
        dolo = self.db.query(MedicineMaster).filter_by(brand_name="Dolo 650mg Tab.").first()
        self.assertIsNotNone(dolo)
        self.assertEqual(dolo.drug_name, "Paracetamol")
        self.assertEqual(dolo.default_dosage, "1 Tab")
        self.assertEqual(dolo.default_frequency, "SOS")
        self.assertEqual(dolo.default_days, 4)
        self.assertEqual(dolo.default_instructions, "Fever, Headache")

    # -------------------------------------------------------------------------
    # 2. RX Auto-Fill & Inline Save-to-Master Test
    # -------------------------------------------------------------------------
    def test_02_rx_auto_fill_and_save_to_master(self):
        """Mock doctor selecting Panpro 40mg Tab and assert payload with quantity 3."""
        # 1. Test search autocomplete
        search_results = asyncio.run(
            list_medicine_master(search="Panpro", db=self.db, current_user=self.doctor)
        )
        self.assertGreaterEqual(len(search_results), 1)
        panpro_template = search_results[0]
        self.assertEqual(panpro_template.brand_name, "Panpro 40mg Tab.")
        self.assertEqual(panpro_template.default_frequency, "OD (1-0-0)")
        self.assertEqual(panpro_template.default_days, 3)
        self.assertEqual(panpro_template.default_instructions, "Before Food")

        # 2. Auto quantity math: OD (1/day) * 3 days * 1 Tab = 3
        freq_multiplier = 1 if "OD" in panpro_template.default_frequency else 3
        calculated_qty = 1 * freq_multiplier * panpro_template.default_days
        self.assertEqual(calculated_qty, 3)

        # 3. Test inline "Save to Master"
        custom_drug_create = MedicineMasterCreate(
            brand_name="CustomCef 500mg Tab",
            drug_name="Cefuroxime Axetil",
            category="Tablet",
            default_dosage="1 Tab",
            default_frequency="BD (1-0-1)",
            default_days=5,
            default_instructions="After heavy food",
        )
        created = asyncio.run(
            create_or_update_medicine_master(data=custom_drug_create, db=self.db, current_user=self.doctor)
        )
        self.assertEqual(created.brand_name, "CustomCef 500mg Tab")

        # Verify saved in master
        persisted = self.db.query(MedicineMaster).filter_by(brand_name="CustomCef 500mg Tab").first()
        self.assertIsNotNone(persisted)
        self.assertEqual(persisted.default_frequency, "BD (1-0-1)")
        self.assertEqual(persisted.default_days, 5)

    # -------------------------------------------------------------------------
    # 3. Inventory CRUD Test (Create -> Receive +50 -> Adjust -5 -> Assert 45)
    # -------------------------------------------------------------------------
    def test_03_inventory_crud_lifecycle(self):
        """Test complete inventory CRUD: Create, Receive Stock (+50), Adjust (-5 for breakage), Assert final 45."""
        # 1. Create a new drug in inventory with 0 stock
        create_payload = PharmacyItemCreate(
            brand_name="Amoxyclav 625mg Duo",
            drug_name="Amoxicillin + Clavulanic Acid",
            category="Tablet",
            batch_number="BAT-AMX-001",
            expiry_date=date.today() + timedelta(days=365),
            stock_quantity=0,
            reorder_level=15,
            unit_price=22.50,
        )
        created_item = asyncio.run(
            create_pharmacy_item(payload=create_payload, db=self.db, current_user=self.pharmacist)
        )
        self.assertEqual(created_item.stock_quantity, 0)
        item_id = created_item.id

        # 2. Receive +50 stock (GRN)
        receive_payload = StockReceiveRequest(
            quantity_to_add=50,
            batch_number="BAT-AMX-002",
            reference_no="PO-2026-9901",
            notes="Initial hospital shipment received",
        )
        received_item = asyncio.run(
            receive_pharmacy_stock(item_id=item_id, payload=receive_payload, db=self.db, current_user=self.pharmacist)
        )
        self.assertEqual(received_item.stock_quantity, 50)

        # Verify Stock Log for receipt
        rcv_log = self.db.query(PharmacyStockLog).filter_by(item_id=item_id, change_type="RECEIVE_STOCK").first()
        self.assertIsNotNone(rcv_log)
        self.assertEqual(rcv_log.quantity_change, 50)
        self.assertEqual(rcv_log.new_stock_level, 50)

        # 3. Perform Stock Adjustment (-5 for breakage)
        adjust_payload = StockAdjustmentRequest(
            adjustment_type="deduct",
            quantity=5,
            reason="Breakage/Damage",
            notes="Vial strip damaged during shelf unpacking",
        )
        adjusted_item = asyncio.run(
            adjust_pharmacy_stock(item_id=item_id, payload=adjust_payload, db=self.db, current_user=self.pharmacist)
        )
        # 4. Assert the final stock is exactly 45
        self.assertEqual(adjusted_item.stock_quantity, 45)

        # Verify Stock Log for adjustment
        adj_log = self.db.query(PharmacyStockLog).filter_by(item_id=item_id, change_type="ADJUSTMENT").first()
        self.assertIsNotNone(adj_log)
        self.assertEqual(adj_log.quantity_change, -5)
        self.assertEqual(adj_log.previous_stock, 50)
        self.assertEqual(adj_log.new_stock_level, 45)

        # 5. Edit Details (Price update)
        update_payload = PharmacyItemUpdate(unit_price=24.00, reorder_level=20)
        updated_item = asyncio.run(
            update_pharmacy_item(item_id=item_id, payload=update_payload, db=self.db, current_user=self.pharmacist)
        )
        self.assertEqual(updated_item.unit_price, 24.00)
        self.assertEqual(updated_item.reorder_level, 20)

    # -------------------------------------------------------------------------
    # 4. End-to-End Prescription & Dispensing Flow
    # -------------------------------------------------------------------------
    def test_04_end_to_end_prescribe_and_dispense(self):
        """Doctor prescribes auto-filled Panpro -> Pharmacist dispenses -> Inventory stock decreases accurately."""
        # 1. Ensure Panpro 40mg is in Pharmacy Inventory with initial 30 stock
        panpro_inv = self.db.query(PharmacyItem).filter(PharmacyItem.brand_name.ilike("%Panpro%")).first()
        if not panpro_inv:
            panpro_inv = PharmacyItem(
                brand_name="Panpro 40mg Tab",
                drug_name="Pantoprazole",
                category="Tablet",
                batch_number="BAT-PAN-091",
                expiry_date=date.today() + timedelta(days=200),
                stock_quantity=30,
                reorder_level=10,
                unit_price=12.50,
            )
            self.db.add(panpro_inv)
            self.db.commit()
            self.db.refresh(panpro_inv)
        else:
            panpro_inv.stock_quantity = 30
            self.db.commit()

        initial_stock = panpro_inv.stock_quantity
        self.assertEqual(initial_stock, 30)

        # 2. Register Patient & Visit
        patient = Patient(
            patient_id="PAT-E2E-001",
            name="Ramesh Kumar",
            age=42,
            gender="Male",
            phone="9876543210",
        )
        self.db.add(patient)
        self.db.commit()

        visit = Visit(
            visit_number="T-E2E-101",
            patient_id=patient.id,
            doctor_id=self.doctor.id,
            status=VisitStatus.COMPLETED.value,
        )
        self.db.add(visit)
        self.db.commit()

        # 3. Doctor prescribes auto-filled Panpro (Quantity: 3)
        prescription = Prescription(
            visit_id=visit.id,
            doctor_id=self.doctor.id,
        )
        self.db.add(prescription)
        self.db.commit()

        drug_item = PrescriptionDrug(
            prescription_id=prescription.id,
            brand_name="Panpro 40mg Tab.",
            drug_name="Pantoprazole",
            dosage="1 Tab",
            frequency="OD (1-0-0)",
            number_of_days=3,
            instructions="Before Food",
            quantity=3,
        )
        self.db.add(drug_item)
        self.db.commit()

        # 4. Pharmacist reviews prescription via API
        rx_details = asyncio.run(
            get_prescription_for_dispensing(visit_id=visit.id, db=self.db, current_user=self.pharmacist)
        )
        self.assertEqual(len(rx_details.medicines), 1)
        self.assertEqual(rx_details.medicines[0].quantity, 3)
        self.assertTrue(rx_details.can_dispense)
        self.assertEqual(rx_details.total_estimated_amount, 3 * panpro_inv.unit_price)

        # 5. Pharmacist dispenses medications
        dispense_req = DispenseRequest(payment_mode="UPI")
        dispense_res = asyncio.run(
            dispense_prescription_and_bill(
                visit_id=visit.id,
                payload=dispense_req,
                db=self.db,
                current_user=self.pharmacist,
            )
        )
        self.assertTrue(dispense_res.success)
        self.assertEqual(dispense_res.total_items_dispensed, 1)

        # 6. Assert Visit Status transitions to DISPENSED
        self.db.refresh(visit)
        self.assertEqual(visit.status, VisitStatus.DISPENSED.value)

        # 7. Assert Inventory Stock decreased accurately (30 - 3 = 27)
        self.db.refresh(panpro_inv)
        self.assertEqual(panpro_inv.stock_quantity, 27)

        # 8. Assert Dispense Log is recorded
        dispense_log = self.db.query(PharmacyDispenseLog).filter_by(visit_id=visit.id).first()
        self.assertIsNotNone(dispense_log)
        self.assertEqual(dispense_log.payment_mode, "UPI")
        self.assertEqual(dispense_log.total_amount, 3 * panpro_inv.unit_price)


if __name__ == "__main__":
    unittest.main()
