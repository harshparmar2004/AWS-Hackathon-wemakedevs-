"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocExplainerStack = void 0;
const path = require("path");
const cdk = require("aws-cdk-lib");
const s3 = require("aws-cdk-lib/aws-s3");
const dynamodb = require("aws-cdk-lib/aws-dynamodb");
const lambda = require("aws-cdk-lib/aws-lambda");
const apigateway = require("aws-cdk-lib/aws-apigateway");
const iam = require("aws-cdk-lib/aws-iam");
const sfn = require("aws-cdk-lib/aws-stepfunctions");
const tasks = require("aws-cdk-lib/aws-stepfunctions-tasks");
class DocExplainerStack extends cdk.Stack {
    constructor(scope, id, props) {
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
exports.DocExplainerStack = DocExplainerStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9jLWV4cGxhaW5lci1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImRvYy1leHBsYWluZXItc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsNkJBQTZCO0FBQzdCLG1DQUFtQztBQUVuQyx5Q0FBeUM7QUFDekMscURBQXFEO0FBQ3JELGlEQUFpRDtBQUNqRCx5REFBeUQ7QUFDekQsMkNBQTJDO0FBQzNDLHFEQUFxRDtBQUNyRCw2REFBNkQ7QUFFN0QsTUFBYSxpQkFBa0IsU0FBUSxHQUFHLENBQUMsS0FBSztJQUM5QyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQXNCO1FBQzlELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLDZDQUE2QztRQUM3QywrQkFBK0I7UUFDL0IsNkNBQTZDO1FBQzdDLE1BQU0sY0FBYyxHQUFHLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsZ0JBQWdCLEVBQUU7WUFDM0QsVUFBVSxFQUFFLHlCQUF5QixJQUFJLENBQUMsT0FBTyxJQUFJLEtBQUssSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFO1lBQzNFLFNBQVMsRUFBRSxLQUFLO1lBQ2hCLFVBQVUsRUFBRSxFQUFFLENBQUMsZ0JBQWdCLENBQUMsVUFBVTtZQUMxQyxpQkFBaUIsRUFBRSxFQUFFLENBQUMsaUJBQWlCLENBQUMsU0FBUztZQUNqRCxhQUFhLEVBQUUsR0FBRyxDQUFDLGFBQWEsQ0FBQyxPQUFPO1lBQ3hDLGlCQUFpQixFQUFFLElBQUk7WUFDdkIsSUFBSSxFQUFFO2dCQUNKO29CQUNFLGNBQWMsRUFBRTt3QkFDZCxFQUFFLENBQUMsV0FBVyxDQUFDLEdBQUc7d0JBQ2xCLEVBQUUsQ0FBQyxXQUFXLENBQUMsSUFBSTt3QkFDbkIsRUFBRSxDQUFDLFdBQVcsQ0FBQyxHQUFHO3FCQUNuQjtvQkFDRCxjQUFjLEVBQUUsQ0FBQyxHQUFHLENBQUM7b0JBQ3JCLGNB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LFlBQVksQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLElBQUksVUFBVSxDQUFDLGlCQUFpQixDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUM7UUFFbEYsNkNBQTZDO1FBQzdDLG1CQUFtQjtRQUNuQiw2Q0FBNkM7UUFDN0MsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxvQkFBb0IsRUFBRTtZQUM1QyxLQUFLLEVBQUUsR0FBRyxDQUFDLEdBQUc7WUFDZCxXQUFXLEVBQUUsd0RBQXdEO1lBQ3JFLFVBQVUsRUFBRSxvQkFBb0I7U0FDakMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxvQkFBb0IsRUFBRTtZQUM1QyxLQUFLLEVBQUUsY0FBYyxDQUFDLFVBQVU7WUFDaEMsV0FBVyxFQUFFLGdDQUFnQztTQUM5QyxDQUFDLENBQUM7UUFFSCxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLG1CQUFtQixFQUFFO1lBQzNDLEtBQUssRUFBRSxhQUFhLENBQUMsU0FBUztZQUM5QixXQUFXLEVBQUUseUNBQXlDO1NBQ3ZELENBQUMsQ0FBQztRQUVILElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsa0JBQWtCLEVBQUU7WUFDMUMsS0FBSyxFQUFFLFlBQVksQ0FBQyxlQUFlO1lBQ25DLFdBQVcsRUFBRSxvREFBb0Q7U0FDbEUsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBbFRELDhDQWtUQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5pbXBvcnQgKiBhcyBzMyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtczMnO1xuaW1wb3J0ICogYXMgZHluYW1vZGIgZnJvbSAnYXdzLWNkay1saWIvYXdzLWR5bmFtb2RiJztcbmltcG9ydCAqIGFzIGxhbWJkYSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbGFtYmRhJztcbmltcG9ydCAqIGFzIGFwaWdhdGV3YXkgZnJvbSAnYXdzLWNkay1saWIvYXdzLWFwaWdhdGV3YXknO1xuaW1wb3J0ICogYXMgaWFtIGZyb20gJ2F3cy1jZGstbGliL2F3cy1pYW0nO1xuaW1wb3J0ICogYXMgc2ZuIGZyb20gJ2F3cy1jZGstbGliL2F3cy1zdGVwZnVuY3Rpb25zJztcbmltcG9ydCAqIGFzIHRhc2tzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1zdGVwZnVuY3Rpb25zLXRhc2tzJztcblxuZXhwb3J0IGNsYXNzIERvY0V4cGxhaW5lclN0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM/OiBjZGsuU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8gMS4gU3RvcmFnZSBMYXllciAoQW1hem9uIFMzKVxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIGNvbnN0IGRvY3VtZW50QnVja2V0ID0gbmV3IHMzLkJ1Y2tldCh0aGlzLCAnRG9jdW1lbnRCdWNrZXQnLCB7XG4gICAgICBidWNrZXROYW1lOiBgZG9jLWV4cGxhaW5lci11cGxvYWRzLSR7dGhpcy5hY2NvdW50IHx8ICdkZXYnfS0ke3RoaXMucmVnaW9ufWAsXG4gICAgICB2ZXJzaW9uZWQ6IGZhbHNlLFxuICAgICAgZW5jcnlwdGlvbjogczMuQnVja2V0RW5jcnlwdGlvbi5TM19NQU5BR0VELFxuICAgICAgYmxvY2tQdWJsaWNBY2Nlc3M6IHMzLkJsb2NrUHVibGljQWNjZXNzLkJMT0NLX0FMTCxcbiAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LkRFU1RST1ksXG4gICAgICBhdXRvRGVsZXRlT2JqZWN0czogdHJ1ZSxcbiAgICAgIGNvcnM6IFtcbiAgICAgICAge1xuICAgICAgICAgIGFsbG93ZWRNZXRob2RzOiBbXG4gICAgICAgICAgICBzMy5IdHRwTWV0aG9kcy5HRVQsXG4gICAgICAgICAgICBzMy5IdHRwTWV0aG9kcy5QT1NULFxuICAgICAgICAgICAgczMuSHR0cE1ldGhvZHMuUFVULFxuICAgICAgICAgIF0sXG4gICAgICAgICAgYWxsb3dlZE9yaWdpbnM6IFsnKiddLFxuICAgICAgICAgIGFsbG93ZWRIZWFkZXJzOiBbJyonXSxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfSk7XG5cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyAyLiBEYXRhYmFzZSBMYXllciAoQW1hem9uIER5bmFtb0RCKVxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIGNvbnN0IGRvY3VtZW50VGFibGUgPSBuZXcgZHluYW1vZGIuVGFibGUodGhpcywgJ0RvY3VtZW50VGFibGUnLCB7XG4gICAgICB0YWJsZU5hbWU6ICdEb2NFeHBsYWluZXJUYWJsZScsXG4gICAgICBwYXJ0aXRpb25LZXk6IHtcbiAgICAgICAgbmFtZTogJ2RvY0lkJyxcbiAgICAgICAgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcsXG4gICAgICB9LFxuICAgICAgYmlsbGluZ01vZGU6IGR5bmFtb2RiLkJpbGxpbmdNb2RlLlBBWV9QRVJfUkVRVUVTVCxcbiAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LkRFU1RST1ksXG4gICAgICBwb2ludEluVGltZVJlY292ZXJ5OiBmYWxzZSxcbiAgICB9KTtcblxuICAgIGRvY3VtZW50VGFibGUuYWRkR2xvYmFsU2Vjb25kYXJ5SW5kZXgoe1xuICAgICAgaW5kZXhOYW1lOiAnU3RhdHVzSW5kZXgnLFxuICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdzdGF0dXMnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxuICAgICAgc29ydEtleTogeyBuYW1lOiAnY3JlYXRlZEF0JywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcbiAgICAgIHByb2plY3Rpb25UeXBlOiBkeW5hbW9kYi5Qcm9qZWN0aW9uVHlwZS5BTEwsXG4gICAgfSk7XG5cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyAzLiBJQU0gUG9saWN5IGZvciBBbWF6b24gQmVkcm9ja1xuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIGNvbnN0IGJlZHJvY2tQb2xpY3kgPSBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICBhY3Rpb25zOiBbXG4gICAgICAgICdiZWRyb2NrOkludm9rZU1vZGVsJyxcbiAgICAgICAgJ2JlZHJvY2s6SW52b2tlTW9kZWxXaXRoUmVzcG9uc2VTdHJlYW0nLFxuICAgICAgICAnYmVkcm9jazpDb252ZXJzZScsXG4gICAgICAgICdiZWRyb2NrOkNvbnZlcnNlU3RyZWFtJyxcbiAgICAgICAgJ2JlZHJvY2s6TGlzdEZvdW5kYXRpb25Nb2RlbHMnLFxuICAgICAgXSxcbiAgICAgIHJlc291cmNlczogWycqJ10sXG4gICAgfSk7XG5cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyA0LiBMYW1iZGEgQ29tcHV0ZSBGdW5jdGlvbnMgKFB5dGhvbiAzLjEyKVxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIGNvbnN0IGJhY2tlbmRQYXRoID0gcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uLy4uL2JhY2tlbmQnKTtcblxuICAgIGNvbnN0IGNvbW1vbkVudiA9IHtcbiAgICAgIERPQ19CVUNLRVRfTkFNRTogZG9jdW1lbnRCdWNrZXQuYnVja2V0TmFtZSxcbiAgICAgIERPQ19UQUJMRV9OQU1FOiBkb2N1bWVudFRhYmxlLnRhYmxlTmFtZSxcbiAgICAgIEJFRFJPQ0tfTU9ERUxfSUQ6IHByb2Nlc3MuZW52LkJFRFJPQ0tfTU9ERUxfSUQgfHwgJ3VzLmFudGhyb3BpYy5jbGF1ZGUtMy1oYWlrdS0yMDI0MDMwNy12MTowJyxcbiAgICB9O1xuXG4gICAgLy8gU3RhZ2UgMTogTXVsdGltb2RhbCBWaXNpb24gRXh0cmFjdGlvblxuICAgIGNvbnN0IGV4dHJhY3RGbiA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgJ0V4dHJhY3RWaXNpb25GbicsIHtcbiAgICAgIGZ1bmN0aW9uTmFtZTogJ2RvYy1leHBsYWluZXItZXh0cmFjdC12aXNpb24nLFxuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuUFlUSE9OXzNfMTIsXG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQoYmFja2VuZFBhdGgpLFxuICAgICAgaGFuZGxlcjogJ2hhbmRsZXJzLmV4dHJhY3RfdmlzaW9uLmxhbWJkYV9oYW5kbGVyJyxcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5taW51dGVzKDMpLFxuICAgICAgbWVtb3J5U2l6ZTogMTAyNCxcbiAgICAgIGVudmlyb25tZW50OiBjb21tb25FbnYsXG4gICAgfSk7XG4gICAgZG9jdW1lbnRCdWNrZXQuZ3JhbnRSZWFkKGV4dHJhY3RGbik7XG4gICAgZXh0cmFjdEZuLmFkZFRvUm9sZVBvbGljeShiZWRyb2NrUG9saWN5KTtcblxuICAgIC8vIFN0YWdlIDI6IENsYXNzaWZ5ICYgRXhwbGFpblxuICAgIGNvbnN0IGNsYXNzaWZ5RXhwbGFpbkZuID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAnQ2xhc3NpZnlFeHBsYWluRm4nLCB7XG4gICAgICBmdW5jdGlvbk5hbWU6ICdkb2MtZXhwbGFpbmVyLWNsYXNzaWZ5LWV4cGxhaW4nLFxuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuUFlUSE9OXzNfMTIsXG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQoYmFja2VuZFBhdGgpLFxuICAgICAgaGFuZGxlcjogJ2hhbmRsZXJzLmNsYXNzaWZ5X2V4cGxhaW4ubGFtYmRhX2hhbmRsZXInLFxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoMiksXG4gICAgICBtZW1vcnlTaXplOiA1MTIsXG4gICAgICBlbnZpcm9ubWVudDogY29tbW9uRW52LFxuICAgIH0pO1xuICAgIGNsYXNzaWZ5RXhwbGFpbkZuLmFkZFRvUm9sZVBvbGljeShiZWRyb2NrUG9saWN5KTtcblxuICAgIC8vIFN0YWdlIDM6IFN0cnVjdHVyZSBSaXNrIEZsYWdzXG4gICAgY29uc3Qgcmlza0ZsYWdzRm4gPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsICdSaXNrRmxhZ3NGbicsIHtcbiAgICAgIGZ1bmN0aW9uTmFtZTogJ2RvYy1leHBsYWluZXItcmlzay1mbGFncycsXG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5QWVRIT05fM18xMixcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldChiYWNrZW5kUGF0aCksXG4gICAgICBoYW5kbGVyOiAnaGFuZGxlcnMucmlza19mbGFncy5sYW1iZGFfaGFuZGxlcicsXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24ubWludXRlcygyKSxcbiAgICAgIG1lbW9yeVNpemU6IDUxMixcbiAgICAgIGVudmlyb25tZW50OiBjb21tb25FbnYsXG4gICAgfSk7XG4gICAgcmlza0ZsYWdzRm4uYWRkVG9Sb2xlUG9saWN5KGJlZHJvY2tQb2xpY3kpO1xuXG4gICAgLy8gU3RhZ2UgNDogRmVlICYgUGVuYWx0eSBDYWxjdWxhdG9yIFRvb2xcbiAgICBjb25zdCBmZWVDYWxjdWxhdG9yRm4gPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsICdGZWVDYWxjdWxhdG9yRm4nLCB7XG4gICAgICBmdW5jdGlvbk5hbWU6ICdkb2MtZXhwbGFpbmVyLWZlZS1jYWxjdWxhdG9yJyxcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLlBZVEhPTl8zXzEyLFxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KGJhY2tlbmRQYXRoKSxcbiAgICAgIGhhbmRsZXI6ICdoYW5kbGVycy5mZWVfY2FsY3VsYXRvci5sYW1iZGFfaGFuZGxlcicsXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygzMCksXG4gICAgICBtZW1vcnlTaXplOiAyNTYsXG4gICAgICBlbnZpcm9ubWVudDogY29tbW9uRW52LFxuICAgIH0pO1xuXG4gICAgLy8gU3RhZ2UgNTogUmVnaW9uYWwgTGFuZ3VhZ2UgVHJhbnNsYXRpb25cbiAgICBjb25zdCB0cmFuc2xhdG9yRm4gPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsICdUcmFuc2xhdG9yRm4nLCB7XG4gICAgICBmdW5jdGlvbk5hbWU6ICdkb2MtZXhwbGFpbmVyLXRyYW5zbGF0b3InLFxuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuUFlUSE9OXzNfMTIsXG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQoYmFja2VuZFBhdGgpLFxuICAgICAgaGFuZGxlcjogJ2hhbmRsZXJzLnRyYW5zbGF0b3IubGFtYmRhX2hhbmRsZXInLFxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoMiksXG4gICAgICBtZW1vcnlTaXplOiA1MTIsXG4gICAgICBlbnZpcm9ubWVudDogY29tbW9uRW52LFxuICAgIH0pO1xuICAgIHRyYW5zbGF0b3JGbi5hZGRUb1JvbGVQb2xpY3koYmVkcm9ja1BvbGljeSk7XG5cbiAgICAvLyBTdGFnZSA2OiBQZXJzaXN0IEZpbmFsIFJlc3VsdHMgdG8gRHluYW1vREJcbiAgICBjb25zdCBzYXZlUmVzdWx0c0ZuID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAnU2F2ZVJlc3VsdHNGbicsIHtcbiAgICAgIGZ1bmN0aW9uTmFtZTogJ2RvYy1leHBsYWluZXItc2F2ZS1yZXN1bHRzJyxcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLlBZVEhPTl8zXzEyLFxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KGJhY2tlbmRQYXRoKSxcbiAgICAgIGhhbmRsZXI6ICdoYW5kbGVycy5zYXZlX3Jlc3VsdHMubGFtYmRhX2hhbmRsZXInLFxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMzApLFxuICAgICAgbWVtb3J5U2l6ZTogMjU2LFxuICAgICAgZW52aXJvbm1lbnQ6IGNvbW1vbkVudixcbiAgICB9KTtcbiAgICBkb2N1bWVudFRhYmxlLmdyYW50UmVhZFdyaXRlRGF0YShzYXZlUmVzdWx0c0ZuKTtcblxuICAgIC8vIEludGVyYWN0aXZlIERvY3VtZW50IFEmQSAvIENoYXQgSGFuZGxlciAoU2luZ2xlLURvY3VtZW50IEdyb3VuZGVkKVxuICAgIGNvbnN0IGRvY3VtZW50Q2hhdEZuID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAnRG9jdW1lbnRDaGF0Rm4nLCB7XG4gICAgICBmdW5jdGlvbk5hbWU6ICdkb2MtZXhwbGFpbmVyLWRvY3VtZW50LWNoYXQnLFxuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuUFlUSE9OXzNfMTIsXG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQoYmFja2VuZFBhdGgpLFxuICAgICAgaGFuZGxlcjogJ2hhbmRsZXJzLmRvY3VtZW50X2NoYXQubGFtYmRhX2hhbmRsZXInLFxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMzApLFxuICAgICAgbWVtb3J5U2l6ZTogNTEyLFxuICAgICAgZW52aXJvbm1lbnQ6IGNvbW1vbkVudixcbiAgICB9KTtcbiAgICBkb2N1bWVudFRhYmxlLmdyYW50UmVhZFdyaXRlRGF0YShkb2N1bWVudENoYXRGbik7XG4gICAgZG9jdW1lbnRDaGF0Rm4uYWRkVG9Sb2xlUG9saWN5KGJlZHJvY2tQb2xpY3kpO1xuXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8gNS4gQVdTIFN0ZXAgRnVuY3Rpb25zIFN0YXRlIE1hY2hpbmUgKEV4cGxpY2l0IDYgVmlzdWFsIFN0YWdlcylcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBjb25zdCB0YXNrRXh0cmFjdCA9IG5ldyB0YXNrcy5MYW1iZGFJbnZva2UodGhpcywgJ1N0YXRlXzFfRXh0cmFjdFZpc2lvbicsIHtcbiAgICAgIGxhbWJkYUZ1bmN0aW9uOiBleHRyYWN0Rm4sXG4gICAgICBvdXRwdXRQYXRoOiAnJC5QYXlsb2FkJyxcbiAgICAgIGNvbW1lbnQ6ICdFeHRyYWN0cyBmdWxsIGRvY3VtZW50IGxheW91dCBhbmQgdGV4dCB2aWEgQmVkcm9jayBDbGF1ZGUgMy41IE11bHRpbW9kYWwgVmlzaW9uJyxcbiAgICB9KTtcblxuICAgIGNvbnN0IHRhc2tDbGFzc2lmeUV4cGxhaW4gPSBuZXcgdGFza3MuTGFtYmRhSW52b2tlKHRoaXMsICdTdGF0ZV8yX0NsYXNzaWZ5QW5kRXhwbGFpbicsIHtcbiAgICAgIGxhbWJkYUZ1bmN0aW9uOiBjbGFzc2lmeUV4cGxhaW5GbixcbiAgICAgIG91dHB1dFBhdGg6ICckLlBheWxvYWQnLFxuICAgICAgY29tbWVudDogJ0NsYXNzaWZpZXMgZG9jdW1lbnQgdHlwZSBhbmQgd3JpdGVzIGNvbnZlcnNhdGlvbmFsIHBsYWluLWxhbmd1YWdlIHN1bW1hcnknLFxuICAgIH0pO1xuXG4gICAgY29uc3QgdGFza1Jpc2tGbGFncyA9IG5ldyB0YXNrcy5MYW1iZGFJbnZva2UodGhpcywgJ1N0YXRlXzNfU3RydWN0dXJlUmlza0ZsYWdzJywge1xuICAgICAgbGFtYmRhRnVuY3Rpb246IHJpc2tGbGFnc0ZuLFxuICAgICAgb3V0cHV0UGF0aDogJyQuUGF5bG9hZCcsXG4gICAgICBjb21tZW50OiAnRXh0cmFjdHMgc3RydWN0dXJlZCB7Y2xhdXNlLCBhbW91bnQsIHdoeX0gcmlzay1mbGFncyBhbmQgZmluYW5jaWFsIHBhcmFtZXRlcnMnLFxuICAgIH0pO1xuXG4gICAgY29uc3QgdGFza0ZlZUNhbGMgPSBuZXcgdGFza3MuTGFtYmRhSW52b2tlKHRoaXMsICdTdGF0ZV80X0NvbXB1dGVGZWVQcm9qZWN0aW9ucycsIHtcbiAgICAgIGxhbWJkYUZ1bmN0aW9uOiBmZWVDYWxjdWxhdG9yRm4sXG4gICAgICBvdXRwdXRQYXRoOiAnJC5QYXlsb2FkJyxcbiAgICAgIGNvbW1lbnQ6ICdBZ2VudGljIHRvb2w6IGNvbXB1dGVzIGRldGVybWluaXN0aWMgY29tcG91bmRpbmcgb3ZlcmR1ZSBmZWUgcHJvamVjdGlvbnMnLFxuICAgIH0pO1xuXG4gICAgY29uc3QgdGFza1RyYW5zbGF0ZSA9IG5ldyB0YXNrcy5MYW1iZGFJbnZva2UodGhpcywgJ1N0YXRlXzVfVHJhbnNsYXRlUmVnaW9uYWwnLCB7XG4gICAgICBsYW1iZGFGdW5jdGlvbjogdHJhbnNsYXRvckZuLFxuICAgICAgb3V0cHV0UGF0aDogJyQuUGF5bG9hZCcsXG4gICAgICBjb21tZW50OiAnVHJhbnNsYXRlcyBzdW1tYXJ5LCByaXNrLWZsYWdzLCBhbmQgY2FsY3VsYXRpb25zIGludG8gcmVnaW9uYWwgSW5kaWFuIGxhbmd1YWdlJyxcbiAgICB9KTtcblxuICAgIGNvbnN0IHRhc2tTYXZlID0gbmV3IHRhc2tzLkxhbWJkYUludm9rZSh0aGlzLCAnU3RhdGVfNl9TYXZlVG9EeW5hbW9EQicsIHtcbiAgICAgIGxhbWJkYUZ1bmN0aW9uOiBzYXZlUmVzdWx0c0ZuLFxuICAgICAgb3V0cHV0UGF0aDogJyQuUGF5bG9hZCcsXG4gICAgICBjb21tZW50OiAnUGVyc2lzdHMgY29tcGxldGUgZG9jdW1lbnQgcmVjb3JkIGluIER5bmFtb0RCIHdpdGggc3RhdHVzOiBjb21wbGV0ZScsXG4gICAgfSk7XG5cbiAgICBjb25zdCBwaXBlbGluZVN1Y2Nlc3MgPSBuZXcgc2ZuLlN1Y2NlZWQodGhpcywgJ1BpcGVsaW5lX1N1Y2Nlc3MnLCB7XG4gICAgICBjb21tZW50OiAnRG9jdW1lbnQgcHJvY2Vzc2luZyBwaXBlbGluZSBjb21wbGV0ZWQgc3VjY2Vzc2Z1bGx5JyxcbiAgICB9KTtcblxuICAgIGNvbnN0IHN0YXRlTWFjaGluZURlZmluaXRpb24gPSB0YXNrRXh0cmFjdFxuICAgICAgLm5leHQodGFza0NsYXNzaWZ5RXhwbGFpbilcbiAgICAgIC5uZXh0KHRhc2tSaXNrRmxhZ3MpXG4gICAgICAubmV4dCh0YXNrRmVlQ2FsYylcbiAgICAgIC5uZXh0KHRhc2tUcmFuc2xhdGUpXG4gICAgICAubmV4dCh0YXNrU2F2ZSlcbiAgICAgIC5uZXh0KHBpcGVsaW5lU3VjY2Vzcyk7XG5cbiAgICBjb25zdCBzdGF0ZU1hY2hpbmUgPSBuZXcgc2ZuLlN0YXRlTWFjaGluZSh0aGlzLCAnRG9jRXhwbGFpbmVyU3RhdGVNYWNoaW5lJywge1xuICAgICAgc3RhdGVNYWNoaW5lTmFtZTogJ0RvY0V4cGxhaW5lclByb2Nlc3NpbmdQaXBlbGluZScsXG4gICAgICBkZWZpbml0aW9uQm9keTogc2ZuLkRlZmluaXRpb25Cb2R5LmZyb21DaGFpbmFibGUoc3RhdGVNYWNoaW5lRGVmaW5pdGlvbiksXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24ubWludXRlcygxMCksXG4gICAgfSk7XG5cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyA2LiBVcGxvYWQgJiBSZXRyaWV2YWwgTGFtYmRhc1xuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIGNvbnN0IHVwbG9hZEZuID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAnVXBsb2FkRnVuY3Rpb24nLCB7XG4gICAgICBmdW5jdGlvbk5hbWU6ICdkb2MtZXhwbGFpbmVyLXVwbG9hZCcsXG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5QWVRIT05fM18xMixcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldChiYWNrZW5kUGF0aCksXG4gICAgICBoYW5kbGVyOiAnaGFuZGxlcnMudXBsb2FkLmxhbWJkYV9oYW5kbGVyJyxcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDMwKSxcbiAgICAgIG1lbW9yeVNpemU6IDUxMixcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIC4uLmNvbW1vbkVudixcbiAgICAgICAgU1RBVEVfTUFDSElORV9BUk46IHN0YXRlTWFjaGluZS5zdGF0ZU1hY2hpbmVBcm4sXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgZG9jdW1lbnRCdWNrZXQuZ3JhbnRQdXQodXBsb2FkRm4pO1xuICAgIGRvY3VtZW50VGFibGUuZ3JhbnRXcml0ZURhdGEodXBsb2FkRm4pO1xuICAgIHN0YXRlTWFjaGluZS5ncmFudFN0YXJ0RXhlY3V0aW9uKHVwbG9hZEZuKTtcblxuICAgIGNvbnN0IGdldERvY3VtZW50Rm4gPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsICdHZXREb2N1bWVudEZ1bmN0aW9uJywge1xuICAgICAgZnVuY3Rpb25OYW1lOiAnZG9jLWV4cGxhaW5lci1nZXQtZG9jdW1lbnQnLFxuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuUFlUSE9OXzNfMTIsXG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQoYmFja2VuZFBhdGgpLFxuICAgICAgaGFuZGxlcjogJ2hhbmRsZXJzLmdldF9kb2N1bWVudC5sYW1iZGFfaGFuZGxlcicsXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygxNSksXG4gICAgICBtZW1vcnlTaXplOiAyNTYsXG4gICAgICBlbnZpcm9ubWVudDogY29tbW9uRW52LFxuICAgIH0pO1xuXG4gICAgZG9jdW1lbnRUYWJsZS5ncmFudFJlYWREYXRhKGdldERvY3VtZW50Rm4pO1xuXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8gNy4gQW1hem9uIEFQSSBHYXRld2F5IChSRVNUIEFQSSlcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBjb25zdCBhcGkgPSBuZXcgYXBpZ2F0ZXdheS5SZXN0QXBpKHRoaXMsICdEb2NFeHBsYWluZXJBcGknLCB7XG4gICAgICByZXN0QXBpTmFtZTogJ0RvYy1FeHBsYWluZXIgU2VydmljZScsXG4gICAgICBkZXNjcmlwdGlvbjogJ0FQSSBHYXRld2F5IGVuZHBvaW50IGZvciBEb2MtRXhwbGFpbmVyIEFnZW50IGRvY3VtZW50IHVuZGVyc3RhbmRpbmcnLFxuICAgICAgZGVmYXVsdENvcnNQcmVmbGlnaHRPcHRpb25zOiB7XG4gICAgICAgIGFsbG93T3JpZ2luczogYXBpZ2F0ZXdheS5Db3JzLkFMTF9PUklHSU5TLFxuICAgICAgICBhbGxvd01ldGhvZHM6IGFwaWdhdGV3YXkuQ29ycy5BTExfTUVUSE9EUyxcbiAgICAgICAgYWxsb3dIZWFkZXJzOiBbJ0NvbnRlbnQtVHlwZScsICdYLUFtei1EYXRlJywgJ0F1dGhvcml6YXRpb24nLCAnWC1BcGktS2V5J10sXG4gICAgICB9LFxuICAgICAgZGVwbG95T3B0aW9uczoge1xuICAgICAgICBzdGFnZU5hbWU6ICdwcm9kJyxcbiAgICAgICAgdGhyb3R0bGluZ1JhdGVMaW1pdDogNTAsXG4gICAgICAgIHRocm90dGxpbmdCdXJzdExpbWl0OiAxMDAsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgLy8gUE9TVCAvZG9jdW1lbnRzXG4gICAgY29uc3QgZG9jdW1lbnRzUmVzb3VyY2UgPSBhcGkucm9vdC5hZGRSZXNvdXJjZSgnZG9jdW1lbnRzJyk7XG4gICAgZG9jdW1lbnRzUmVzb3VyY2UuYWRkTWV0aG9kKCdQT1NUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24odXBsb2FkRm4pKTtcblxuICAgIC8vIEdFVCAvZG9jdW1lbnRzL3tkb2NJZH1cbiAgICBjb25zdCBzaW5nbGVEb2NSZXNvdXJjZSA9IGRvY3VtZW50c1Jlc291cmNlLmFkZFJlc291cmNlKCd7ZG9jSWR9Jyk7XG4gICAgc2luZ2xlRG9jUmVzb3VyY2UuYWRkTWV0aG9kKCdHRVQnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihnZXREb2N1bWVudEZuKSk7XG5cbiAgICAvLyBQT1NUIC9kb2N1bWVudHMve2RvY0lkfS9jaGF0IChEb2N1bWVudCBRJkEpXG4gICAgY29uc3QgY2hhdFJlc291cmNlID0gc2luZ2xlRG9jUmVzb3VyY2UuYWRkUmVzb3VyY2UoJ2NoYXQnKTtcbiAgICBjaGF0UmVzb3VyY2UuYWRkTWV0aG9kKCdQT1NUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oZG9jdW1lbnRDaGF0Rm4pKTtcblxuICAgIC8vIFBPU1QgL3Rvb2xzL2NhbGN1bGF0ZS1mZWUgKERpcmVjdCB0b29sIGludm9jYXRpb24pXG4gICAgY29uc3QgdG9vbHNSZXNvdXJjZSA9IGFwaS5yb290LmFkZFJlc291cmNlKCd0b29scycpO1xuICAgIGNvbnN0IGNhbGNSZXNvdXJjZSA9IHRvb2xzUmVzb3VyY2UuYWRkUmVzb3VyY2UoJ2NhbGN1bGF0ZS1mZWUnKTtcbiAgICBjYWxjUmVzb3VyY2UuYWRkTWV0aG9kKCdQT1NUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oZmVlQ2FsY3VsYXRvckZuKSk7XG5cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyA4LiBTdGFjayBPdXRwdXRzXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0FwaUdhdGV3YXlFbmRwb2ludCcsIHtcbiAgICAgIHZhbHVlOiBhcGkudXJsLFxuICAgICAgZGVzY3JpcHRpb246ICdQdWJsaWMgQVBJIEdhdGV3YXkgYmFzZSBVUkwgZm9yIGZyb250ZW5kIGNvbmZpZ3VyYXRpb24nLFxuICAgICAgZXhwb3J0TmFtZTogJ0RvY0V4cGxhaW5lckFwaVVybCcsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnUzNVcGxvYWRCdWNrZXROYW1lJywge1xuICAgICAgdmFsdWU6IGRvY3VtZW50QnVja2V0LmJ1Y2tldE5hbWUsXG4gICAgICBkZXNjcmlwdGlvbjogJ1MzIEJ1Y2tldCBuYW1lIGZvciByYXcgdXBsb2FkcycsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnRHluYW1vREJUYWJsZU5hbWUnLCB7XG4gICAgICB2YWx1ZTogZG9jdW1lbnRUYWJsZS50YWJsZU5hbWUsXG4gICAgICBkZXNjcmlwdGlvbjogJ0R5bmFtb0RCIHRhYmxlIHN0b3JpbmcgZG9jdW1lbnQgcmVzdWx0cycsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnU3RlcEZ1bmN0aW9uc0FybicsIHtcbiAgICAgIHZhbHVlOiBzdGF0ZU1hY2hpbmUuc3RhdGVNYWNoaW5lQXJuLFxuICAgICAgZGVzY3JpcHRpb246ICdTdGF0ZSBNYWNoaW5lIEFSTiBmb3IgU3RlcCBGdW5jdGlvbnMgb3JjaGVzdHJhdGlvbicsXG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==