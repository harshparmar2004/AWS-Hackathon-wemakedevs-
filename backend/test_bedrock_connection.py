import sys
import os
import boto3
from botocore.exceptions import ClientError, NoCredentialsError

def test_connection():
    print("==================================================")
    print("   Doc-Explainer: AWS Bedrock Connectivity Test   ")
    print("==================================================")
    region = os.environ.get("AWS_REGION", "us-east-1")
    model_id = os.environ.get("BEDROCK_MODEL_ID", "anthropic.claude-3-5-sonnet-20240620-v1:0")
    
    # 1. Test AWS Credentials
    print(f"\n[1/3] Testing AWS Credentials & Caller Identity...")
    try:
        sts = boto3.client("sts", region_name=region)
        identity = sts.get_caller_identity()
        print(f"  [OK] Connected to AWS Account: {identity.get('Account')}")
        print(f"  [OK] Caller ARN: {identity.get('Arn')}")
    except NoCredentialsError:
        print("  [ERROR] No AWS credentials found!")
        print("  Please run: aws configure")
        print("  Provide your AWS Access Key ID, Secret Access Key, and Default region name (e.g. us-east-1).")
        return False
    except Exception as e:
        print(f"  [ERROR] STS verification failed: {e}")
        return False

    # 2. Test Bedrock Client Initialization
    print(f"\n[2/3] Initializing Bedrock Runtime Client in region: {region}...")
    try:
        bedrock = boto3.client("bedrock-runtime", region_name=region)
        print(f"  [OK] Bedrock client initialized successfully.")
    except Exception as e:
        print(f"  [ERROR] Failed to initialize Bedrock client: {e}")
        return False

    # 3. Test Model Invocation (Converse API with Claude 3.5 Sonnet)
    print(f"\n[3/3] Invoking Bedrock Model: {model_id}...")
    try:
        response = bedrock.converse(
            modelId=model_id,
            messages=[
                {
                    "role": "user",
                    "content": [{"text": "Hello Claude! Confirm that AWS Bedrock is connected to Doc-Explainer Agent in 1 sentence."}]
                }
            ],
            inferenceConfig={"maxTokens": 100, "temperature": 0.0}
        )
        reply = response["output"]["message"]["content"][0]["text"].strip()
        print(f"\n  [SUCCESS] Claude 3.5 Sonnet Response:\n  \"{reply}\"")
        print("\n==================================================")
        print("  ALL CHECKS PASSED! Ready for live deployment.")
        print("==================================================")
        return True
    except ClientError as e:
        code = e.response.get("Error", {}).get("Code")
        msg = e.response.get("Error", {}).get("Message")
        print(f"  [ERROR] Bedrock ClientError ({code}): {msg}")
        if "AccessDeniedException" in code or "access" in msg.lower():
            print("\n  [ACTION REQUIRED]: Model access has not been granted for Anthropic Claude 3.5 Sonnet yet.")
            print("  1. Go to AWS Console -> Amazon Bedrock -> us-east-1")
            print("  2. In the left menu, select 'Model access'")
            print("  3. Click 'Modify model access' and check 'Anthropic Claude 3.5 Sonnet'")
            print("  4. Click 'Save changes' and re-run this test.")
        elif "ResourceNotFoundException" in code:
            print(f"\n  [NOTE]: Model {model_id} not available in {region}. Check your region or use a cross-region inference profile.")
        return False
    except Exception as e:
        print(f"  [ERROR] Unexpected error invoking model: {e}")
        return False

if __name__ == "__main__":
    success = test_connection()
    sys.exit(0 if success else 1)
