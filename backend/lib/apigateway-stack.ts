import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { RestApi } from "aws-cdk-lib/aws-apigateway";

export class ApiGatewayStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const restApi = new RestApi(this, 'SchoolSageRestApi');
        const classes = restApi.root.addResource('classes');
    }
}