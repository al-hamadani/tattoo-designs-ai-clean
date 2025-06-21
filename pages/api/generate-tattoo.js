// Complete fix for pages/api/generate-tattoo.js
// This wraps the entire handler in a try-catch to ensure JSON responses

import { randomUUID } from 'crypto';
import { logAPIError } from '../../lib/sentry';
import { getDefaultAIServiceManager } from '../../lib/ai-services/manager';

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
      gapFillerMode
    } = req.body;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ 
        success: false,
        message: 'Tattoo description is required' 
      });
    }

    const taskUUID = randomUUID();
    let generationMethod = 'enhanced_text2img';
    
    console.log(`Enhanced tattoo generation [${taskUUID}]:`, {
      prompt: prompt.substring(0, 100) + '...',
      style,
      complexity,
      placement,
      size,
      hasMask: !!maskData,
      hasOriginal: !!originalImage,
      gapFillerMode
    });

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
      console.log(`Gap Filler Mode optimizations enabled [${taskUUID}]`);
      generationOptions.guidanceScale = Math.max(guidanceScale || 0, 9.0);
      generationOptions.num_inference_steps = 40;
    }

    // Determine generation method based on inputs
    if (maskData && originalImage) {
      console.log(`Enhanced inpainting generation [${taskUUID}]`);
      generationMethod = 'enhanced_inpainting';
      
      // Safe mask analysis
      try {
        if (aiManager && typeof aiManager.analyzeMask === 'function') {
          const analysisResult = await aiManager.analyzeMask(maskData);
          maskAnalysis = analysisResult?.success ? analysisResult.analysis : null;
        }
      } catch (maskError) {
        console.warn('Mask analysis failed, continuing without it:', maskError);
      }
      
      // Generate with mask (inpainting)
      result = await aiManager.generateWithMask(
        prompt,
        originalImage,
        maskData,
        generationOptions
      );
      
    } else {
      // Standard generation
      console.log(`Enhanced text-to-image generation [${taskUUID}]`);
      result = await aiManager.generateImage(prompt, generationOptions);
    }

    // Validate result
    if (!result || !result.success) {
      throw new Error(result?.error || 'Generation failed - no result returned');
    }

    if (!result.images || result.images.length === 0) {
      throw new Error('No images generated - please try different parameters');
    }

    // Return successful response
    return res.status(200).json({
      success: true,
      images: result.images,
      imageURL: result.images[0], // Backward compatibility
      metadata: {
        taskId: taskUUID,
        method: generationMethod,
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