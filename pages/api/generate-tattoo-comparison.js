import { randomUUID } from 'crypto';
import { logAPIError } from '../../lib/sentry';
import { getDefaultAIServiceManager } from '../../lib/ai-services/manager';
import { buildTattooPrompt, truncateToTokenLimit } from '../../lib/promptBuilder';

// CRITICAL: Export maxDuration at module level for Vercel
export const config = {
  maxDuration: 120, // 120 seconds timeout for dual generation
};

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
      secondaryStyle = 'none',
      numVariations = 1,
      guidanceScale
    } = req.body;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ 
        success: false,
        message: 'Tattoo description is required' 
      });
    }

    const taskUUID = randomUUID();
    
    // console.log(`Tattoo comparison generation [${taskUUID}]:`, {
    //   prompt: prompt.substring(0, 100) + '...',
    //   style,
    //   complexity,
    //   placement,
    //   size
    // });

    // Get AI service manager
    const aiManager = getDefaultAIServiceManager();
    
    if (!aiManager) {
      throw new Error('AI service manager not available');
    }

    // Get the Replicate service directly for Fresh Ink model access
    const replicateService = aiManager.primaryService;
    if (!replicateService || !replicateService.generateWithFreshInk) {
      throw new Error('Fresh Ink model not available');
    }
    
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

    // Generate enhanced prompt for comparison
    const enhancedPrompt = buildTattooPrompt(prompt, style, 'generate', {
      complexity,
      placement,
      size,
      secondaryStyle,
    });

    // Truncate prompt for Fresh Ink model
    const truncatedPrompt = truncateToTokenLimit(enhancedPrompt, 77);

    // Generate with both models simultaneously
    const [standardResult, freshInkResult] = await Promise.allSettled([
      aiManager.generateImage(prompt, generationOptions),
      replicateService.generateWithFreshInk(prompt, generationOptions)
    ]);

    // Process results
    const results = {
      standard: {
        success: standardResult.status === 'fulfilled' && standardResult.value.success,
        images: standardResult.status === 'fulfilled' ? standardResult.value.images : [],
        error: standardResult.status === 'rejected' ? standardResult.reason.message : 
               (standardResult.value?.error || null),
        prompt: enhancedPrompt,
        promptLength: enhancedPrompt.split(/\s+/).length,
        model: 'standard'
      },
      freshInk: {
        success: freshInkResult.status === 'fulfilled' && freshInkResult.value.success,
        images: freshInkResult.status === 'fulfilled' ? freshInkResult.value.images : [],
        error: freshInkResult.status === 'rejected' ? freshInkResult.reason.message : 
               (freshInkResult.value?.error || null),
        prompt: truncatedPrompt,
        originalPrompt: enhancedPrompt,
        promptLength: truncatedPrompt.split(/\s+/).length,
        originalPromptLength: enhancedPrompt.split(/\s+/).length,
        model: 'freshInk'
      }
    };

    // Calculate prompt differences
    const promptAnalysis = {
      standardPromptLength: results.standard.promptLength,
      freshInkPromptLength: results.freshInk.promptLength,
      tokensRemoved: results.standard.promptLength - results.freshInk.promptLength,
      truncationPercentage: Math.round((results.freshInk.promptLength / results.standard.promptLength) * 100),
      promptDifference: enhancedPrompt.length - truncatedPrompt.length
    };

    // Check if at least one generation succeeded
    const hasSuccessfulGeneration = results.standard.success || results.freshInk.success;
    
    if (!hasSuccessfulGeneration) {
      throw new Error('Both models failed to generate images. Please try again.');
    }

    // Return successful response
    return res.status(200).json({
      success: true,
      results,
      promptAnalysis,
      metadata: {
        taskId: taskUUID,
        method: 'comparison',
        style,
        complexity,
        placement,
        size,
        timestamp: new Date().toISOString(),
        models: {
          standard: 'SDXL Tattoo Model',
          freshInk: 'Fresh Ink SDXL Model'
        }
      }
    });

  } catch (error) {
    // Log error for debugging
    console.error('Tattoo comparison generation error:', error);
    
    // Log to Sentry if available
    if (typeof logAPIError === 'function') {
      logAPIError(error, req, {
        endpoint: '/api/generate-tattoo-comparison',
        method: req.method,
        body: req.body
      });
    }

    // Always return JSON error response
    return res.status(500).json({
      success: false,
      message: 'Failed to generate tattoo comparison',
      error: error.message || 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 