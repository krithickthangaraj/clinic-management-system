import unittest
from datetime import datetime, timedelta, date, time
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base
from app.models.enums import UserRole, VisitStatus
from app.models.patient import Patient
from app.models.visit import Visit
from app.models.vitals import Vitals
from app.api.v1.endpoints.doctor import calculate_waiting_time, format_age_sex, determine_category


class TestDoctorDashboardAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
        Base.metadata.create_all(bind=cls.engine)
        cls.Session = sessionmaker(autocommit=False, autoflush=False, bind=cls.engine)

    def setUp(self):
        self.db = self.Session()

    def tearDown(self):
        self.db.close()

    def test_waiting_time_calculation_under_15_mins(self):
        # 10 minutes ago
        ten_mins_ago = datetime.now() - timedelta(minutes=10)
        time_str, minutes = calculate_waiting_time(ten_mins_ago)
        self.assertEqual(minutes, 10)
        self.assertIn("10 min", time_str)

    def test_waiting_time_calculation_over_15_mins_and_over_30_mins(self):
        # 22 minutes ago (amber threshold)
        twenty_two_mins_ago = datetime.now() - timedelta(minutes=22)
        time_str, minutes = calculate_waiting_time(twenty_two_mins_ago)
        self.assertEqual(minutes, 22)
        self.assertIn("22 min", time_str)

        # 45 minutes ago (red threshold)
        forty_five_mins_ago = datetime.now() - timedelta(minutes=45)
        time_str, minutes = calculate_waiting_time(forty_five_mins_ago)
        self.assertEqual(minutes, 45)
        self.assertIn("45 min", time_str)

        # 85 minutes ago (hour format)
        eighty_five_mins_ago = datetime.now() - timedelta(minutes=85)
        time_str, minutes = calculate_waiting_time(eighty_five_mins_ago)
        self.assertEqual(minutes, 85)
        self.assertIn("1h 25m", time_str)

    def test_format_age_sex(self):
        # Test Male Years
        p1 = Patient(name="Ramesh", age=44, age_format="Years", gender="Male")
        self.assertEqual(format_age_sex(p1), "44 Yrs / M")

        # Test Female Months
        p2 = Patient(name="Ananya", age=10, age_months=10, age_format="Months", gender="Female")
        self.assertEqual(format_age_sex(p2), "10 Mos / F")

        # Test Empty
        self.assertEqual(format_age_sex(None), "—")

    def test_category_determination(self):
        v1 = Visit(visit_number="V-101", follow_up_date=datetime.now())
        self.assertEqual(determine_category(v1, None), "Follow-up")

        v2 = Visit(visit_number="V-102", chief_complaints="Severe Emergency Chest Pain")
        self.assertEqual(determine_category(v2, None), "Emergency")

        v3 = Visit(visit_number="V-103")
        self.assertEqual(determine_category(v3, None), "OPD")


if __name__ == "__main__":
    unittest.main()
