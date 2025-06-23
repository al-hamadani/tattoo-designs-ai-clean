import { generateMagicToken } from '../../../lib/auth.js'
import { sendMagicLink } from '../../../lib/email.js'
import { getUserByEmail, createUser } from '../../lib/database'
import jwt from 'jsonwebtoken'
import { sendMagicLinkEmail } from '../../lib/email'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email } = req.body

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email required' })
  }

  try {
    // Get or create user
    let { data: user, error } = await getUserByEmail(email)
    if (!user) {
      const createResult = await createUser(email)
      user = createResult.data
      
      if (createResult.error) {
        throw new Error('Failed to create user')
      }
    }

    // Generate magic link token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.MAGIC_LINK_SECRET,
      { expiresIn: '15m' }
    )
    
    // Send email (or log for development)
    const magicLink = `${process.env.NEXTAUTH_URL}/api/auth/verify?token=${token}`
    await sendMagicLinkEmail(email, magicLink)

    res.status(200).json({ 
      success: true, 
      message: 'Magic link sent to your email' 
    })
  } catch (error) {
    console.error('Magic link error:', error)
    res.status(500).json({ error: 'Failed to send magic link' })
  }
} 