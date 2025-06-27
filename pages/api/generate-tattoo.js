// Complete fix for pages/api/generate-tattoo.js
// This wraps the entire handler in a try-catch to ensure JSON responses

import { randomUUID } from 'crypto';
import { logAPIError } from '../../lib/sentry';
import { getDefaultAIServiceManager } from '../../lib/ai-services/manager';
import { getUserByEmail } from '@/lib/database.js' 
import { supabase } from '../../lib/supabase';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';

// Add these imports at the TOP of your generate-tattoo.js file
import { getCurrentUser } from '../../lib/auth.js'
import { getUserGenerationsToday, logGeneration } from '../../lib/supabase.js'

// CRITICAL: Export maxDuration at module level for Vercel
export const config = {
  maxDuration: 60, // 60 seconds timeout
};

// Alternative syntax if using newer Next.js:
// export const maxDuration = 60;

export default async function handler(req, res) {
  // Global error boundary
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ 
        success: false,
        message: 'Method not allowed' 
      });
    }

    // RATE LIMITING SECTION - UPDATE THIS PART
    const cookies = parse(req.headers.cookie || '');
    const token = cookies['auth-token'];
    let user = null;
    let isAuthenticated = false;

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET);
        
        // REPLACE: Direct supabase call
        // OLD: const { data: userData } = await supabase.from('users').select('*').eq('email', decoded.email).single();
        // NEW: Use environment-aware function
        const { data: userData, error } = await getUserByEmail(decoded.email);
        
        if (userData) {
          user = userData;
          isAuthenticated = true;
        }
      } catch (error) {
        console.error('Token verification failed:', error);
      }
    }

    // Check rate limits
    if (isAuthenticated && user) {
      // Authenticated user rate limiting
      const now = new Date();
      const lastReset = new Date(user.last_generation_reset);
      const isNewDay = now.getDate() !== lastReset.getDate() || 
                       now.getMonth() !== lastReset.getMonth() || 
                       now.getFullYear() !== lastReset.getFullYear();

      let generationsToday = user.generations_today;
      
      // Reset daily counter if needed
      if (isNewDay) {
        const env = process.env.ENVIRONMENT || 'development';
        const prefixedEmail = env === 'staging' ? `staging_${user.email}` : user.email;
        
        await supabase
          .from('users')
          .update({
            generations_today: 0,
            last_generation_reset: now
          })
          .eq('email', prefixedEmail);
        
        generationsToday = 0;
      }

      // Check subscription limits
      const subscription = user.subscription_status || 'free';
      const maxGenerations = subscription === 'pro' ? 999999 : 3;

      if (generationsToday >= maxGenerations) {
        return res.status(403).json({
          success: false,
          message: 'Daily generation limit reached. Upgrade to Pro for unlimited generations.',
          upgradeUrl: '/pricing',
          generationsToday,
          maxGenerations
        });
      }
    } else {
      // Anonymous user - limit to 1 generation (implement your existing logic here)
      // This depends on how you're currently tracking anonymous users
    }

    const { 
      prompt, 
      negativePrompt,
      style = 'traditional', 
      complexity = 'medium', 
      placement = 'generic', 
      size = 'medium', 
      originalImage, 
      maskData, 
      secondaryStyle = 'none',
      numVariations = 1,
      guidanceScale,
      gapFillerMode,
      model = 'standard',
      useDimensionGeneration,
    } = req.body;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ 
        success: false,
        message: 'Tattoo description is required' 
      });
    }

    const taskUUID = randomUUID();
    let generationMethod = 'enhanced_text2img';
    
    // console.log(`Enhanced tattoo generation [${taskUUID}]:`, {
    //   prompt: prompt.substring(0, 100) + '...',
    //   style,
    //   complexity,
    //   placement,
    //   size,
    //   hasMask: !!maskData,
    //   hasOriginal: !!originalImage,
    //   gapFillerMode
    // });

    // Get AI service manager
    const aiManager = getDefaultAIServiceManager();
    
    if (!aiManager) {
      throw new Error('AI service manager not available');
    }
    
    let result;
    let maskAnalysis = null;
    
    // Build generation options
    const generationOptions = {
      style,
      complexity,
      placement,
      size,
      secondaryStyle,
      numVariations,
      negativePrompt,
      guidanceScale,
    };

    // Gap filler specific optimizations
    if (gapFillerMode) {
      // console.log(`Gap Filler Mode optimizations enabled [${taskUUID}]`);
      generationOptions.guidanceScale = Math.max(guidanceScale || 0, 9.0);
      generationOptions.num_inference_steps = 40;
    }

    // Determine generation method based on inputs
    if (maskData && originalImage) {
      // console.log(`Enhanced inpainting generation [${taskUUID}]`);
      generationMethod = 'enhanced_inpainting';
      
      // Safe mask analysis
      try {
        if (aiManager && typeof aiManager.analyzeMask === 'function') {
          const analysisResult = await aiManager.analyzeMask(maskData);
          maskAnalysis = analysisResult?.success ? analysisResult.analysis : null;
        }
      } catch (maskError) {
        // console.warn('Mask analysis failed, continuing without it:', maskError);
      }
      
      // Generate with mask (inpainting)
      result = await aiManager.generateWithMask(
        prompt,
        originalImage,
        maskData,
        generationOptions
      );
      
    } else {
      // Standard generation or Fresh Ink model
      if (model === 'freshInk') {
        // console.log(`Fresh Ink model generation [${taskUUID}]`);
        generationMethod = 'fresh_ink_generation';
        
        // Get the Replicate service directly for Fresh Ink model access
        const replicateService = aiManager.primaryService;
        if (!replicateService || !replicateService.generateWithFreshInk) {
          throw new Error('Fresh Ink model not available');
        }
        
        result = await replicateService.generateWithFreshInk(prompt, generationOptions);
      } else {
        // console.log(`Enhanced text-to-image generation [${taskUUID}]`);
        generationMethod = 'enhanced_text2img';
        result = await aiManager.generateImage(prompt, generationOptions);
      }
    }

    // Validate result
    if (!result || !result.success) {
      throw new Error(result?.error || 'Generation failed - no result returned');
    }

    if (!result.images || result.images.length === 0) {
      throw new Error('No images generated - please try different parameters');
    }

    // AFTER SUCCESSFUL GENERATION - UPDATE COUNTER
    if (isAuthenticated && user) {
      const env = process.env.ENVIRONMENT || 'development';
      const prefixedEmail = env === 'staging' ? `staging_${user.email}` : user.email;
      
      await supabase
        .from('users')
        .update({
          generations_today: (user.generations_today || 0) + 1
        })
        .eq('email', prefixedEmail);

      // Log generation
      await supabase
        .from('generation_logs')
        .insert([{
          user_id: user.id,
          created_at: new Date()
        }]);
    }

    // Return successful response
    return res.status(200).json({
      success: true,
      images: result.images,
      imageURL: result.images[0], // Backward compatibility
      metadata: {
        taskId: taskUUID,
        method: generationMethod,
        model: model,
        style,
        complexity,
        placement,
        size,
        maskAnalysis,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    // Log error for debugging
    console.error('Tattoo generation error:', error);
    
    // Log to Sentry if available
    if (typeof logAPIError === 'function') {
      logAPIError(error, req, {
        endpoint: '/api/generate-tattoo',
        method: req.method,
        body: req.body
      });
    }

    // Always return JSON error response
    return res.status(500).json({
      success: false,
      message: 'Failed to generate tattoo design',
      error: error.message || 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}