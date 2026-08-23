import unittest
import asyncio
from types import SimpleNamespace
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi import HTTPException

from app.core.database import Base
from app.models.enums import UserRole
from app.schemas.medicine import MedicineDrugCreate, MedicineBrandCreate
from app.api.v1.endpoints.master import create_medicine_drug, create_medicine_brand, list_medicine_brands


class TestMedicineMaster(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
        Base.metadata.create_all(bind=cls.engine)
        cls.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=cls.engine)

    def setUp(self):
        self.db = self.SessionLocal()
        self.user = SimpleNamespace(id=1, role=UserRole.ADMIN.value, username="admin")

    def tearDown(self):
        self.db.close()

    def test_create_brand_and_duplicate_blocked(self):
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        # 1. Create Drug
        drug_data = MedicineDrugCreate(name="TestParacetamol")
        drug_res = loop.run_until_complete(
            create_medicine_drug(data=drug_data, db=self.db, current_user=self.user)
        )
        self.assertIsNotNone(drug_res)
        self.assertEqual(drug_res.name, "TestParacetamol")

        # 2. Create Brand
        brand_data = MedicineBrandCreate(name="TestDolo", drug_id=drug_res.id, type_id=None)
        brand_res = loop.run_until_complete(
            create_medicine_brand(data=brand_data, db=self.db, current_user=self.user)
        )
        self.assertIsNotNone(brand_res)
        self.assertEqual(brand_res.name, "TestDolo")

        # 3. Try Duplicate Brand -> Should raise HTTPException 400
        with self.assertRaises(HTTPException) as ctx:
            loop.run_until_complete(
                create_medicine_brand(data=brand_data, db=self.db, current_user=self.user)
            )
        self.assertEqual(ctx.exception.status_code, 400)

        # 4. Search Brand by query
        brands_res = loop.run_until_complete(
            list_medicine_brands(search="dolo", db=self.db, current_user=self.user)
        )
        self.assertTrue(len(brands_res) >= 1)
        self.assertTrue(any(b.name == "TestDolo" for b in brands_res))

        loop.close()


if __name__ == "__main__":
    unittest.main()
