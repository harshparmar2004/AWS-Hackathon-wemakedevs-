"""
Pipeline Orchestrator Handler for AWS Step Functions and End-to-End Processing.
Orchestrates:
1. Extract (Bedrock Claude Multimodal Vision)
2. Classify & Analyze Risk Flags (Structured JSON + Fee Calculator Tool)
3. Translate (Regional Indian Language)
4. Persist to DynamoDB & Complete
"""
import os
import json
from decimal import Decimal
from datetime import datetime, timezone
from typing import Any, Dict
import boto3

from .extract_vision import extract_document_with_vision
from .risk_explainer import analyze_document_risks
from .translator import translate_explanation
from .fee_calculator import calculate_penalty_projection

DYNAMODB_TABLE = os.environ.get("DOC_TABLE_NAME", "DocExplainerTable")
S3_BUCKET = os.environ.get("DOC_BUCKET_NAME", "doc-explainer-uploads")

s3_client = boto3.client("s3")
dynamodb = boto3.resource("dynamodb")

def float_to_decimal(obj):
    if isinstance(obj, float):
        return Decimal(str(obj))
    if isinstance(obj, dict):
        return {k: float_to_decimal(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [float_to_decimal(item) for item in obj]
    return obj

def process_document_pipeline(event: Dict[str, Any]) -> Dict[str, Any]:
    doc_id = event.get("docId")
    s3_bucket = event.get("s3Bucket", S3_BUCKET)
    s3_key = event.get("s3Key")
    media_type = event.get("mediaType", "image/png")
    target_language = event.get("language", "english")

    print(f"Starting pipeline processing for docId: {doc_id}")
    table = dynamodb.Table(DYNAMODB_TABLE)

    # 1. Fetch file bytes from S3
    s3_obj = s3_client.get_object(Bucket=s3_bucket, Key=s3_key)
    file_bytes = s3_obj["Body"].read()

    # 2. Stage 1: Multimodal Vision Extraction
    extraction_res = extract_document_with_vision(file_bytes, media_type)
    if extraction_res.get("status") != "success":
        error_msg = extraction_res.get("error", "Vision extraction failed")
        table.update_item(
            Key={"docId": doc_id},
            UpdateExpression="SET #s = :s, errorMessage = :e, updatedAt = :u",
            ExpressionAttributeNames={"#s": "status"},
            ExpressionAttributeValues={
                ":s": "failed",
                ":e": error_msg,
                ":u": datetime.now(timezone.utc).isoformat()
            }
        )
        return {"status": "failed", "error": error_msg}

    raw_text = extraction_res["rawExtraction"]

    # 3. Stage 2: Risk Flag Extraction & Fee Calculator Projection
    risk_res = analyze_document_risks(raw_text)
    if risk_res.get("status") != "success":
        error_msg = risk_res.get("error", "Risk analysis failed")
        table.update_item(
            Key={"docId": doc_id},
            UpdateExpression="SET #s = :s, errorMessage = :e, updatedAt = :u",
            ExpressionAttributeNames={"#s": "status"},
            ExpressionAttributeValues={
                ":s": "failed",
                ":e": error_msg,
                ":u": datetime.now(timezone.utc).isoformat()
            }
        )
        return {"status": "failed", "error": error_msg}

    risk_data = risk_res["data"]
    doc_type = risk_data.get("docType", "Unknown Document")
    summary = risk_data.get("summary", "")
    risk_flags = risk_data.get("riskFlags", [])
    key_dates = risk_data.get("keyDates", [])
    projections = risk_data.get("projections", {})

    # 4. Stage 3: Regional Language Translation
    proj_narrative = projections.get("narrative", "")
    trans_res = translate_explanation(
        summary=summary,
        risk_flags=risk_flags,
        projection_narrative=proj_narrative,
        target_language=target_language
    )

    translated_summary = trans_res.get("translatedSummary", summary)
    translated_risk_flags = trans_res.get("translatedRiskFlags", risk_flags)
    translated_narrative = trans_res.get("translatedProjectionNarrative", proj_narrative)

    # 5. Stage 4: Persist all structured results to DynamoDB
    now_iso = datetime.now(timezone.utc).isoformat()
    update_data = {
        "status": "complete",
        "docType": doc_type,
        "rawExtraction": raw_text[:4000],  # Keep reasonable snippet
        "explanation": summary,
        "keyDates": key_dates,
        "riskFlags": risk_flags,
        "projections": projections,
        "language": target_language,
        "translatedExplanation": translated_summary,
        "translatedRiskFlags": translated_risk_flags,
        "translatedProjectionNarrative": translated_narrative,
        "updatedAt": now_iso
    }

    # Convert floats to Decimals for DynamoDB
    db_item = float_to_decimal(update_data)

    update_expression_parts = []
    expression_attribute_names = {}
    expression_attribute_values = {}

    for idx, (k, v) in enumerate(db_item.items()):
        attr_name = f"#k{idx}"
        attr_val = f":v{idx}"
        update_expression_parts.append(f"{attr_name} = {attr_val}")
        expression_attribute_names[attr_name] = k
        expression_attribute_values[attr_val] = v

    table.update_item(
        Key={"docId": doc_id},
        UpdateExpression="SET " + ", ".join(update_expression_parts),
        ExpressionAttributeNames=expression_attribute_names,
        ExpressionAttributeValues=expression_attribute_values
    )

    print(f"Pipeline completed successfully for docId: {doc_id}")
    return {
        "status": "complete",
        "docId": doc_id,
        "docType": doc_type
    }

def lambda_handler(event: Dict[str, Any], context: Any = None) -> Dict[str, Any]:
    """
    Dispatcher handler for Step Functions stages or direct async invocation.
    """
    step = event.get("step")

    if step == "extract":
        from .extract_vision import lambda_handler as extract_handler
        return extract_handler(event, context)
    elif step == "risk_explain":
        from .risk_explainer import lambda_handler as risk_handler
        return risk_handler(event, context)
    elif step == "translate":
        from .translator import lambda_handler as trans_handler
        return trans_handler(event, context)
    elif step == "calculate_fee":
        from .fee_calculator import lambda_handler as calc_handler
        return calc_handler(event, context)
    else:
        # Run unified end-to-end pipeline
        return process_document_pipeline(event)
