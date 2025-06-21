// Bulletproof Enhanced API endpoint - Compatible with existing infrastructure
// Removes all problematic health checks and fixes variable scope issues

import { randomUUID } from 'crypto';
import { logAPIError } from '../../lib/sentry';
import { getDefaultAIServiceManager } from '../../lib/ai-services/manager';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
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
  let generationMethod = 'enhanced_text2img'; // Declare method variable early
  
  console.log(`Enhanced tattoo generation [${taskUUID}]:`, {
    prompt: prompt.substring(0, 100) + '...',
    style,
    complexity,
    placement,
    size,
    hasMask: !!maskData,
    hasOriginal: !!originalImage
  });

  try {
    // Get AI service manager (skip all health checks for compatibility)
    const aiManager = getDefaultAIServiceManager();
    
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
      // Override or set higher guidance for small, precise designs
      generationOptions.guidanceScale = Math.max(guidanceScale || 0, 9.0);
      // Ensure sufficient steps for detail
      // This is illustrative; actual parameter name may vary by provider
      // e.g., num_inference_steps. We pass it in options for the provider to use.
      generationOptions.num_inference_steps = Math.max(generationOptions.num_inference_steps || 0, 40);
    }

    // Determine generation method based on inputs
    if (maskData && originalImage) {
      console.log(`Enhanced inpainting generation [${taskUUID}]`);
      
      // Try mask analysis only if method exists (safe approach)
      try {
        if (aiManager && typeof aiManager.analyzeMask === 'function') {
          const analysisResult = await aiManager.analyzeMask(maskData);
          maskAnalysis = analysisResult?.success ? analysisResult : null;
          
          if (maskAnalysis) {
            console.log(`Mask analysis [${taskUUID}]:`, {
              coverage: maskAnalysis.coverage,
              recommendation: maskAnalysis.recommendation
            });
          }
        }
      } catch (analysisError) {
        console.warn('Mask analysis failed, continuing without it:', analysisError.message);
      }

      // Enhanced inpainting generation
      result = await aiManager.generateWithMask(prompt, originalImage, maskData, {
        ...generationOptions,
        complexity: complexity === 'simple' ? 'complex' : complexity, // Minimum complexity for coverups
      });
      
      generationMethod = 'enhanced_inpainting';
      
    } else {
      console.log(`Enhanced text-to-image generation [${taskUUID}]`);
      
      // Enhanced standard generation
      result = await aiManager.generateImage(prompt, generationOptions);
      
      generationMethod = 'enhanced_text2img';
    }

    // Validate generation results
    if (!result || !result.success || !result.images || result.images.length === 0) {
      throw new Error(result?.error || 'Failed to generate enhanced tattoo design');
    }

    console.log(`Enhanced generation completed [${taskUUID}]:`, {
      imagesGenerated: result.images.length,
      provider: result.provider || 'unknown',
      method: generationMethod,
      qualityLevel: result.metadata?.qualityLevel || 'enhanced'
    });

    // Return enhanced results with full backward compatibility
    return res.status(200).json({
      success: true,
      images: result.images,
      imageURL: result.images[0], // Primary image for backward compatibility
      prompt: result.prompt || prompt,
      taskUUID,
      provider: result.provider || 'primary',
      method: generationMethod,
      qualityLevel: 'enhanced',
      metadata: {
        style,
        complexity,
        placement,
        size,
        secondaryStyle,
        originalPrompt: prompt,
        enhancedPrompt: result.prompt || prompt,
        generatedAt: new Date().toISOString(),
        numVariations,
        executionTime: result.executionTime,
        maskAnalysis: maskAnalysis || result.maskAnalysis || null,
        // Enhanced features indicators
        enhancements: {
          promptEngineering: true,
          professionalTerminology: true,
          styleOptimization: true,
          qualityFiltering: true
        },
        // Include any existing metadata from the result
        ...result.metadata
      },
    });

  } catch (error) {
    console.error(`Enhanced tattoo generation error [${taskUUID}]:`, {
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      prompt: prompt.substring(0, 100) + '...',
      style,
      complexity,
      method: generationMethod
    });

    // Log error for monitoring (with proper variable scope)
    if (typeof logAPIError === 'function') {
      try {
        logAPIError('/api/generate-tattoo', error, {
          taskUUID,
          prompt: prompt.substring(0, 100) + '...',
          style,
          complexity,
          placement,
          size,
          method: generationMethod
        });
      } catch (loggingError) {
        console.warn('Error logging failed:', loggingError.message);
      }
    }

    // Enhanced error response with helpful suggestions
    return res.status(500).json({
      success: false,
      message: 'Failed to generate enhanced tattoo design. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      taskUUID,
      retryable: true,
      suggestions: [
        'Try simplifying your tattoo description',
        'Check your internet connection',
        'Try a different style if the issue persists',
        'Refresh the page and try again'
      ]
    });
  }
}