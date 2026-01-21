import { CfnOutput, RemovalPolicy, Stack, type StackProps } from "aws-cdk-lib";
import { AttributeType, TableV2 } from "aws-cdk-lib/aws-dynamodb";
import type { Construct } from "constructs";

export interface DynamoDBStackProps extends StackProps {
    stage: string;
}

export class DynamoDBStack extends Stack {
    constructor(scope: Construct, id: string, props: DynamoDBStackProps) {
        super(scope, id, props);

        const table = new TableV2(this, 'SchoolSageAITable', {
            partitionKey: { name: 'PK', type: AttributeType.STRING },
            sortKey: { name: 'SK', type: AttributeType.STRING },
            tableName: 'SchoolSageAITable',
            pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: props.stage === "production" },
            deletionProtection: props.stage === "production",
            removalPolicy: props.stage === "development" ? RemovalPolicy.DESTROY : RemovalPolicy.RETAIN,
        });

        new CfnOutput(this, 'DynamoDBTableName', {
            value: table.tableArn,
            description: 'The ARN of the DynamoDB table',
            exportName: 'DynamoDBTableArn',
        });
    }
}