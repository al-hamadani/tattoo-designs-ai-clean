import nodemailer from 'nodemailer'

// For development/testing - we'll use a simple console log
// In production, you'll use Gmail, SendGrid, or another email service
const transporter = process.env.SMTP_USER ? nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
}) : null

export async function sendMagicLink(email, token) {
  const magicLink = `${process.env.NEXTAUTH_URL}/api/auth/verify?token=${token}`
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Sign in to TattooDesignsAI</h2>
      <p>Click the button below to sign in to your account:</p>
      <a href="${magicLink}" 
         style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; 
                font-weight: bold; margin: 20px 0;">
        Sign In to TattooDesignsAI
      </a>
      <p style="color: #666; font-size: 14px;">
        This link will expire in 15 minutes. If you didn't request this, please ignore this email.
      </p>
      <p style="color: #666; font-size: 12px;">
        Or copy this link: ${magicLink}
      </p>
    </div>
  `
  
  // For development - just log the magic link
  if (!transporter) {
    console.log('\n🔗 MAGIC LINK (for testing):')
    console.log(`📧 Email: ${email}`)
    console.log(`🔑 Link: ${magicLink}`)
    console.log('📝 Copy this link to your browser to sign in\n')
    return
  }
  
  // For production - send actual email
  try {
    await transporter.sendMail({
      from: `"TattooDesignsAI" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Sign in to TattooDesignsAI',
      html: htmlContent
    })
    console.log(`✅ Magic link sent to ${email}`)
  } catch (error) {
    console.error('❌ Failed to send email:', error.message)
    throw error
  }
} 