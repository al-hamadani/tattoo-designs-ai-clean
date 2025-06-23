import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function Success() {
  const router = useRouter()
  const [sessionId, setSessionId] = useState(null)
  const [userStatus, setUserStatus] = useState(null)

  useEffect(() => {
    const { session_id } = router.query
    setSessionId(session_id)
    
    // Check user status after a brief delay (webhook processing)
    if (session_id) {
      setTimeout(checkUserStatus, 3000)
    }
  }, [router.query])

  const checkUserStatus = async () => {
    try {
      const response = await fetch('/api/user/status')
      const status = await response.json()
      setUserStatus(status)
    } catch (error) {
      console.error('Failed to check user status:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🎉 Welcome to Pro!
          </h1>
          
          <p className="text-lg text-gray-600 mb-8">
            Your subscription is now active. Enjoy unlimited tattoo generations!
          </p>

          {userStatus && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-800 font-medium">
                Status: {userStatus.subscription === 'pro' ? '✅ Pro Active' : '⏳ Processing...'}
              </p>
              {userStatus.subscription === 'pro' && (
                <p className="text-green-600 text-sm mt-1">
                  You now have unlimited generations!
                </p>
              )}
            </div>
          )}
          
          <div className="space-y-4">
            <Link 
              href="/"
              className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
            >
              Start Generating Tattoos
            </Link>
            
            <div className="text-sm text-gray-500">
              {sessionId && (
                <p>Payment Session: {sessionId}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 