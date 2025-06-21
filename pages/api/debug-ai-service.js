// Add this temporary debug endpoint: pages/api/debug-ai-service.js
// This will help identify the exact issue with AI service initialization

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const debugInfo = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    hasRunwareKey: !!process.env.RUNWARE_API_KEY,
    keyPrefix: process.env.RUNWARE_API_KEY ? process.env.RUNWARE_API_KEY.substring(0, 8) + '...' : 'NOT_SET'
  };

  try {
    // Test import
    const { getDefaultAIServiceManager } = await import('../../lib/ai-services/manager');
    debugInfo.managerImported = true;

    // Test manager creation
    const manager = getDefaultAIServiceManager();
    debugInfo.managerCreated = !!manager;
    
    if (manager) {
      debugInfo.managerType = typeof manager;
      debugInfo.availableMethods = Object.keys(manager).filter(key => typeof manager[key] === 'function');
    }

    return res.status(200).json({
      success: true,
      debug: debugInfo
    });

  } catch (error) {
    return res.status(200).json({
      success: false,
      debug: debugInfo,
      error: {
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    });
  }
} 