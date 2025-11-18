#!/usr/bin/env node
import "dotenv/config";
import * as cdk from "aws-cdk-lib";
import { CognitoStack } from "../lib/cognito-stack";
import { DynamoDBStack } from "../lib/dynamodb-stack";

const app = new cdk.App();

const requiredEnvVars = [
    "DEPLOYMENT_URL",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "MICROSOFT_CLIENT_ID",
    "MICROSOFT_CLIENT_SECRET",
    "MICROSOFT_TENANT_ID"
];

const missingVars = requiredEnvVars.filter((key) => !process.env[key]);
if (missingVars.length > 0) {
    throw new Error(
        `The following environment variables must be set: ${missingVars.join(", ")}`
    );
}

const DEPLOYMENT_URL = process.env.DEPLOYMENT_URL!;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID!;
const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET!;
const MICROSOFT_TENANT_ID = process.env.MICROSOFT_TENANT_ID!;

new CognitoStack(app, "SchoolSageCognitoStack", {
    env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
    deploymentUrl: DEPLOYMENT_URL,
    userPoolDomain: "schoolsage",
    googleClientId: GOOGLE_CLIENT_ID,
    googleClientSecret: GOOGLE_CLIENT_SECRET,
    microsoftClientId: MICROSOFT_CLIENT_ID,
    microsoftClientSecret: MICROSOFT_CLIENT_SECRET,
    microsoftTenantId: MICROSOFT_TENANT_ID,
});

new DynamoDBStack(app, "SchoolSageDynamoDBStack", {
    env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});