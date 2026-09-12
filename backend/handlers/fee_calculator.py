"""
Stage 4 in AWS Step Functions: Fee and Penalty Calculator Tool.
Performs deterministic compound interest and late fee arithmetic without LLM hallucinations.
Can be invoked as:
1. Stage 4 in AWS Step Functions pipeline
2. Standalone API Gateway endpoint (POST /tools/calculate-fee)
3. Amazon Bedrock Agent Action Group tool
"""
from typing import Any, Dict, List, Optional
import json
import math

def calculate_penalty_projection(
    principal: float,
    annual_rate_percent: float = 0.0,
    flat_penalty_per_month: float = 0.0,
    compounding_frequency: str = "monthly",
    durations_months: Optional[List[int]] = None
) -> Dict[str, Any]:
    if durations_months is None:
        durations_months = [1, 3, 6, 12]

    principal = max(0.0, float(principal))
    annual_rate = max(0.0, float(annual_rate_percent)) / 100.0
    flat_fee = max(0.0, float(flat_penalty_per_month))

    comp_freq_lower = compounding_frequency.lower()
    if "daily" in comp_freq_lower:
        n = 365
    elif "quarterly" in comp_freq_lower:
        n = 4
    elif "annual" in comp_freq_lower or "yearly" in comp_freq_lower:
        n = 1
    else:
        n = 12  # monthly default

    projections = []
    for m in durations_months:
        t_years = m / 12.0
        if annual_rate > 0:
            compounded_amount = principal * math.pow(1.0 + (annual_rate / n), n * t_years)
            interest_accrued = compounded_amount - principal
        else:
            compounded_amount = principal
            interest_accrued = 0.0

        accumulated_flat_fees = flat_fee * m
        total_liability = compounded_amount + accumulated_flat_fees
        total_penalty = interest_accrued + accumulated_flat_fees

        projections.append({
            "months": m,
            "days": m * 30,
            "principal": round(principal, 2),
            "interestAccrued": round(interest_accrued, 2),
            "flatFees": round(accumulated_flat_fees, 2),
            "totalPenalty": round(total_penalty, 2),
            "totalLiability": round(total_liability, 2),
            "percentageIncrease": round((total_penalty / principal * 100.0), 1) if principal > 0 else 0.0
        })

    summary_6m = next((p for p in projections if p["months"] == 6), projections[-1])
    narrative = (
        f"For a base liability of ₹{principal:,.2f} at {annual_rate_percent}% p.a. interest "
        f"and ₹{flat_fee:,.2f}/month late penalty, if left unpaid for {summary_6m['months']} months, "
        f"you will incur ₹{summary_6m['totalPenalty']:,.2f} in penalties, bringing total liability to ₹{summary_6m['totalLiability']:,.2f} "
        f"(+{summary_6m['percentageIncrease']}% increase)."
    )

    return {
        "status": "success",
        "principal": principal,
        "annualRatePercent": annual_rate_percent,
        "flatPenaltyPerMonth": flat_fee,
        "compoundingFrequency": compounding_frequency,
        "projections": projections,
        "narrative": narrative
    }

def lambda_handler(event: Dict[str, Any], context: Any = None) -> Dict[str, Any]:
    print("Stage 4 - Fee Calculator executing with event keys:", list(event.keys()))

    # Case 1: Step Functions Stage 4 execution
    if "docId" in event and "financialParameters" in event:
        fin = event.get("financialParameters", {})
        principal = float(fin.get("principal", 10000.0))
        rate = float(fin.get("annualRatePercent", 18.0))
        flat = float(fin.get("flatPenaltyPerMonth", 250.0))
        freq = str(fin.get("compoundingFrequency", "monthly"))

        event["projections"] = calculate_penalty_projection(
            principal=principal,
            annual_rate_percent=rate,
            flat_penalty_per_month=flat,
            compounding_frequency=freq
        )
        return event

    # Case 2: Bedrock Agent Action Group invocation
    is_bedrock_agent = "actionGroup" in event and "apiPath" in event
    params = {}
    if is_bedrock_agent:
        request_body = event.get("requestBody", {}).get("content", {}).get("application/json", {}).get("properties", [])
        if isinstance(request_body, list):
            for prop in request_body:
                params[prop.get("name")] = prop.get("value")
        elif isinstance(request_body, dict):
            params = request_body

        for p in event.get("parameters", []):
            params[p.get("name")] = p.get("value")
    else:
        if "body" in event:
            b = event["body"]
            params = json.loads(b) if isinstance(b, str) else b
        else:
            params = event

    principal = float(params.get("principal", params.get("amount", 10000.0)))
    rate = float(params.get("annualRatePercent", params.get("annual_rate", params.get("rate", 18.0))))
    flat = float(params.get("flatPenaltyPerMonth", params.get("flat_fee", params.get("late_fee", 0.0))))
    freq = str(params.get("compoundingFrequency", params.get("frequency", "monthly")))

    result = calculate_penalty_projection(
        principal=principal,
        annual_rate_percent=rate,
        flat_penalty_per_month=flat,
        compounding_frequency=freq
    )

    if is_bedrock_agent:
        return {
            "messageVersion": "1.0",
            "response": {
                "actionGroup": event.get("actionGroup"),
                "apiPath": event.get("apiPath"),
                "httpMethod": event.get("httpMethod", "POST"),
                "httpStatusCode": 200,
                "responseBody": {
                    "application/json": {
                        "body": json.dumps(result)
                    }
                }
            }
        }

    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        },
        "body": json.dumps(result)
    }
