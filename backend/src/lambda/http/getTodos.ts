import 'source-map-support/register'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { getUserTodos } from '../../businessLogic/todos'

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const authorization = event.headers.Authorization
  const split = authorization.split(' ')
  const jwtToken = split[1]

  const items = await getUserTodos(jwtToken);

  return {
    statusCode: 200,
    body: JSON.stringify({
      items: items
    })
  }
})

handler.use(
  cors({
    credentials: true
  })
)
