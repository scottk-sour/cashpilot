import { Resend } from 'resend'

// Lazy-load Resend to avoid errors at build time with placeholder API keys
let resendInstance: Resend | null = null

function getResend(): Resend {
  if (!resendInstance) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey || apiKey === 're_placeholder' || apiKey.startsWith('placeholder')) {
      throw new Error('Resend API key not configured')
    }
    resendInstance = new Resend(apiKey)
  }
  return resendInstance
}

export const resend = new Proxy({} as Resend, {
  get(_target, prop) {
    return getResend()[prop as keyof Resend]
  }
})

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
  try {
    const client = getResend()
    const { data, error } = await client.emails.send({
      from: 'CashPilot <alerts@cashpilot.app>',
      to,
      subject,
      html,
    })

    if (error) {
      console.error('Email send error:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Failed to send email:', error)
    throw error
  }
}
