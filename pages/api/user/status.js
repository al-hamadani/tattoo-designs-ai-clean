import { getUserByEmail } from '../../lib/database';
import jwt from 'jsonwebtoken'
import { parse } from 'cookie'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const cookies = parse(req.headers.cookie || '')
    const token = cookies['auth-token']

    if (!token) {
      return res.status(200).json({
        isAuthenticated: false,
        subscription: 'free',
        generationsToday: 0,
        generationsRemaining: 1 // Anonymous users get 1 generation
      })
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET)
    
    // REPLACE: Direct supabase call
    // OLD: const { data: user } = await supabase.from('users').select('*').eq('email', decoded.email).single();
    // NEW: Use environment-aware function
    const { data: user, error } = await getUserByEmail(decoded.email)

    if (!user) {
      return res.status(200).json({
        isAuthenticated: false,
        subscription: 'free',
        generationsToday: 0,
        generationsRemaining: 1
      })
    }

    // Check if daily reset is needed
    const now = new Date()
    const lastReset = new Date(user.last_generation_reset)
    const isNewDay = now.getDate() !== lastReset.getDate() || 
                     now.getMonth() !== lastReset.getMonth() || 
                     now.getFullYear() !== lastReset.getFullYear()

    let generationsToday = user.generations_today
    if (isNewDay) {
      generationsToday = 0
      // Note: You might want to update the database here to reset the counter
    }

    const subscription = user.subscription_status || 'free'
    const maxGenerations = subscription === 'pro' ? 999 : 3
    const generationsRemaining = Math.max(0, maxGenerations - generationsToday)

    res.status(200).json({
      isAuthenticated: true,
      subscription,
      generationsToday,
      generationsRemaining,
      user: {
        id: user.id,
        email: user.email
      }
    })
  } catch (error) {
    console.error('User status error:', error)
    
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      return res.status(200).json({
        isAuthenticated: false,
        subscription: 'free',
        generationsToday: 0,
        generationsRemaining: 1
      })
    }

    res.status(500).json({ message: 'Failed to get user status' })
  }
} 