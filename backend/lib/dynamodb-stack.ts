import { CfnOutput, RemovalPolicy, Stack, type StackProps } from "aws-cdk-lib";
import { AttributeType, TableV2 } from "aws-cdk-lib/aws-dynamodb";
import type { Construct } from "constructs";

export class DynamoDBStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const table = new TableV2(this, 'SchoolSageAITable', {
            partitionKey: { name: 'PK', type: AttributeType.STRING },
            sortKey: { name: 'SK', type: AttributeType.STRING },
            tableName: 'SchoolSageAITable',
            pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: process.env.NODE_ENV === 'production' },
            deletionProtection: process.env.NODE_ENV === 'production',
            removalPolicy: process.env.NODE_ENV === 'development' ? RemovalPolicy.DESTROY : RemovalPolicy.RETAIN,
        });

        new CfnOutput(this, 'DynamoDBTableName', {
            value: table.tableArn,
            description: 'The ARN of the DynamoDB table',
            exportName: 'DynamoDBTableArn',
        });
    }
}