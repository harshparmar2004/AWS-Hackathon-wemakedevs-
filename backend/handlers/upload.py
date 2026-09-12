"""
Upload Handler for Doc-Explainer Agent.
Exposes POST /documents via Amazon API Gateway.
Saves uploaded file to S3, records metadata in DynamoDB, and starts Step Functions execution.
"""
import os
import json
import uuid
import base64
from datetime import datetime, timezone
from typing import Any, Dict
import boto3

S3_BUCKET = os.environ.get("DOC_BUCKET_NAME", "doc-explainer-uploads")
DYNAMODB_TABLE = os.environ.get("DOC_TABLE_NAME", "DocExplainerTable")
STATE_MACHINE_ARN = os.environ.get("STATE_MACHINE_ARN", "")

s3_client = boto3.client("s3")
dynamodb = boto3.resource("dynamodb")
stepfunctions = boto3.client("stepfunctions")

def lambda_handler(event: Dict[str, Any], context: Any = None) -> Dict[str, Any]:
    print("Received upload event")
    cors_headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key"
    }

    # Handle CORS Preflight
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors_headers, "body": ""}

    try:
        body = event.get("body", "{}")
        if isinstance(body, str):
            body_data = json.loads(body)
        else:
            body_data = body

        file_base64 = body_data.get("fileBase64")
        file_name = body_data.get("fileName", "document.png")
        file_type = body_data.get("fileType", "image")
        target_language = body_data.get("language", "english")

        if not file_base64:
            return {
                "statusCode": 400,
                "headers": cors_headers,
                "body": json.dumps({"error": "fileBase64 is required in request body"})
            }

        # Clean base64 prefix if present (e.g. data:image/png;base64,...)
        if "," in file_base64:
            file_base64 = file_base64.split(",")[1]

        file_bytes = base64.b64decode(file_base64)
        doc_id = f"doc-{uuid.uuid4().hex[:12]}"
        now_iso = datetime.now(timezone.utc).isoformat()
        s3_key = f"uploads/{doc_id}/{file_name}"

        # 1. Upload raw document to S3
        media_type = "application/pdf" if file_type == "pdf" else "image/png"
        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=s3_key,
            Body=file_bytes,
            ContentType=media_type,
            Metadata={"docId": doc_id, "language": target_language}
        )

        # 2. Record initial status in DynamoDB
        table = dynamodb.Table(DYNAMODB_TABLE)
        table.put_item(
            Item={
                "docId": doc_id,
                "status": "processing",
                "fileName": file_name,
                "fileType": file_type,
                "language": target_language,
                "s3Bucket": S3_BUCKET,
                "s3Key": s3_key,
                "createdAt": now_iso,
                "updatedAt": now_iso
            }
        )

        # 3. Trigger Step Functions state machine execution if configured
        if STATE_MACHINE_ARN:
            stepfunctions.start_execution(
                stateMachineArn=STATE_MACHINE_ARN,
                name=f"{doc_id}-{int(datetime.now(timezone.utc).timestamp())}",
                input=json.dumps({
                    "docId": doc_id,
                    "s3Bucket": S3_BUCKET,
                    "s3Key": s3_key,
                    "fileType": file_type,
                    "mediaType": media_type,
                    "language": target_language
                })
            )

        return {
            "statusCode": 202,
            "headers": cors_headers,
            "body": json.dumps({
                "docId": doc_id,
                "status": "processing",
                "message": "Document uploaded successfully. Processing initiated."
            })
        }

    except Exception as e:
        print(f"Error handling upload: {e}")
        return {
            "statusCode": 500,
            "headers": cors_headers,
            "body": json.dumps({"error": str(e)})
        }
