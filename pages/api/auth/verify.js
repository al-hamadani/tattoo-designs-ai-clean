import { verifyMagicToken, generateSessionToken, setSessionCookie } from '@/lib/auth.js'
import { getUserByEmail } from '@/lib/database.js'
import jwt from 'jsonwebtoken'
import { serialize } from 'cookie'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { token } = req.query

  if (!token) {
    return res.status(400).json({ message: 'Token required' })
  }

  try {
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.MAGIC_LINK_SECRET)
    
    // Get user
    const { data: user, error } = await getUserByEmail(decoded.email)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Set authentication cookie
    const sessionToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.NEXTAUTH_SECRET,
      { expiresIn: '7d' }
    )

    const cookie = serialize('auth-token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    })

    res.setHeader('Set-Cookie', cookie)

    // Redirect to success page or main app
    res.redirect(302, '/success?type=signin')
  } catch (error) {
    console.error('Verification error:', error)
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Magic link expired' })
    }
    
    res.status(500).json({ message: 'Verification failed' })
  }
} 