import jwt from 'jsonwebtoken'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { email } = req.body

    if (!email || !email.includes('@')) {
      return res.status(400).json({ message: 'Valid email required' })
    }

    // Dynamic imports
    const { getUserByEmail, createUser } = await import('../../../lib/database')
    const { sendMagicLinkEmail } = await import('../../../lib/email')

    let { data: user, error } = await getUserByEmail(email)

    if (!user) {
      const createResult = await createUser(email)
      user = createResult.data
      
      if (createResult.error) {
        throw new Error('Failed to create user')
      }
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.MAGIC_LINK_SECRET,
      { expiresIn: '15m' }
    )
    
    const magicLink = `${process.env.NEXTAUTH_URL}/api/auth/verify?token=${token}`
    await sendMagicLinkEmail(email, magicLink)

    res.status(200).json({ 
      success: true, 
      message: 'Magic link sent to your email' 
    })
  } catch (error) {
    console.error('Magic link error:', error)
    res.status(500).json({ message: 'Failed to send magic link' })
  }
} 