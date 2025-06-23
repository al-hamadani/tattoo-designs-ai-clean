import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

// Database helper functions
export async function getUserByEmail(email) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single()
  
  if (error && error.code !== 'PGRST116') throw error
  return data
}

export async function createUser(email) {
  const { data, error } = await supabase
    .from('users')
    .insert([{ email }])
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function getUserById(id) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data
}

export async function updateUserSubscription(userId, status, endDate = null) {
  const { data, error } = await supabase
    .from('users')
    .update({ 
      subscription_status: status,
      subscription_end_date: endDate
    })
    .eq('id', userId)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function logGeneration(userId, sessionId = null) {
  // Log the generation
  const { error } = await supabase
    .from('generation_logs')
    .insert([{ user_id: userId, session_id: sessionId }])
  
  if (error) throw error
  
  // Use the SQL function we just created!
  if (userId) {
    const { error: fnError } = await supabase.rpc('increment_daily_generations', {
      user_id: userId
    })
    if (fnError) throw fnError
  }
}

export async function getUserGenerationsToday(userId) {
  const user = await getUserById(userId)
  if (!user) return 0
  
  const today = new Date().toISOString().split('T')[0]
  const lastReset = new Date(user.last_generation_reset).toISOString().split('T')[0]
  
  // If last reset was before today, they have 0 generations today
  if (lastReset < today) {
    return 0
  }
  
  return user.generations_today || 0
} 