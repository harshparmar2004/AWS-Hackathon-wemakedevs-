"""
Risk Explanation and Structuring Handler for Doc-Explainer Agent.
Analyzes raw extracted document text, identifies financial/legal trap clauses,
and extracts structured risk flags: {clause, amount, why}.
Also extracts numeric parameters for the fee-calculator tool.
"""
import os
import json
import re
from typing import Any, Dict
import boto3
from botocore.exceptions import ClientError
from .fee_calculator import calculate_penalty_projection

DEFAULT_MODEL_ID = os.environ.get("BEDROCK_MODEL_ID", "anthropic.claude-3-5-sonnet-20240620-v1:0")
AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")

def get_bedrock_client():
    return boto3.client("bedrock-runtime", region_name=AWS_REGION)

def analyze_document_risks(raw_text: str) -> Dict[str, Any]:
    client = get_bedrock_client()

    system_prompt = (
        "You are an expert legal and financial document analyst. Your job is to protect normal citizens "
        "from confusing jargon, hidden fees, penalty clauses, and aggressive terms in contracts and bills. "
        "You must respond ONLY with a valid JSON object matching this exact schema:\n"
        "{\n"
        '  "docType": "Rental Agreement | Electricity Bill | Loan Sanction | Insurance Policy | Invoice | Other",\n'
        '  "summary": "Clear, jargon-free 2-3 paragraph explanation of what this document is and what it requires from the user.",\n'
        '  "keyDates": ["Due Date: 15th October 2026", "Notice Period: 2 months"],\n'
        '  "riskFlags": [\n'
        "    {\n"
        '      "clause": "Exact clause or section number from the text",\n'
        '      "amount": "Exact fee, penalty percentage, or deadline",\n'
        '      "why": "One-line plain-language explanation of why this matters and how it could cost the user money"\n'
        "    }\n"
        "  ],\n"
        '  "financialParameters": {\n'
        '    "principal": 15000.0,\n'
        '    "annualRatePercent": 18.0,\n'
        '    "flatPenaltyPerMonth": 500.0,\n'
        '    "compoundingFrequency": "monthly"\n'
        "  }\n"
        "}\n"
        "Guidelines:\n"
        "- If a penalty or interest rate is mentioned (e.g. 2% per month = 24% per year, or 18% p.a., or ₹500 late fee), extract the base amount/rent/bill as 'principal' and the rates into 'financialParameters'.\n"
        "- If no specific penalty exists, estimate standard baseline or leave rate 0.\n"
        "- Return strictly JSON with no markdown wrapping or preamble."
    )

    try:
        response = client.converse(
            modelId=DEFAULT_MODEL_ID,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"text": f"Analyze this extracted document text:\n\n{raw_text}"}
                    ]
                }
            ],
            system=[{"text": system_prompt}],
            inferenceConfig={
                "maxTokens": 4096,
                "temperature": 0.0
            }
        )

        response_text = response["output"]["message"]["content"][0]["text"].strip()
        # Clean potential markdown code blocks
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        elif response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]

        parsed = json.loads(response_text.strip())

        # Invoke fee calculator tool with the extracted parameters
        fin_params = parsed.get("financialParameters", {})
        principal = float(fin_params.get("principal", 10000.0))
        annual_rate = float(fin_params.get("annualRatePercent", 18.0))
        flat_fee = float(fin_params.get("flatPenaltyPerMonth", 250.0))
        freq = str(fin_params.get("compoundingFrequency", "monthly"))

        projections = calculate_penalty_projection(
            principal=principal,
            annual_rate_percent=annual_rate,
            flat_penalty_per_month=flat_fee,
            compounding_frequency=freq
        )
        parsed["projections"] = projections

        return {
            "status": "success",
            "data": parsed
        }
    except Exception as e:
        print(f"Error in risk explanation: {e}")
        return {
            "status": "error",
            "error": str(e)
        }

def lambda_handler(event: Dict[str, Any], context: Any = None) -> Dict[str, Any]:
    raw_text = event.get("rawExtraction", "")
    if not raw_text:
        return {
            "statusCode": 400,
            "body": json.dumps({"error": "Missing rawExtraction in input"})
        }

    result = analyze_document_risks(raw_text)
    return {
        "statusCode": 200 if result.get("status") == "success" else 500,
        "body": json.dumps(result)
    }
