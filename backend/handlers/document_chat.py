"""
Document Q&A / Chat Handler for Doc-Explainer Agent.
Provides single-document grounded question answering using Amazon Bedrock.
Answers are strictly factual, point-wise, and reference exact clauses from the document.
Implements response caching in DynamoDB keyed by docId and question hash (PRD Section 7).
"""
import os
import json
import hashlib
from typing import Any, Dict
import boto3

DEFAULT_MODEL_ID = os.environ.get("BEDROCK_MODEL_ID", "anthropic.claude-3-5-sonnet-20240620-v1:0")
AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")
DYNAMODB_TABLE = os.environ.get("DOC_TABLE_NAME", "DocExplainerTable")

dynamodb = boto3.resource("dynamodb")

def get_bedrock_client():
    return boto3.client("bedrock-runtime", region_name=AWS_REGION)

def answer_document_question(
    raw_text: str,
    question: str,
    target_language: str = "english",
    deterministic_calc: Optional[Dict[str, Any]] = None,
    risk_flags: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    client = get_bedrock_client()

    lang_instruction = ""
    if target_language.lower() not in ["english", "en"]:
        lang_instruction = f"Provide your answer in {target_language} using native script, while keeping numbers, monetary amounts, and clause references clear."

    calc_context = ""
    if deterministic_calc:
        calc_context = (
            "\nVERIFIED DETERMINISTIC MATHEMATICAL CALCULATIONS (Calculated by specialized Python Math Engine - DO NOT DO MENTAL ARITHMETIC, CITE THESE EXACT VALUES):\n"
            f"{json.dumps(deterministic_calc, default=str, indent=2)}\n"
        )

    risk_context = ""
    if risk_flags:
        risk_context = (
            "\nDOCUMENT RISK FLAGS & EXTRACTED CLAUSES:\n"
            f"{json.dumps(risk_flags, default=str, indent=2)}\n"
        )

    system_prompt = (
        "You are an expert AI Legal, Financial & Utility Document Assistant. Answer the user's question using ONLY the provided document text and verified calculations. "
        "Guidelines:\n"
        "1. Give point-wise, clear, easy-to-understand explanations with zero unnecessary legal jargon.\n"
        "2. Always cite the exact clause, section, or line number if available in the text.\n"
        "3. Highlight specific dates, monetary amounts, or deadlines involved.\n"
        "4. If the question asks for math, EMI, late fees, tariff slabs, or penalties, cite the exact numbers from the VERIFIED DETERMINISTIC MATHEMATICAL CALCULATIONS section.\n"
        "5. If the document does not mention the answer, state honestly that it is not specified in the document.\n"
        f"{lang_instruction}"
    )

    prompt = (
        f"Document Content:\n\n{raw_text[:12000]}\n\n"
        f"{risk_context}"
        f"{calc_context}"
        f"User Question: {question}\n\n"
        "Answer point-wise with exact clause citations and numbers:"
    )

    response = client.converse(
        modelId=DEFAULT_MODEL_ID,
        messages=[{"role": "user", "content": [{"text": prompt}]}],
        system=[{"text": system_prompt}],
        inferenceConfig={
            "maxTokens": 2048,
            "temperature": 0.0  # Zero temperature for factual consistency
        }
    )

    answer_text = response["output"]["message"]["content"][0]["text"].strip()
    return {
        "status": "success",
        "question": question,
        "answer": answer_text,
        "language": target_language
    }

def lambda_handler(event: Dict[str, Any], context: Any = None) -> Dict[str, Any]:
    cors_headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key"
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors_headers, "body": ""}

    path_parameters = event.get("pathParameters") or {}
    doc_id = path_parameters.get("docId")

    body = event.get("body", "{}")
    body_data = json.loads(body) if isinstance(body, str) else body

    question = body_data.get("question", "").strip()
    target_language = body_data.get("language", "english")

    if not doc_id or not question:
        return {
            "statusCode": 400,
            "headers": cors_headers,
            "body": json.dumps({"error": "Missing docId or question"})
        }

    try:
        table = dynamodb.Table(DYNAMODB_TABLE)
        doc_res = table.get_item(Key={"docId": doc_id})
        item = doc_res.get("Item")

        if not item:
            return {
                "statusCode": 404,
                "headers": cors_headers,
                "body": json.dumps({"error": f"Document {doc_id} not found"})
            }

        # Check question cache in DynamoDB (PRD Section 7)
        q_hash = hashlib.sha256(f"{doc_id}:{question}:{target_language}".encode("utf-8")).hexdigest()[:16]
        cached_answers = item.get("cachedQnA", {})
        if q_hash in cached_answers:
            print(f"Serving cached answer for question hash: {q_hash}")
            return {
                "statusCode": 200,
                "headers": cors_headers,
                "body": json.dumps({
                    "status": "success",
                    "question": question,
                    "answer": cached_answers[q_hash],
                    "cached": True,
                    "language": target_language
                })
            }

        raw_text = item.get("rawExtraction") or item.get("explanation", "")
        projections = item.get("projections")
        risk_flags = item.get("riskFlags")
        result = answer_document_question(
            raw_text=raw_text,
            question=question,
            target_language=target_language,
            deterministic_calc=projections,
            risk_flags=risk_flags
        )

        # Store in DynamoDB question cache
        cached_answers[q_hash] = result["answer"]
        table.update_item(
            Key={"docId": doc_id},
            UpdateExpression="SET cachedQnA = :c",
            ExpressionAttributeValues={":c": cached_answers}
        )

        return {
            "statusCode": 200,
            "headers": cors_headers,
            "body": json.dumps(result)
        }

    except Exception as e:
        print(f"Error answering question for {doc_id}: {e}")
        return {
            "statusCode": 500,
            "headers": cors_headers,
            "body": json.dumps({"error": str(e)})
        }
