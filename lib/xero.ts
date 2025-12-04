import { XeroClient } from 'xero-node'

const XERO_SCOPES = 'openid profile email accounting.transactions.read offline_access'.split(' ')

// Lazy-load the Xero client to avoid errors at build time
let xeroInstance: XeroClient | null = null

export function getXero(): XeroClient {
  if (!xeroInstance) {
    if (!process.env.XERO_CLIENT_ID || !process.env.XERO_CLIENT_SECRET) {
      throw new Error('Xero credentials not configured')
    }
    xeroInstance = new XeroClient({
      clientId: process.env.XERO_CLIENT_ID,
      clientSecret: process.env.XERO_CLIENT_SECRET,
      redirectUris: [process.env.XERO_REDIRECT_URI || ''],
      scopes: XERO_SCOPES,
    })
  }
  return xeroInstance
}

// Backwards compatibility - deprecated, use getXero() instead
export const xero = new Proxy({} as XeroClient, {
  get(_target, prop) {
    return getXero()[prop as keyof XeroClient]
  }
})

export async function getXeroClient(accessToken: string, refreshToken: string) {
  if (!process.env.XERO_CLIENT_ID || !process.env.XERO_CLIENT_SECRET) {
    throw new Error('Xero credentials not configured')
  }

  const client = new XeroClient({
    clientId: process.env.XERO_CLIENT_ID,
    clientSecret: process.env.XERO_CLIENT_SECRET,
    redirectUris: [process.env.XERO_REDIRECT_URI || ''],
    scopes: XERO_SCOPES,
  })

  client.setTokenSet({
    access_token: accessToken,
    refresh_token: refreshToken,
  })

  return client
}
