#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DocExplainerStack } from '../lib/doc-explainer-stack';

const app = new cdk.App();

new DocExplainerStack(app, 'DocExplainerStack', {
  stackName: 'doc-explainer-agent-stack',
  description: 'Doc-Explainer Agent Infrastructure - First Commit Hackathon',
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
});
