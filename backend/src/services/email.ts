import { Resend } from 'resend'

let client: Resend | null = null

function getClient(): Resend | null {
  const key = process.env['RESEND_API_KEY']
  if (!key) return null
  if (!client) client = new Resend(key)
  return client
}

const from = () => process.env['EMAIL_FROM'] ?? 'noreply@yourdomain.com'

function baseTemplate(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#0f1117;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1117;padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:520px;background:#1a1d27;border:1px solid #2a2d3a;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="padding:32px 40px 24px;border-bottom:1px solid #2a2d3a;">
              <p style="margin:0;font-size:20px;font-weight:700;color:#e2e8f0;letter-spacing:-0.3px;">SchedulerAI</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #2a2d3a;">
              <p style="margin:0;font-size:12px;color:#64748b;">
                If you didn't request this email, you can safely ignore it.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export async function sendVerificationEmail(
  to: string,
  displayName: string,
  token: string,
): Promise<void> {
  const resend = getClient()
  if (!resend) {
    console.warn('RESEND_API_KEY not set — skipping verification email')
    return
  }

  const backendUrl = process.env['BACKEND_URL'] ?? 'http://localhost:3001'
  const link = `${backendUrl}/api/auth/verify-email?token=${token}`

  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#e2e8f0;">Verify your email</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#94a3b8;line-height:1.6;">
      Hi ${displayName}, thanks for signing up. Click the button below to verify your email address and activate your SchedulerAI account.
    </p>
    <a href="${link}" style="display:inline-block;padding:12px 28px;background:#6366f1;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;">
      Verify email address
    </a>
    <p style="margin:24px 0 0;font-size:13px;color:#64748b;line-height:1.6;">
      Or copy this link into your browser:<br />
      <span style="color:#818cf8;word-break:break-all;">${link}</span>
    </p>
    <p style="margin:16px 0 0;font-size:13px;color:#64748b;">This link expires in 24 hours.</p>
  `

  await resend.emails.send({
    from: from(),
    to,
    subject: 'Verify your SchedulerAI account',
    html: baseTemplate('Verify your SchedulerAI account', body),
  })
}

export async function sendPasswordResetEmail(
  to: string,
  displayName: string,
  token: string,
): Promise<void> {
  const resend = getClient()
  if (!resend) {
    console.warn('RESEND_API_KEY not set — skipping password reset email')
    return
  }

  const frontendUrl = process.env['FRONTEND_URL'] ?? 'http://localhost:5173'
  const link = `${frontendUrl}/reset-password?token=${token}`

  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#e2e8f0;">Reset your password</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#94a3b8;line-height:1.6;">
      Hi ${displayName}, we received a request to reset your SchedulerAI password. Click the button below to choose a new one.
    </p>
    <a href="${link}" style="display:inline-block;padding:12px 28px;background:#6366f1;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;">
      Reset password
    </a>
    <p style="margin:24px 0 0;font-size:13px;color:#64748b;line-height:1.6;">
      Or copy this link into your browser:<br />
      <span style="color:#818cf8;word-break:break-all;">${link}</span>
    </p>
    <p style="margin:16px 0 0;font-size:13px;color:#64748b;">This link expires in 1 hour. If you didn't request a password reset, no action is needed.</p>
  `

  await resend.emails.send({
    from: from(),
    to,
    subject: 'Reset your SchedulerAI password',
    html: baseTemplate('Reset your SchedulerAI password', body),
  })
}
