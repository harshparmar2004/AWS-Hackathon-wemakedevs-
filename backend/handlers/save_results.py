"""
Stage 6 in AWS Step Functions: Save Final Results to DynamoDB Handler.
Receives all enriched results from Stages 1-5, converts floats to DynamoDB Decimals,
updates the document record to status: 'complete', and marks completion timestamp.
"""
import os
import json
from decimal import Decimal
from datetime import datetime, timezone
from typing import Any, Dict
import boto3

DYNAMODB_TABLE = os.environ.get("DOC_TABLE_NAME", "DocExplainerTable")
dynamodb = boto3.resource("dynamodb")

def float_to_decimal(obj):
    if isinstance(obj, float):
        return Decimal(str(obj))
    if isinstance(obj, dict):
        return {k: float_to_decimal(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [float_to_decimal(item) for item in obj]
    return obj

def lambda_handler(event: Dict[str, Any], context: Any = None) -> Dict[str, Any]:
    doc_id = event.get("docId")
    print("Stage 6 - Save Results executing for docId:", doc_id)

    if not doc_id:
        raise ValueError("Missing docId in Step Functions state")

    table = dynamodb.Table(DYNAMODB_TABLE)
    now_iso = datetime.now(timezone.utc).isoformat()

    update_payload = {
        "status": "complete",
        "docType": event.get("docType", "Legal Document"),
        "rawExtraction": event.get("rawExtraction", "")[:4000],
        "explanation": event.get("explanation", ""),
        "keyDates": event.get("keyDates", []),
        "riskFlags": event.get("riskFlags", []),
        "projections": event.get("projections", {}),
        "language": event.get("language", "english"),
        "translatedExplanation": event.get("translatedExplanation", ""),
        "translatedRiskFlags": event.get("translatedRiskFlags", []),
        "translatedProjectionNarrative": event.get("translatedProjectionNarrative", ""),
        "updatedAt": now_iso
    }

    db_item = float_to_decimal(update_payload)

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

    print(f"Successfully saved complete results for docId: {doc_id}")
    return {
        "status": "complete",
        "docId": doc_id,
        "docType": event.get("docType", "")
    }
