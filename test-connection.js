const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://fnbkjxnjshuwtbqghtzo.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuYmtqeG5qc2h1d3RicWdodHpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1MjcwMDQsImV4cCI6MjA2NjEwMzAwNH0.ENbeeSpZHbG0pLQak91DYU0gCRltWhpyb__zSuWw-8k'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testDatabaseConnection() {
  console.log('🧪 Testing database connection...')
  
  try {
    // Test 1: Simple connection test
    console.log('\n1. Testing basic connection...')
    const { data, error } = await supabase
      .from('users')
      .select('id, email, subscription_status')
      .limit(1)
    
    if (error) throw error
    console.log('✅ Connected successfully! Sample data:', data)
    
    // Test 2: Try to get existing test user
    console.log('\n2. Testing getUserByEmail...')
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'test@example.com')
      .single()
    
    if (userError && userError.code !== 'PGRST116') throw userError
    console.log('✅ Found  user:', existingUser ? existingUser.email : 'Not found')
    
    // Test 3: Create new user if needed
    console.log('\n3. Testing createUser...')
    let testUser = existingUser
    if (!testUser) {
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([{ email: 'test@example.com' }])
        .select()
        .single()
      
      if (createError) throw createError
      testUser = newUser
      console.log('✅ Created user:', testUser.email)
    } else {
      console.log('✅ User already exists, skipping creation')
    }
    
    // Test 4: Test generation logging
    console.log('\n4. Testing generation logging...')
    const { error: logError } = await supabase
      .from('generation_logs')
      .insert([{ user_id: testUser.id, session_id: 'test-session-123' }])
    
    if (logError) throw logError
    console.log('✅ Logged generation successfully')
    
    // Test 5: Test SQL function
    console.log('\n5. Testing SQL function...')
    const { error: rpcError } = await supabase.rpc('increment_daily_generations', {
      user_id: testUser.id
    })
    
    if (rpcError) throw rpcError
    console.log('✅ SQL function executed successfully')
    
    // Test 6: Check final result
    console.log('\n6. Testing final user state...')
    const { data: finalUser, error: finalError } = await supabase
      .from('users')
      .select('email, generations_today, subscription_status')
      .eq('id', testUser.id)
      .single()
    
    if (finalError) throw finalError
    console.log('✅ Final user state:', finalUser)
    
    console.log('\n🎉 All tests passed! Database is ready!')
    console.log(`🎯 User has ${finalUser.generations_today} generations today`)
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error('Error code:', error.code)
    console.error('Full error:', error)
  }
}

testDatabaseConnection() 