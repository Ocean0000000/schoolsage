import { Stack, StackProps } from "aws-cdk-lib";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";
import { join } from "path";

export interface LambdaStackProps extends StackProps {
    stage: string;
}

export class LambdaStack extends Stack {
    public readonly classesLambda: NodejsFunction;
    public readonly linkAccountsLambda: NodejsFunction;
    public readonly customSignUpMessageLambda: NodejsFunction;

    constructor(scope: Construct, id: string, props: LambdaStackProps) {
        super(scope, id, props);

        this.classesLambda = new NodejsFunction(this, "GetClassesHandler", {
            runtime: Runtime.NODEJS_22_X,
            entry: join(__dirname, "../lambda/classes/index.ts"),
            handler: "index.handler",
        });

        this.linkAccountsLambda = new NodejsFunction(this, "LinkAccounts", {
            runtime: Runtime.NODEJS_22_X,
            entry: join(__dirname, "../lambda/link-accounts/index.ts"),
            handler: "index.handler",
        });

        const deploymentUrl = StringParameter.valueForStringParameter(
            this,
            `/schoolsage/${props.stage}/deployment-url`
        );

        this.customSignUpMessageLambda = new NodejsFunction(this, "CustomSignUpMessage", {
            runtime: Runtime.NODEJS_22_X,
            entry: join(__dirname, "../lambda/custom-sign-up-message/index.ts"),
            handler: "index.handler",
            environment: {
                DEPLOYMENT_URL: deploymentUrl,
            },
        });
    }
}