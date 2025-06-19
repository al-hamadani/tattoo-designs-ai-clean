// Enhanced API endpoint for professional-quality tattoo generation
// This replaces the existing /api/generate-tattoo.js with optimized settings

import { randomUUID } from 'crypto';
import { logAPIError } from '../../lib/sentry';
import { getDefaultAIServiceManager } from '../../lib/ai-services/manager';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { prompt, style, complexity, placement, size, originalImage, maskData, secondaryStyle } = req.body;

  if (!prompt) {
    return res.status(400).json({ message: 'Prompt is required' });
  }

  const aiManager = getDefaultAIServiceManager();
  const taskUUID = randomUUID();

  try {
    let result;
    let method = 'generateImage';
    let maskAnalysis = null;
    const { numVariations = 1 } = req.body;

    if (maskData) {
      if (!originalImage) {
        return res.status(400).json({ message: 'Original image is required for gap filler generation' });
      }
      // Analyze mask for shape/coverage
      const analysisResult = await aiManager.analyzeMask(maskData);
      maskAnalysis = analysisResult && analysisResult.success ? analysisResult : null;
      // Use mask-based generation
      result = await aiManager.generateWithMask(prompt, originalImage, maskData, { style, complexity, placement, size, secondaryStyle, numVariations });
      method = 'generateWithMask';
    } else {
      // Regular generation
      result = await aiManager.generateImage(prompt, { style, complexity, placement, size, secondaryStyle, numVariations });
    }

    if (!result.success || !result.images || result.images.length === 0) {
      throw new Error(result.error || 'No image data received from AI service');
    }

    return res.status(200).json({
      success: true,
      images: result.images,
      imageURL: result.images[0],
      prompt: result.prompt,
      taskUUID,
      provider: result.provider || 'replicate',
      method,
      metadata: {
        style,
        complexity,
        placement,
        size,
        secondaryStyle,
        originalPrompt: prompt,
        generatedAt: new Date().toISOString(),
        ...result.metadata,
        maskAnalysis: maskAnalysis || result.maskAnalysis || null
      },
    });
  } catch (error) {
    console.error('Tattoo generation error:', error);

    if (typeof logAPIError === 'function') {
      logAPIError('/api/generate-tattoo', error, {
        prompt,
        style,
        complexity,
        placement,
        size,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to generate tattoo design. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
}