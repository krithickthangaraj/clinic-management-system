from types import SimpleNamespace
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.core.database import Base, get_db
from app.models.enums import UserRole

# Create an in-memory SQLite database for tests
TEST_SQLITE_URL = "sqlite:///:memory:"
engine = create_engine(TEST_SQLITE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope='module')
def test_client():
    # Create tables
    Base.metadata.create_all(bind=engine)

    # Override get_db dependency
    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db

    # Override current user to be admin
    def override_current_user():
        return SimpleNamespace(id=1, role=UserRole.ADMIN)

    from app.core.dependencies import get_current_user

    app.dependency_overrides[get_current_user] = override_current_user

    client = TestClient(app)
    yield client

    app.dependency_overrides = {}


def test_create_brand_and_duplicate_blocked(test_client):
    client = test_client

    # Create drug first
    r = client.post('/api/v1/master/meds/drugs', json={'name': 'TestDrug'})
    assert r.status_code == 201
    drug = r.json()
    assert drug['name'] == 'TestDrug'

    # Create brand
    r = client.post('/api/v1/master/meds/brands', json={'drug_id': drug['id'], 'type_id': None, 'name': 'BrandA'})
    assert r.status_code == 201
    brand = r.json()
    assert brand['name'] == 'BrandA'

    # Attempt duplicate brand (same drug/name)
    r = client.post('/api/v1/master/meds/brands', json={'drug_id': drug['id'], 'type_id': None, 'name': 'brandA'})
    assert r.status_code == 400
    assert 'exists' in r.json()['detail'].lower()


def test_create_dosage_and_duplicate_blocked(test_client):
    client = test_client

    # Create drug and brand
    r = client.post('/api/v1/master/meds/drugs', json={'name': 'ForDoseDrug'})
    assert r.status_code == 201
    drug = r.json()

    r = client.post('/api/v1/master/meds/brands', json={'drug_id': drug['id'], 'type_id': None, 'name': 'DoseBrand'})
    assert r.status_code == 201
    brand = r.json()

    # Create dosage
    r = client.post('/api/v1/master/meds/dosages', json={'brand_id': brand['id'], 'label': '500 mg', 'default_instruction': 'After food'})
    assert r.status_code == 201
    dose = r.json()
    assert dose['label'] == '500 mg'

    # Duplicate dosage (case-insensitive)
    r = client.post('/api/v1/master/meds/dosages', json={'brand_id': brand['id'], 'label': '500 MG', 'default_instruction': ''})
    assert r.status_code == 400
    assert 'exists' in r.json()['detail'].lower()
