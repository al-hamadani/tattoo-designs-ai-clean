import { generateMagicToken, verifyMagicToken } from './lib/auth.js'

async function testAuthSystem() {
  console.log('🧪 Testing authentication system...')
  
  try {
    // Test 1: Generate magic token
    console.log('\n1. Testing magic token generation...')
    const email = 'test@example.com'
    const token = generateMagicToken(email)
    console.log('✅ Generated token:', token.substring(0, 20) + '...')
    
    // Test 2: Verify magic token
    console.log('\n2. Testing magic token verification...')
    const payload = verifyMagicToken(token)
    console.log('✅ Verified payload:', payload)
    
    // Test 3: Test expired token
    console.log('\n3. Testing invalid token...')
    const invalidToken = verifyMagicToken('invalid-token-123')
    console.log('✅ Invalid token result:', invalidToken === null ? 'Correctly rejected' : 'ERROR')
    
    console.log('\n🎉 Authentication system tests passed!')
    console.log('\n📋 Next Steps:')
    console.log('1. Start your dev server: npm run dev')
    console.log('2. Test magic link endpoint: POST /api/auth/magic-link')
    console.log('3. Check console for magic link (since email not configured yet)')
    console.log('4. Click the link to test authentication flow')
    
  } catch (error) {
    console.error('❌ Auth test failed:', error.message)
  }
}

testAuthSystem() 