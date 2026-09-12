import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';

export class DocExplainerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ==========================================
    // 1. Storage Layer (Amazon S3)
    // ==========================================
    const documentBucket = new s3.Bucket(this, 'DocumentBucket', {
      bucketName: `doc-explainer-uploads-${this.account || 'dev'}-${this.region}`,
      versioned: false,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.POST,
            s3.HttpMethods.PUT,
          ],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
        },
      ],
    });

    // ==========================================
    // 2. Database Layer (Amazon DynamoDB)
    // ==========================================
    const documentTable = new dynamodb.Table(this, 'DocumentTable', {
      tableName: 'DocExplainerTable',
      partitionKey: {
        name: 'docId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: false,
    });

    documentTable.addGlobalSecondaryIndex({
      indexName: 'StatusIndex',
      partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // ==========================================
    // 3. IAM Policy for Amazon Bedrock
    // ==========================================
    const bedrockPolicy = new iam.PolicyStatement({
      actions: [
        'bedrock:InvokeModel',
        'bedrock:InvokeModelWithResponseStream',
        'bedrock:Converse',
        'bedrock:ConverseStream',
        'bedrock:ListFoundationModels',
      ],
      resources: ['*'],
    });

    // ==========================================
    // 4. Lambda Compute Functions (Python 3.12)
    // ==========================================
    const backendPath = path.join(__dirname, '../../backend');

    const commonEnv = {
      DOC_BUCKET_NAME: documentBucket.bucketName,
      DOC_TABLE_NAME: documentTable.tableName,
      BEDROCK_MODEL_ID: process.env.BEDROCK_MODEL_ID || 'us.anthropic.claude-3-haiku-20240307-v1:0',
    };

    // Stage 1: Multimodal Vision Extraction
    const extractFn = new lambda.Function(this, 'ExtractVisionFn', {
      functionName: 'doc-explainer-extract-vision',
      runtime: lambda.Runtime.PYTHON_3_12,
      code: lambda.Code.fromAsset(backendPath),
      handler: 'handlers.extract_vision.lambda_handler',
      timeout: cdk.Duration.minutes(3),
      memorySize: 1024,
      environment: commonEnv,
    });
    documentBucket.grantRead(extractFn);
    extractFn.addToRolePolicy(bedrockPolicy);

    // Stage 2: Classify & Explain
    const classifyExplainFn = new lambda.Function(this, 'ClassifyExplainFn', {
      functionName: 'doc-explainer-classify-explain',
      runtime: lambda.Runtime.PYTHON_3_12,
      code: lambda.Code.fromAsset(backendPath),
      handler: 'handlers.classify_explain.lambda_handler',
      timeout: cdk.Duration.minutes(2),
      memorySize: 512,
      environment: commonEnv,
    });
    classifyExplainFn.addToRolePolicy(bedrockPolicy);

    // Stage 3: Structure Risk Flags
    const riskFlagsFn = new lambda.Function(this, 'RiskFlagsFn', {
      functionName: 'doc-explainer-risk-flags',
      runtime: lambda.Runtime.PYTHON_3_12,
      code: lambda.Code.fromAsset(backendPath),
      handler: 'handlers.risk_flags.lambda_handler',
      timeout: cdk.Duration.minutes(2),
      memorySize: 512,
      environment: commonEnv,
    });
    riskFlagsFn.addToRolePolicy(bedrockPolicy);

    // Stage 4: Fee & Penalty Calculator Tool
    const feeCalculatorFn = new lambda.Function(this, 'FeeCalculatorFn', {
      functionName: 'doc-explainer-fee-calculator',
      runtime: lambda.Runtime.PYTHON_3_12,
      code: lambda.Code.fromAsset(backendPath),
      handler: 'handlers.fee_calculator.lambda_handler',
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: commonEnv,
    });

    // Stage 5: Regional Language Translation
    const translatorFn = new lambda.Function(this, 'TranslatorFn', {
      functionName: 'doc-explainer-translator',
      runtime: lambda.Runtime.PYTHON_3_12,
      code: lambda.Code.fromAsset(backendPath),
      handler: 'handlers.translator.lambda_handler',
      timeout: cdk.Duration.minutes(2),
      memorySize: 512,
      environment: commonEnv,
    });
    translatorFn.addToRolePolicy(bedrockPolicy);

    // Stage 6: Persist Final Results to DynamoDB
    const saveResultsFn = new lambda.Function(this, 'SaveResultsFn', {
      functionName: 'doc-explainer-save-results',
      runtime: lambda.Runtime.PYTHON_3_12,
      code: lambda.Code.fromAsset(backendPath),
      handler: 'handlers.save_results.lambda_handler',
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: commonEnv,
    });
    documentTable.grantReadWriteData(saveResultsFn);

    // Interactive Document Q&A / Chat Handler (Single-Document Grounded)
    const documentChatFn = new lambda.Function(this, 'DocumentChatFn', {
      functionName: 'doc-explainer-document-chat',
      runtime: lambda.Runtime.PYTHON_3_12,
      code: lambda.Code.fromAsset(backendPath),
      handler: 'handlers.document_chat.lambda_handler',
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment: commonEnv,
    });
    documentTable.grantReadWriteData(documentChatFn);
    documentChatFn.addToRolePolicy(bedrockPolicy);

    // ==========================================
    // 5. AWS Step Functions State Machine (Explicit 6 Visual Stages)
    // ==========================================
    const taskExtract = new tasks.LambdaInvoke(this, 'State_1_ExtractVision', {
      lambdaFunction: extractFn,
      outputPath: '$.Payload',
      comment: 'Extracts full document layout and text via Bedrock Claude 3.5 Multimodal Vision',
    });

    const taskClassifyExplain = new tasks.LambdaInvoke(this, 'State_2_ClassifyAndExplain', {
      lambdaFunction: classifyExplainFn,
      outputPath: '$.Payload',
      comment: 'Classifies document type and writes conversational plain-language summary',
    });

    const taskRiskFlags = new tasks.LambdaInvoke(this, 'State_3_StructureRiskFlags', {
      lambdaFunction: riskFlagsFn,
      outputPath: '$.Payload',
      comment: 'Extracts structured {clause, amount, why} risk-flags and financial parameters',
    });

    const taskFeeCalc = new tasks.LambdaInvoke(this, 'State_4_ComputeFeeProjections', {
      lambdaFunction: feeCalculatorFn,
      outputPath: '$.Payload',
      comment: 'Agentic tool: computes deterministic compounding overdue fee projections',
    });

    const taskTranslate = new tasks.LambdaInvoke(this, 'State_5_TranslateRegional', {
      lambdaFunction: translatorFn,
      outputPath: '$.Payload',
      comment: 'Translates summary, risk-flags, and calculations into regional Indian language',
    });

    const taskSave = new tasks.LambdaInvoke(this, 'State_6_SaveToDynamoDB', {
      lambdaFunction: saveResultsFn,
      outputPath: '$.Payload',
      comment: 'Persists complete document record in DynamoDB with status: complete',
    });

    const pipelineSuccess = new sfn.Succeed(this, 'Pipeline_Success', {
      comment: 'Document processing pipeline completed successfully',
    });

    const stateMachineDefinition = taskExtract
      .next(taskClassifyExplain)
      .next(taskRiskFlags)
      .next(taskFeeCalc)
      .next(taskTranslate)
      .next(taskSave)
      .next(pipelineSuccess);

    const stateMachine = new sfn.StateMachine(this, 'DocExplainerStateMachine', {
      stateMachineName: 'DocExplainerProcessingPipeline',
      definitionBody: sfn.DefinitionBody.fromChainable(stateMachineDefinition),
      timeout: cdk.Duration.minutes(10),
    });

    // ==========================================
    // 6. Upload & Retrieval Lambdas
    // ==========================================
    const uploadFn = new lambda.Function(this, 'UploadFunction', {
      functionName: 'doc-explainer-upload',
      runtime: lambda.Runtime.PYTHON_3_12,
      code: lambda.Code.fromAsset(backendPath),
      handler: 'handlers.upload.lambda_handler',
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment: {
        ...commonEnv,
        STATE_MACHINE_ARN: stateMachine.stateMachineArn,
      },
    });

    documentBucket.grantPut(uploadFn);
    documentTable.grantWriteData(uploadFn);
    stateMachine.grantStartExecution(uploadFn);

    const getDocumentFn = new lambda.Function(this, 'GetDocumentFunction', {
      functionName: 'doc-explainer-get-document',
      runtime: lambda.Runtime.PYTHON_3_12,
      code: lambda.Code.fromAsset(backendPath),
      handler: 'handlers.get_document.lambda_handler',
      timeout: cdk.Duration.seconds(15),
      memorySize: 256,
      environment: commonEnv,
    });

    documentTable.grantReadData(getDocumentFn);

    // ==========================================
    // 7. Amazon API Gateway (REST API)
    // ==========================================
    const api = new apigateway.RestApi(this, 'DocExplainerApi', {
      restApiName: 'Doc-Explainer Service',
      description: 'API Gateway endpoint for Doc-Explainer Agent document understanding',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key'],
      },
      deployOptions: {
        stageName: 'prod',
        throttlingRateLimit: 50,
        throttlingBurstLimit: 100,
      },
    });

    // POST /documents
    const documentsResource = api.root.addResource('documents');
    documentsResource.addMethod('POST', new apigateway.LambdaIntegration(uploadFn));

    // GET /documents/{docId}
    const singleDocResource = documentsResource.addResource('{docId}');
    singleDocResource.addMethod('GET', new apigateway.LambdaIntegration(getDocumentFn));

    // POST /documents/{docId}/chat (Document Q&A)
    const chatResource = singleDocResource.addResource('chat');
    chatResource.addMethod('POST', new apigateway.LambdaIntegration(documentChatFn));

    // POST /tools/calculate-fee (Direct tool invocation)
    const toolsResource = api.root.addResource('tools');
    const calcResource = toolsResource.addResource('calculate-fee');
    calcResource.addMethod('POST', new apigateway.LambdaIntegration(feeCalculatorFn));

    // ==========================================
    // 8. Stack Outputs
    // ==========================================
    new cdk.CfnOutput(this, 'ApiGatewayEndpoint', {
      value: api.url,
      description: 'Public API Gateway base URL for frontend configuration',
      exportName: 'DocExplainerApiUrl',
    });

    new cdk.CfnOutput(this, 'S3UploadBucketName', {
      value: documentBucket.bucketName,
      description: 'S3 Bucket name for raw uploads',
    });

    new cdk.CfnOutput(this, 'DynamoDBTableName', {
      value: documentTable.tableName,
      description: 'DynamoDB table storing document results',
    });

    new cdk.CfnOutput(this, 'StepFunctionsArn', {
      value: stateMachine.stateMachineArn,
      description: 'State Machine ARN for Step Functions orchestration',
    });
  }
}
