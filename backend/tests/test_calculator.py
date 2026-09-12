import sys
import os
import json
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from handlers.fee_calculator import calculate_penalty_projection, lambda_handler

class TestFeeCalculator(unittest.TestCase):
    def test_flat_fee_only(self):
        res = calculate_penalty_projection(principal=1000.0, annual_rate_percent=0.0, flat_penalty_per_month=100.0, durations_months=[1, 3, 6])
        self.assertEqual(res["status"], "success")
        projections = res["projections"]
        self.assertEqual(len(projections), 3)
        self.assertEqual(projections[0]["flatFees"], 100.0)
        self.assertEqual(projections[0]["totalLiability"], 1100.0)
        self.assertEqual(projections[2]["flatFees"], 600.0)
        self.assertEqual(projections[2]["totalLiability"], 1600.0)

    def test_compound_interest_monthly(self):
        # 24% per year, compounded monthly (2% per month)
        # Principal = 10,000
        # Month 1: 10000 * 1.02 = 10,200 (interest = 200)
        res = calculate_penalty_projection(principal=10000.0, annual_rate_percent=24.0, compounding_frequency="monthly", durations_months=[1, 12])
        p1 = res["projections"][0]
        self.assertEqual(p1["interestAccrued"], 200.0)
        self.assertEqual(p1["totalLiability"], 10200.0)

        # Month 12: 10000 * (1.02)^12 = 12682.42
        p12 = res["projections"][1]
        self.assertAlmostEqual(p12["totalLiability"], 12682.42, delta=0.2)

    def test_lambda_handler_direct(self):
        event = {
            "principal": 5000,
            "annualRatePercent": 12,
            "flatPenaltyPerMonth": 50
        }
        response = lambda_handler(event)
        self.assertEqual(response["statusCode"], 200)
        data = json.loads(response["body"])
        self.assertEqual(data["principal"], 5000.0)
        self.assertEqual(len(data["projections"]), 4)

    def test_bedrock_agent_format(self):
        event = {
            "actionGroup": "FeeCalculatorActionGroup",
            "apiPath": "/calculate-fee",
            "httpMethod": "POST",
            "parameters": [
                {"name": "principal", "value": "20000"},
                {"name": "annualRatePercent", "value": "18"},
                {"name": "flatPenaltyPerMonth", "value": "200"}
            ]
        }
        response = lambda_handler(event)
        self.assertEqual(response["messageVersion"], "1.0")
        self.assertEqual(response["response"]["actionGroup"], "FeeCalculatorActionGroup")
        self.assertEqual(response["response"]["httpStatusCode"], 200)
        body = json.loads(response["response"]["responseBody"]["application/json"]["body"])
        self.assertEqual(body["principal"], 20000.0)
        self.assertIn("narrative", body)

if __name__ == "__main__":
    unittest.main()
