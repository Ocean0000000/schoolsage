import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { LambdaIntegration, RestApi } from "aws-cdk-lib/aws-apigateway";
import { IFunction } from "aws-cdk-lib/aws-lambda";

export interface ApiGatewayStackProps extends StackProps {
    classesLambda: IFunction;
}

export class ApiGatewayStack extends Stack {
    constructor(scope: Construct, id: string, props: ApiGatewayStackProps) {
        super(scope, id, props);

        const restApi = new RestApi(this, 'SchoolSageRestApi');

        const classes = restApi.root.addResource('classes');
        const getClasses = new LambdaIntegration(props.classesLambda);
        classes.addMethod('GET', getClasses);
    }
}