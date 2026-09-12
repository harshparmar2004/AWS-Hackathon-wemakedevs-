"""
Stage 2 in AWS Step Functions: Classify & Plain-Language Summary Handler.
Analyzes raw extracted text to classify document type and generate a jargon-free,
conversational plain-language summary plus critical dates/deadlines.
"""
import os
import json
from typing import Any, Dict
import boto3

DEFAULT_MODEL_ID = os.environ.get("BEDROCK_MODEL_ID", "anthropic.claude-3-5-sonnet-20240620-v1:0")
AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")

def get_bedrock_client():
    return boto3.client("bedrock-runtime", region_name=AWS_REGION)

def classify_and_explain(raw_text: str) -> Dict[str, Any]:
    client = get_bedrock_client()

    system_prompt = (
        "You are an expert document summarizer dedicated to protecting normal citizens. "
        "Analyze the provided document text and produce:\n"
        "1. Concrete Document Type (e.g. Residential Tenancy Contract, Commercial Electricity Invoice, Personal Loan Sanction Letter, Insurance Policy)\n"
        "2. Plain-language, conversational summary (2-3 paragraphs) explaining exactly what this document is, who the parties are, what the main financial obligations are, and what the user must know. Use zero legal jargon.\n"
        "3. Critical dates and deadlines (due dates, lock-in periods, notice periods, refund timelines).\n\n"
        "Respond ONLY in valid JSON matching this schema:\n"
        "{\n"
        '  "docType": "Residential Tenancy Contract",\n'
        '  "summary": "Plain language explanation...",\n'
        '  "keyDates": ["Payment Due Date: 7th of each month", "Lock-in Period: 6 months"]\n'
        "}\n"
        "Do not wrap in markdown or add preamble."
    )

    response = client.converse(
        modelId=DEFAULT_MODEL_ID,
        messages=[
            {
                "role": "user",
                "content": [{"text": f"Document text:\n\n{raw_text[:100000]}"}]
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
    Step Functions Stage 2 Handler.
    """
    print("Stage 2 - Classify & Explain executing for docId:", event.get("docId"))
    raw_text = event.get("rawExtraction", "")
    if not raw_text:
        raise ValueError("Missing rawExtraction in Step Functions state")

    result = classify_and_explain(raw_text)

    # Enrich state
    event["docType"] = result.get("docType", "Legal/Financial Document")
    event["explanation"] = result.get("summary", "")
    event["keyDates"] = result.get("keyDates", [])

    return event
