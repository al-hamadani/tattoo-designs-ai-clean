// Enhanced API endpoint for professional-quality tattoo generation
// This replaces the existing /api/generate-tattoo.js with optimized settings

import { randomUUID } from 'crypto';
import { logAPIError } from '../../lib/sentry';
import { buildTattooPrompt } from '../../lib/promptBuilder';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { prompt, style, complexity, placement, size, maskData, secondaryStyle } = req.body;

  if (!prompt) {
    return res.status(400).json({ message: 'Prompt is required' });
  }

  try {
    // Use shared prompt builder for professional tattoo quality
    const enhancedPrompt = buildTattooPrompt(
      prompt,
      style,
      'generate',
      { complexity, placement, size, secondaryStyle }
    );

    // Negative prompt to ensure quality
    const negativePrompt = 'blurry, low quality, amateur, pixelated, distorted, watermark, signature, text, words, letters, colored background, rainbow colors, neon colors, child-like, cartoon, anime, bad anatomy, poorly drawn';

    const taskUUID = randomUUID();

    // console.log('Generating professional tattoo with prompt:', enhancedPrompt);

    // API call with optimized parameters for high quality
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
          width: 1024,        // Increased resolution
          height: 1024,       // Square format for versatility
          model: "runware:100@1",
          numberResults: 1,
          CFGScale: 8.5,      // Higher CFG for better prompt adherence
          steps: 50,          // More steps for better quality
          sampler: "DPM++ 2M Karras", // Better sampler for detailed work
          seed: Math.floor(Math.random() * 1000000), // Random seed for uniqueness
        }
      ]),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    if (result.errors && result.errors.length > 0) {
      throw new Error(`API Error: ${result.errors[0].message}`);
    }

    if (!result.data || !result.data[0] || !result.data[0].imageURL) {
      throw new Error('No image data received from API');
    }

    const imageURL = result.data[0].imageURL;

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
        originalPrompt: prompt,
        generatedAt: new Date().toISOString(),
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