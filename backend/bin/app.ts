#!/usr/bin/env node
import "dotenv/config";
import * as cdk from "aws-cdk-lib";
import { ApiGatewayStack } from "../lib/apigateway-stack";
import { CognitoStack } from "../lib/cognito-stack";
import { DynamoDBStack } from "../lib/dynamodb-stack";
import { LambdaStack } from "../lib/lambda-stack";

const app = new cdk.App();

const stage = process.env.NODE_ENV ?? "development";

const lambdaStack = new LambdaStack(app, "SchoolSageLambdaStack", {
    env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
    stage,
});

const cognitoStack = new CognitoStack(app, "SchoolSageCognitoStack", {
    env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
    stage,
    deploymentUrl: process.env.DEPLOYMENT_URL!,
    userPoolDomain: "schoolsage",
    linkAccountsLambda: lambdaStack.linkAccountsLambda,
    customSignUpMessageLambda: lambdaStack.customSignUpMessageLambda,
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
    microsoftClientId: process.env.MICROSOFT_CLIENT_ID,
    microsoftTenantId: process.env.MICROSOFT_TENANT_ID,
    microsoftClientSecret: process.env.MICROSOFT_CLIENT_SECRET,
});

const apiGatewayStack = new ApiGatewayStack(app, "SchoolSageApiGatewayStack", {
    env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
    classesLambda: lambdaStack.classesLambda,
    userPool: cognitoStack.userPool,
});

cognitoStack.addDependency(lambdaStack);
apiGatewayStack.addDependency(lambdaStack);

new DynamoDBStack(app, "SchoolSageDynamoDBStack", {
    env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
    stage,
});