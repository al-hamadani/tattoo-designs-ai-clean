import jwt from 'jsonwebtoken'
import { serialize } from 'cookie'
import { getUserByEmail, createUser, getUserById } from './supabase.js'

const JWT_SECRET = process.env.MAGIC_LINK_SECRET

export function generateMagicToken(email) {
  return jwt.sign(
    { email, type: 'magic-link' },
    JWT_SECRET,
    { expiresIn: '15m' }
  )
}

export function verifyMagicToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}

export function generateSessionToken(userId) {
  return jwt.sign(
    { userId, type: 'session' },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

export function verifySessionToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}

export function setSessionCookie(res, token) {
  const cookie = serialize('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/'
  })
  
  res.setHeader('Set-Cookie', cookie)
}

export function clearSessionCookie(res) {
  const cookie = serialize('session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: -1,
    path: '/'
  })
  
  res.setHeader('Set-Cookie', cookie)
}

export async function getCurrentUser(req) {
  const token = req.cookies.session
  if (!token) return null
  
  const payload = verifySessionToken(token)
  if (!payload) return null
  
  try {
    return await getUserById(payload.userId)
  } catch (error) {
    return null
  }
} 