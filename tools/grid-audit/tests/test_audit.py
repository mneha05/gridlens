import unittest
from audit.report import audit
from audit.numeric import numeric_values


class AuditTests(unittest.TestCase):
    def test_invalid_and_range(self):
        result = audit(["load"], [{"load": "1"}, {"load": "oops"}, {"load": "11"}], "load", 0, 10)
        self.assertEqual(result["invalid_rows"], [3])
        self.assertEqual(result["out_of_range"], 1)

    def test_non_finite(self):
        self.assertEqual(numeric_values([{"load": "nan"}], "load")[1], [2])

    def test_missing_column(self):
        self.assertTrue(audit(["a"], [{"a": "1"}], "load")["errors"])


if __name__ == "__main__":
    unittest.main()
