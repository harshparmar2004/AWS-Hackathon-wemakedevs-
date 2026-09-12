"""
Stage 3 in AWS Step Functions: Structure Risk-Flags & Extract Financial Parameters.
Extracts concrete clauses, amounts/dates, and reasons why it matters (PRD Section 8).
Also extracts numeric financial parameters to feed the Stage 4 Fee Calculator tool.
"""
import os
import json
from typing import Any, Dict
import boto3

DEFAULT_MODEL_ID = os.environ.get("BEDROCK_MODEL_ID", "anthropic.claude-3-5-sonnet-20240620-v1:0")
AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")

def get_bedrock_client():
    return boto3.client("bedrock-runtime", region_name=AWS_REGION)

def extract_risk_flags(raw_text: str) -> Dict[str, Any]:
    client = get_bedrock_client()

    system_prompt = (
        "You are an expert legal risk auditor. Scan the document for traps, penalties, forfeitures, "
        "interest rates, non-refundable charges, and aggressive terms. "
        "You must respond ONLY in valid JSON matching this exact schema:\n"
        "{\n"
        '  "riskFlags": [\n'
        "    {\n"
        '      "clause": "Exact clause name/number from document (e.g. Clause 7.2 — Compounded Overdue Surcharge)",\n'
        '      "amount": "Exact amount, fee, or rate involved (e.g. 24% p.a. / ₹500 per month / 2 months rent)",\n'
        '      "why": "One-line plain-language reason it matters and how it costs the user money"\n'
        "    }\n"
        "  ],\n"
        '  "financialParameters": {\n'
        '    "principal": 35000.0,\n'
        '    "annualRatePercent": 24.0,\n'
        '    "flatPenaltyPerMonth": 500.0,\n'
        '    "compoundingFrequency": "monthly"\n'
        "  }\n"
        "}\n"
        "Instructions:\n"
        "- If late penalties or interest rates exist, set 'principal' to base rent/bill/loan amount, "
        "'annualRatePercent' to the annual interest rate (e.g. 2% monthly = 24%), and 'flatPenaltyPerMonth' to any flat charge.\n"
        "- If no late penalty rate exists, estimate base liability and rate 0.\n"
        "- Return strictly JSON, no markdown wrapper."
    )

    response = client.converse(
        modelId=DEFAULT_MODEL_ID,
        messages=[
            {
                "role": "user",
                "content": [{"text": f"Document text:\n\n{raw_text[:12000]}"}]
            }
        ],
        system=[{"text": system_prompt}],
        inferenceConfig={
            "maxTokens": 4096,
            "temperature": 0.0
        }
    )

    response_text = response["output"]["message"]["content"][0]["text"].strip()
    if response_text.startswith("```json"):
        response_text = response_text[7:]
    elif response_text.startswith("```"):
        response_text = response_text[3:]
    if response_text.endswith("```"):
        response_text = response_text[:-3]

    return json.loads(response_text.strip())

def lambda_handler(event: Dict[str, Any], context: Any = None) -> Dict[str, Any]:
    """
    Step Functions Stage 3 Handler.
    """
    print("Stage 3 - Structure Risk Flags executing for docId:", event.get("docId"))
    raw_text = event.get("rawExtraction", "")
    if not raw_text:
        raise ValueError("Missing rawExtraction in Step Functions state")

    result = extract_risk_flags(raw_text)

    # Enrich state
    event["riskFlags"] = result.get("riskFlags", [])
    event["financialParameters"] = result.get("financialParameters", {
        "principal": 10000.0,
        "annualRatePercent": 18.0,
        "flatPenaltyPerMonth": 250.0,
        "compoundingFrequency": "monthly"
    })

    return event
