// pages/api/generate-tattoo.js - Enhanced for advanced features
import { randomUUID } from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { prompt, style, complexity, placement, size } = req.body;

  if (!prompt) {
    return res.status(400).json({ message: 'Prompt is required' });
  }

  try {
    // Enhanced prompt processing
    let enhancedPrompt = prompt;
    
    // Add consistent background and quality markers
    enhancedPrompt += ', professional tattoo design, clean white background, high contrast black ink, stencil ready, tattoo art';
    
    // Add negative prompt for consistency
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
          taskUUID: taskUUID,
          taskType: "imageInference",
          positivePrompt: enhancedPrompt,
          negativePrompt: negativePrompt,
          width: 512,
          height: 512,
          model: "runware:100@1",
          numberResults: 1,
          CFGScale: 7.5, // Improved adherence to prompt
          steps: 25 // Better quality
        }
      ])
    });

    console.log('API Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('API Error response:', errorText);
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('API Success response:', JSON.stringify(result, null, 2));
    
    // Check for errors in response
    if (result.errors && result.errors.length > 0) {
      throw new Error(`API Error: ${result.errors[0].message}`);
    }

    // Check for data
    if (!result.data || !result.data[0] || !result.data[0].imageURL) {
      throw new Error('No image data received from API');
    }

    const imageURL = result.data[0].imageURL;

    // Log success for analytics
    console.log('Tattoo generated successfully:', {
      style,
      complexity,
      placement,
      size,
      timestamp: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      imageURL: imageURL,
      prompt: enhancedPrompt,
      taskUUID: taskUUID,
      metadata: {
        style,
        complexity,
        placement,
        size,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Tattoo generation error:', error);
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate tattoo design. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}