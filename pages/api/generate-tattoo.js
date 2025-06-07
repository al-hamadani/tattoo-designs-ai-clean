import { randomUUID } from 'crypto';
// Import Sentry logger if available
import { logAPIError } from '../../lib/sentry';
// If you use Sentry directly, uncomment the following line and setup Sentry SDK
// import * as Sentry from '@sentry/nextjs';

// CHANGE 1: Add mask analysis utility function
function analyzeMaskData(maskData) {
  // Example mock implementation
  // In real scenarios, parse and analyze maskData appropriately
  const hasData = !!maskData && maskData.length > 0;
  const estimatedCoverage = 'medium'; // Could be calculated from actual data
  const shapeHint = 'irregular'; // Could be derived from contours or shape analysis

  return { hasData, estimatedCoverage, shapeHint };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // CHANGE 2: Accept maskData in the body
  const { prompt, style, complexity, placement, size, maskData } = req.body;

  if (!prompt) {
    return res.status(400).json({ message: 'Prompt is required' });
  }

  try {
    // CHANGE 3: Analyze mask if provided
    let maskAnalysis = null;
    if (maskData) {
      maskAnalysis = analyzeMaskData(maskData);
      console.log('Mask analysis:', maskAnalysis);
    }

    // Enhance the prompt
    let enhancedPrompt = prompt;
    enhancedPrompt += ', professional tattoo design, clean white background, high contrast black ink, stencil ready, tattoo art';

    // CHANGE 4: Add mask hints to prompt
    if (placement === 'custom-coverup') {
      enhancedPrompt = `${prompt}, heavy blackwork coverage design...`;

      if (maskAnalysis?.hasData) {
        enhancedPrompt += `, ${maskAnalysis.estimatedCoverage} coverage area, ${maskAnalysis.shapeHint} shape design`;
      }
    }

    const negativePrompt = 'blurry, low quality, colored background, text, watermark, signature, multiple tattoos, duplicate, copy';
    const taskUUID = randomUUID();

    console.log('Generating tattoo with enhanced prompt:', enhancedPrompt);
    console.log('Task UUID:', taskUUID);

    // CHANGE 5: Support for future mask usage
    const response = await fetch('https://api.runware.ai/v1', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RUNWARE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        {
          taskUUID,
          taskType: "imageInference",
          positivePrompt: enhancedPrompt,
          negativePrompt,
          width: 512,
          height: 512,
          model: "runware:100@1",
          numberResults: 1,
          CFGScale: 7.5,
          steps: 25,
          // Optionally future use: pass mask info
          // mask: maskData ? processMask(maskData) : undefined
        }
      ]),
    });

    console.log('API Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('API Error response:', errorText);
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('API Success response:', JSON.stringify(result, null, 2));

    if (result.errors && result.errors.length > 0) {
      throw new Error(`API Error: ${result.errors[0].message}`);
    }

    if (!result.data || !result.data[0] || !result.data[0].imageURL) {
      throw new Error('No image data received from API');
    }

    const imageURL = result.data[0].imageURL;

    // Success analytics/logging
    console.log('Tattoo generated successfully:', {
      style: style || 'unknown',
      complexity: complexity || 'medium',
      placement: placement || 'generic',
      size: size || 'medium',
      timestamp: new Date().toISOString(),
    });

    return res.status(200).json({
      success: true,
      imageURL,
      prompt: enhancedPrompt,
      taskUUID,
      metadata: {
        style,
        complexity,
        placement,
        size,
        generatedAt: new Date().toISOString(),
        // CHANGE 6: Include mask info in response metadata
        hasMask: !!maskData,
        maskAnalysis: maskAnalysis || undefined,
      },
    });

  } catch (error) {
    console.error('Tattoo generation error:', error);

    // Sentry error tracking (optional)
    let errorId;
    if (typeof logAPIError === 'function') {
      logAPIError('/api/generate-tattoo', error, {
        prompt,
        style,
        complexity,
        placement,
        size,
      });
      // If you use Sentry directly, you can get errorId like this:
      // errorId = Sentry.captureException(error);
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to generate tattoo design. Please try again.',
      // Uncomment below if you use Sentry's captureException and want to return errorId
      // errorId: errorId || undefined,
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
}
