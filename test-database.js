import { getUserByEmail, createUser, logGeneration, getUserGenerationsToday } from './lib/supabase.js'

async function testDatabaseConnection() {
  console.log('🧪 Testing database connection...')
  
  try {
    // Test 1: Get existing user
    console.log('\n1. Testing getUserByEmail...')
    const existingUser = await getUserByEmail('test@example.com')
    console.log('✅ Found user:', existingUser ? existingUser.email : 'Not found')
    
    // Test 2: Create new user (or skip if exists)
    console.log('\n2. Testing createUser...')
    let testUser = existingUser
    if (!testUser) {
      testUser = await createUser('test2@example.com')
      console.log('✅ Created user:', testUser.email)
    } else {
      console.log('✅ User already exists, skipping creation')
    }
    
    // Test 3: Check current generations
    console.log('\n3. Testing getUserGenerationsToday...')
    const currentGens = await getUserGenerationsToday(testUser.id)
    console.log('✅ Current generations today:', currentGens)
    
    // Test 4: Log a generation (uses SQL function!)
    console.log('\n4. Testing logGeneration with SQL function...')
    await logGeneration(testUser.id, 'test-session-123')
    console.log('✅ Logged generation successfully')
    
    // Test 5: Check updated count
    console.log('\n5. Testing updated count...')
    const newGens = await getUserGenerationsToday(testUser.id)
    console.log('✅ Updated generations today:', newGens)
    console.log(`✅ Increment worked: ${currentGens} → ${newGens}`)
    
    console.log('\n🎉 All tests passed! Database with SQL function is working!')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error('Full error:', error)
  }
}

testDatabaseConnection() 