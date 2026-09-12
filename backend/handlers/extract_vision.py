"""
Stage 1 in AWS Step Functions: Extract Vision Handler.
Uses Amazon Bedrock (Anthropic Claude 3.5 Sonnet / Claude 3 Haiku) to extract
text and structure directly from raw images and PDFs in S3.
"""
import os
import json
import base64
from typing import Any, Dict
import boto3
from botocore.exceptions import ClientError

DEFAULT_MODEL_ID = os.environ.get("BEDROCK_MODEL_ID", "anthropic.claude-3-5-sonnet-20240620-v1:0")
AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")

def get_bedrock_client():
    return boto3.client("bedrock-runtime", region_name=AWS_REGION)

def extract_document_with_vision(image_bytes: bytes, media_type: str = "image/png") -> Dict[str, Any]:
    client = get_bedrock_client()

    prompt = (
        "You are an expert document analysis system. Examine this document image carefully. "
        "Extract all key information including:\n"
        "1. Document Type (e.g., Rental Agreement, Electricity/Utility Bill, Loan Agreement, Insurance Form, Invoice)\n"
        "2. Parties involved, reference/account numbers, and key dates (due date, billing period, start/end dates)\n"
        "3. Financial terms: total bill/loan amount, security deposits, monthly rent, interest rates\n"
        "4. Critical legal/financial clauses: late payment penalties, default interest rates, grace periods, auto-renewal clauses, termination fees\n"
        "5. Complete raw text transcript of the document\n\n"
        "Respond in clear, structured format."
    )

    fmt = "png"
    if "jpeg" in media_type or "jpg" in media_type:
        fmt = "jpeg"
    elif "webp" in media_type:
        fmt = "webp"

    try:
        response = client.converse(
            modelId=DEFAULT_MODEL_ID,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "image": {
                                "format": fmt,
                                "source": {
                                    "bytes": image_bytes
                                }
                            }
                        },
                        {
                            "text": prompt
                        }
                    ]
                }
            ],
            inferenceConfig={
                "maxTokens": 4096,
                "temperature": 0.0
            }
        )
        content_text = response["output"]["message"]["content"][0]["text"]
        return {
            "status": "success",
            "rawExtraction": content_text
        }
    except ClientError as e:
        print(f"Bedrock invocation error: {e}")
        return {
            "status": "error",
            "error": str(e)
        }

def lambda_handler(event: Dict[str, Any], context: Any = None) -> Dict[str, Any]:
    """
    Step Functions Stage 1 Handler.
    Receives state dict, extracts text, enriches state dict with rawExtraction, and returns state.
    """
    print("Stage 1 - Extract Vision executing for docId:", event.get("docId"))

    s3_bucket = event.get("s3Bucket")
    s3_key = event.get("s3Key")
    media_type = event.get("mediaType", "image/png")

    if s3_bucket and s3_key:
        s3 = boto3.client("s3")
        obj = s3.get_object(Bucket=s3_bucket, Key=s3_key)
        image_bytes = obj["Body"].read()
    elif "fileBase64" in event:
        image_bytes = base64.b64decode(event["fileBase64"])
    else:
        raise ValueError("Missing s3Bucket/s3Key or fileBase64 in event input")

    result = extract_document_with_vision(image_bytes, media_type)
    if result.get("status") != "success":
        raise RuntimeError(f"Vision extraction failed: {result.get('error')}")

    # Enrich state and return for next Step Functions state
    event["rawExtraction"] = result["rawExtraction"]
    return event
