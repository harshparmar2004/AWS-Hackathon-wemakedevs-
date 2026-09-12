"""
Stage 5 in AWS Step Functions: Regional Indian Language Translation Handler.
Translates plain-language explanation, structured risk-flags, and projection narrative
into user-selected Indian regional languages (Hindi, Tamil, Telugu, Marathi, Gujarati, etc.)
using Amazon Bedrock Claude.
"""
import os
import json
from typing import Any, Dict, List
import boto3

DEFAULT_MODEL_ID = os.environ.get("BEDROCK_MODEL_ID", "anthropic.claude-3-5-sonnet-20240620-v1:0")
AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")

SUPPORTED_LANGUAGES = {
    "hindi": "Hindi (हिंदी)",
    "tamil": "Tamil (தமிழ்)",
    "telugu": "Telugu (తెలుగు)",
    "marathi": "Marathi (मराठी)",
    "gujarati": "Gujarati (ગુજરાતી)",
    "bengali": "Bengali (বাংলা)",
    "kannada": "Kannada (ಕನ್ನಡ)",
    "malayalam": "Malayalam (മലയാളം)",
    "punjabi": "Punjabi (ਪੰਜਾਬੀ)",
    "odia": "Odia (ଓଡ଼ିଆ)"
}

def get_bedrock_client():
    return boto3.client("bedrock-runtime", region_name=AWS_REGION)

def translate_explanation(
    summary: str,
    risk_flags: List[Dict[str, Any]],
    projection_narrative: str,
    target_language: str = "hindi"
) -> Dict[str, Any]:
    target_lang_name = SUPPORTED_LANGUAGES.get(target_language.lower(), target_language)

    if target_language.lower() in ["english", "en"]:
        return {
            "status": "success",
            "language": "English",
            "translatedSummary": summary,
            "translatedRiskFlags": risk_flags,
            "translatedProjectionNarrative": projection_narrative
        }

    client = get_bedrock_client()

    system_prompt = (
        f"You are a native translator and legal simplification expert fluent in {target_lang_name}. "
        "Translate the provided summary, risk-flags, and financial projection into clear, natural, everyday "
        f"{target_lang_name} using native script. "
        "Do NOT translate technical numbers or amounts (e.g. keep ₹35,000, 24%, 30 days intact). "
        "Respond ONLY in valid JSON matching this schema:\n"
        "{\n"
        '  "translatedSummary": "Summary in native script",\n'
        '  "translatedRiskFlags": [\n'
        '    {"clause": "Clause in native/original", "amount": "₹500 / 18%", "why": "Why in native script"}\n'
        "  ],\n"
        '  "translatedProjectionNarrative": "Financial impact narrative in native script"\n'
        "}\n"
        "No markdown wrapper or extra text."
    )

    content_to_translate = {
        "summary": summary,
        "riskFlags": risk_flags,
        "projectionNarrative": projection_narrative
    }

    try:
        response = client.converse(
            modelId=DEFAULT_MODEL_ID,
            messages=[
                {
                    "role": "user",
                    "content": [{"text": json.dumps(content_to_translate, ensure_ascii=False)}]
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

        parsed = json.loads(response_text.strip())
        parsed["status"] = "success"
        parsed["language"] = target_lang_name
        return parsed
    except Exception as e:
        print(f"Translation error: {e}")
        return {
            "status": "error",
            "error": str(e),
            "translatedSummary": summary,
            "translatedRiskFlags": risk_flags,
            "translatedProjectionNarrative": projection_narrative
        }

def lambda_handler(event: Dict[str, Any], context: Any = None) -> Dict[str, Any]:
    print("Stage 5 - Translate executing for docId:", event.get("docId"))

    summary = event.get("explanation", "")
    risk_flags = event.get("riskFlags", [])
    proj_narrative = event.get("projections", {}).get("narrative", "")
    target_language = event.get("language", "hindi")

    result = translate_explanation(summary, risk_flags, proj_narrative, target_language)

    event["translatedExplanation"] = result.get("translatedSummary", summary)
    event["translatedRiskFlags"] = result.get("translatedRiskFlags", risk_flags)
    event["translatedProjectionNarrative"] = result.get("translatedProjectionNarrative", proj_narrative)

    return event
