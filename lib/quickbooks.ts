// Use dynamic import to prevent intuit-oauth from being loaded at build time
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let oauthClientInstance: any = null

export async function getOAuthClient() {
  if (!oauthClientInstance) {
    if (!process.env.QUICKBOOKS_CLIENT_ID || !process.env.QUICKBOOKS_CLIENT_SECRET) {
      throw new Error('QuickBooks credentials not configured')
    }
    // @ts-expect-error intuit-oauth has no type declarations
    const OAuthClient = (await import('intuit-oauth')).default
    oauthClientInstance = new OAuthClient({
      clientId: process.env.QUICKBOOKS_CLIENT_ID,
      clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET,
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
      redirectUri: process.env.QUICKBOOKS_REDIRECT_URI || '',
    })
  }
  return oauthClientInstance
}

export function getQuickBooksClient(accessToken: string, realmId: string) {
  return {
    accessToken,
    realmId,
    baseUrl: process.env.NODE_ENV === 'production'
      ? 'https://quickbooks.api.intuit.com'
      : 'https://sandbox-quickbooks.api.intuit.com',
  }
}

export async function refreshQuickBooksToken(refreshToken: string) {
  const client = await getOAuthClient()
  const authResponse = await client.refreshUsingToken(refreshToken)
  return authResponse.getJson()
}

export async function makeQuickBooksRequest(
  accessToken: string,
  realmId: string,
  endpoint: string
) {
  const baseUrl = process.env.NODE_ENV === 'production'
    ? 'https://quickbooks.api.intuit.com'
    : 'https://sandbox-quickbooks.api.intuit.com'

  const response = await fetch(`${baseUrl}/v3/company/${realmId}/${endpoint}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`QuickBooks API error: ${response.statusText}`)
  }

  return response.json()
}
