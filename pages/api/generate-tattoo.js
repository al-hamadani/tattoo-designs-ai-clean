import { randomUUID } from 'crypto';
// Import Sentry logger if available
import { logAPIError } from '../../lib/sentry';
// If you use Sentry directly, uncomment the following line and setup Sentry SDK
// import * as Sentry from '@sentry/nextjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { prompt, style, complexity, placement, size } = req.body;

  if (!prompt) {
    return res.status(400).json({ message: 'Prompt is required' });
  }

  try {
    // Enhance the prompt
    let enhancedPrompt = prompt;
    enhancedPrompt += ', professional tattoo design, clean white background, high contrast black ink, stencil ready, tattoo art';

    const negativePrompt = 'blurry, low quality, colored background, text, watermark, signature, multiple tattoos, duplicate, copy';
    const taskUUID = randomUUID();

    console.log('Generating tattoo with enhanced prompt:', enhancedPrompt);
    console.log('Task UUID:', taskUUID);

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
