import { APIGatewayProxyEvent } from "aws-lambda";

export const handler = async (event: APIGatewayProxyEvent) => {
    console.log("Event: ", JSON.stringify(event, null, 2));
    
    if (event.httpMethod === "GET") {
        getClasses(event);
    }

    return {
        statusCode: 200,
        body: JSON.stringify({ message: "Classes endpoint is working!" }),
    };
}

const getClasses = (event: APIGatewayProxyEvent) => {
    
}