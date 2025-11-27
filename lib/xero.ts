import { XeroClient } from 'xero-node'

// Lazy initialize to avoid build-time errors when env vars aren't set
let xeroInstance: XeroClient | null = null
let initError: Error | null = null

function getXeroConfig() {
  const clientId = process.env.XERO_CLIENT_ID
  const clientSecret = process.env.XERO_CLIENT_SECRET
  const redirectUri = process.env.XERO_REDIRECT_URI

  // Check if we're in a build context (no credentials available)
  if (!clientId || !clientSecret || !redirectUri) {
    return null
  }

  return {
    clientId,
    clientSecret,
    redirectUris: [redirectUri],
    scopes: 'openid profile email accounting.transactions.read offline_access'.split(' '),
  }
}

export function getXeroInstance(): XeroClient {
  // If we already tried and failed, throw the cached error
  if (initError) {
    throw initError
  }

  // If already initialized, return it
  if (xeroInstance) {
    return xeroInstance
  }

  // Try to initialize
  const config = getXeroConfig()

  if (!config) {
    const error = new Error('Xero environment variables (XERO_CLIENT_ID, XERO_CLIENT_SECRET, XERO_REDIRECT_URI) are not set')
    initError = error
    throw error
  }

  try {
    xeroInstance = new XeroClient(config)
    return xeroInstance
  } catch (error) {
    initError = error as Error
    throw error
  }
}

export const xero = getXeroInstance

export async function getXeroClient(accessToken: string, refreshToken: string) {
  const config = getXeroConfig()

  if (!config) {
    throw new Error('Xero environment variables (XERO_CLIENT_ID, XERO_CLIENT_SECRET, XERO_REDIRECT_URI) are not set')
  }

  const client = new XeroClient(config)

  client.setTokenSet({
    access_token: accessToken,
    refresh_token: refreshToken,
  })

  return client
}
