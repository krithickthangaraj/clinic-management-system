import unittest
import asyncio
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi import HTTPException

from app.core.database import Base
from app.models.user import User
from app.models.enums import UserRole
from app.models.medicine import MedicineMaster
from app.schemas.medicine import MedicineMasterCreate, MedicineMasterUpdate
from app.api.v1.endpoints.master import (
    list_medicine_master,
    create_or_update_medicine_master,
    get_medicine_master_item,
    update_medicine_master_item,
    delete_medicine_master_item,
)


class TestMedicineMasterCRUD(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
        Base.metadata.create_all(bind=cls.engine)
        cls.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=cls.engine)

    def setUp(self):
        self.db = self.SessionLocal()

        # Seed Admin User
        self.admin = self.db.query(User).filter_by(username="admin_user").first()
        if not self.admin:
            self.admin = User(
                username="admin_user",
                hashed_password="pw",
                full_name="Hospital Administrator",
                role=UserRole.ADMIN.value,
            )
            self.db.add(self.admin)
            self.db.commit()

        # Seed Doctor User
        self.doctor = self.db.query(User).filter_by(username="doc_user").first()
        if not self.doctor:
            self.doctor = User(
                username="doc_user",
                hashed_password="pw",
                full_name="Dr. T.S.Jeyagowthaman",
                role=UserRole.DOCTOR.value,
            )
            self.db.add(self.doctor)
            self.db.commit()

    def tearDown(self):
        self.db.close()

    # -------------------------------------------------------------------------
    # 1. CREATE Test
    # -------------------------------------------------------------------------
    def test_01_admin_create_master_drug(self):
        """Admin creates a new master drug ('TestDrug 100mg Tab') with prescribing defaults."""
        payload = MedicineMasterCreate(
            brand_name="TestDrug 100mg Tab",
            drug_name="TestDrug Molecule",
            category="Tablet",
            default_dosage="1 Tab",
            default_frequency="BD (1-0-1)",
            default_days=3,
            default_instructions="After breakfast and dinner",
        )

        created = asyncio.run(
            create_or_update_medicine_master(data=payload, db=self.db, current_user=self.admin)
        )

        self.assertIsNotNone(created.id)
        self.assertEqual(created.brand_name, "TestDrug 100mg Tab")
        self.assertEqual(created.drug_name, "TestDrug Molecule")
        self.assertEqual(created.default_frequency, "BD (1-0-1)")
        self.assertEqual(created.default_days, 3)
        self.assertTrue(created.is_active)

        # Assert saved in DB
        db_item = self.db.query(MedicineMaster).filter_by(id=created.id).first()
        self.assertIsNotNone(db_item)
        self.assertEqual(db_item.brand_name, "TestDrug 100mg Tab")

    # -------------------------------------------------------------------------
    # 2. READ Test
    # -------------------------------------------------------------------------
    def test_02_read_master_drug_in_list(self):
        """Assert the new drug appears in the GET list and search query."""
        results = asyncio.run(
            list_medicine_master(search="TestDrug", db=self.db, current_user=self.doctor)
        )

        self.assertGreaterEqual(len(results), 1)
        found = next((m for m in results if m.brand_name == "TestDrug 100mg Tab"), None)
        self.assertIsNotNone(found, "Newly created drug must appear in active GET list")
        self.assertEqual(found.drug_name, "TestDrug Molecule")
        self.assertEqual(found.default_dosage, "1 Tab")

    # -------------------------------------------------------------------------
    # 3. UPDATE Test
    # -------------------------------------------------------------------------
    def test_03_admin_update_master_drug_defaults(self):
        """Admin edits Default Days from 3 to 5 and changes frequency to TDS."""
        item = self.db.query(MedicineMaster).filter_by(brand_name="TestDrug 100mg Tab").first()
        self.assertIsNotNone(item)

        update_payload = MedicineMasterUpdate(
            default_days=5,
            default_frequency="TDS (1-1-1)",
            default_instructions="After food with water",
        )

        updated = asyncio.run(
            update_medicine_master_item(item_id=item.id, data=update_payload, db=self.db, current_user=self.admin)
        )

        self.assertEqual(updated.default_days, 5)
        self.assertEqual(updated.default_frequency, "TDS (1-1-1)")
        self.assertEqual(updated.default_instructions, "After food with water")

        # Assert updated in DB
        self.db.refresh(item)
        self.assertEqual(item.default_days, 5)
        self.assertEqual(item.default_frequency, "TDS (1-1-1)")

    # -------------------------------------------------------------------------
    # 4. DEACTIVATE (Soft Delete) Test
    # -------------------------------------------------------------------------
    def test_04_admin_deactivate_master_drug_soft_delete(self):
        """Admin deactivates the drug. Assert is_active becomes False and does not appear in active GET."""
        item = self.db.query(MedicineMaster).filter_by(brand_name="TestDrug 100mg Tab").first()
        self.assertIsNotNone(item)

        # Call soft-delete endpoint
        asyncio.run(
            delete_medicine_master_item(item_id=item.id, db=self.db, current_user=self.admin)
        )

        # Assert is_active is False in DB (record preserved for historical RX integrity)
        self.db.refresh(item)
        self.assertFalse(item.is_active)

        # Assert it does NOT appear in active search list
        active_list = asyncio.run(
            list_medicine_master(search="TestDrug", include_inactive=False, db=self.db, current_user=self.doctor)
        )
        self.assertEqual(len(active_list), 0, "Deactivated drug must not appear in active list")

        # Assert it does appear when include_inactive=True
        all_list = asyncio.run(
            list_medicine_master(search="TestDrug", include_inactive=True, db=self.db, current_user=self.admin)
        )
        self.assertEqual(len(all_list), 1, "Deactivated drug is preserved in database")


if __name__ == "__main__":
    unittest.main()
