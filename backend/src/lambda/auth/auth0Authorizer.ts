import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'

import { verify, decode } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'
import Axios from 'axios'
import { Jwt } from '../../auth/Jwt'
import { JwtPayload } from '../../auth/JwtPayload'

const logger = createLogger('auth')

// to verify JWT token signature.
// To get this URL you need to go to an Auth0 page -> Show Advanced Settings -> Endpoints -> JSON Web Key Set
const jwksUrl = 'https://dev-clt6a2wv.auth0.com/.well-known/jwks.json'

export const handler = async (
  event: CustomAuthorizerEvent
): Promise<CustomAuthorizerResult> => {
  logger.info('Authorizing a user', event.authorizationToken)
  try {
    const jwtToken = await verifyToken(event.authorizationToken)
    logger.info('User was authorized', jwtToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

// https://auth0.com/blog/navigating-rs256-and-jwks/
// https://github.com/sgmeyer/auth0-node-jwks-rs256/blob/master/src/lib/utils.js
function certToPEM(cert) {
  cert = cert.match(/.{1,64}/g).join('\n');
  cert = `-----BEGIN CERTIFICATE-----\n${cert}\n-----END CERTIFICATE-----\n`;
  return cert;
}

async function verifyToken(authHeader: string): Promise<JwtPayload> {
  const token = getToken(authHeader)
  logger.info('token', {token})
  const jwt: Jwt = decode(token, { complete: true }) as Jwt
  logger.info('jwt', {jwt})

  // You should implement it similarly to how it was implemented for the exercise for the lesson 5
  // You can read more about how to do this here: https://auth0.com/blog/navigating-rs256-and-jwks/

  const response = await Axios(jwksUrl);
  const keys = response.data.keys;
  logger.info('keys', {keys})

  if (!keys || !keys.length) {
    throw new Error('The JWKS endpoint did not contain any keys');
  }

  const signingKeys = keys
    .filter(key => key.use === 'sig' // JWK property `use` determines the JWK is for signing
      && key.kty === 'RSA' // We are only supporting RSA (RS256)
      && key.kid           // The `kid` must be present to be useful for later
      && ((key.x5c && key.x5c.length) || (key.n && key.e)) // Has useful public keys
    ).map(key => {
      return { kid: key.kid, nbf: key.nbf, publicKey: certToPEM(key.x5c[0]) };
    });

  logger.info('signingKeys', {signingKeys})

  // If at least one signing key doesn't exist we have a problem... Kaboom.
  if (!signingKeys.length) {
    throw new Error('The JWKS endpoint did not contain any signing keys');
  }

  const kid = jwt.header.kid;
  logger.info('kid', {kid})

  const signingKey = signingKeys.find(key => key.kid === kid);
  logger.info('signingKey', {signingKey})

  if (!signingKey) {
    throw new Error(`Unable to find a signing key that matches '${kid}'`);
  }

  return verify(token, signingKey.publicKey) as JwtPayload;
}

function getToken(authHeader: string): string {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  return split[1]
}
