// Use dynamic import to prevent Resend from being loaded at build time
let resendInstance: InstanceType<typeof import('resend').Resend> | null = null

async function getResend() {
  if (!resendInstance) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey || apiKey === 're_placeholder' || apiKey.startsWith('placeholder')) {
      throw new Error('Resend API key not configured')
    }
    const { Resend } = await import('resend')
    resendInstance = new Resend(apiKey)
  }
  return resendInstance
}

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
    const client = await getResend()
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
