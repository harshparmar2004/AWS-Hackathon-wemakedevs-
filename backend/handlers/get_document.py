"""
Get Document Handler for Doc-Explainer Agent.
Exposes GET /documents/{docId} via Amazon API Gateway.
Fetches processing status, extracted summary, structured risk flags, and translation from DynamoDB.
"""
import os
import json
from decimal import Decimal
from typing import Any, Dict
import boto3

DYNAMODB_TABLE = os.environ.get("DOC_TABLE_NAME", "DocExplainerTable")
dynamodb = boto3.resource("dynamodb")

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

def lambda_handler(event: Dict[str, Any], context: Any = None) -> Dict[str, Any]:
    cors_headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key"
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors_headers, "body": ""}

    path_parameters = event.get("pathParameters") or {}
    doc_id = path_parameters.get("docId")

    if not doc_id:
        return {
            "statusCode": 400,
            "headers": cors_headers,
            "body": json.dumps({"error": "Missing docId in path parameters"})
        }

    try:
        table = dynamodb.Table(DYNAMODB_TABLE)
        response = table.get_item(Key={"docId": doc_id})
        item = response.get("Item")

        if not item:
            return {
                "statusCode": 404,
                "headers": cors_headers,
                "body": json.dumps({"error": f"Document {doc_id} not found"})
            }

        return {
            "statusCode": 200,
            "headers": cors_headers,
            "body": json.dumps(item, cls=DecimalEncoder)
        }

    except Exception as e:
        print(f"Error fetching docId {doc_id}: {e}")
        return {
            "statusCode": 500,
            "headers": cors_headers,
            "body": json.dumps({"error": str(e)})
        }
