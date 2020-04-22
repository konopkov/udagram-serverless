import 'source-map-support/register'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { getUploadUrl, getAttachmentUrl } from '../../dataLayer/s3Access'
import { updateAttachmentUrl } from '../../businessLogic/todos'

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const authorization = event.headers.Authorization
  const split = authorization.split(' ')
  const jwtToken = split[1]

  const todoId = event.pathParameters.todoId
  const uploadUrl = getUploadUrl(todoId)
  const attachmentUrl = getAttachmentUrl(todoId)

  await updateAttachmentUrl(todoId, attachmentUrl, jwtToken)

  return {
    statusCode: 201,
    body: JSON.stringify({
      uploadUrl: uploadUrl
    })
  }
})

handler.use(
  cors({
    credentials: true
  })
)
