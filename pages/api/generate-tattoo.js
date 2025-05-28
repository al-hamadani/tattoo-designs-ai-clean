// pages/api/generate-tattoo.js - WITH REQUIRED taskUUID
import { randomUUID } from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { prompt, style = 'traditional' } = req.body;

  if (!prompt) {
    return res.status(400).json({ message: 'Prompt is required' });
  }

  try {
    const tattooPrompt = `${prompt}, ${style} tattoo style, black and white tattoo design, clean lines, tattoo art, high contrast`;

    // Generate unique UUID for this request
    const taskUUID = randomUUID();
    
    console.log('Sending request with UUID:', taskUUID);
    console.log('Prompt:', tattooPrompt);

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
          positivePrompt: tattooPrompt,
          width: 512,
          height: 512,
          model: "runware:100@1",
          numberResults: 1
        }
      ])
    });

    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('Error response:', errorText);
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('API Response:', JSON.stringify(result, null, 2));
    
    // Check for errors in response
    if (result.errors && result.errors.length > 0) {
      throw new Error(`API Error: ${result.errors[0].message}`);
    }

    // Check for data
    if (!result.data || !result.data[0] || !result.data[0].imageURL) {
      throw new Error('No image data received from API');
    }

    const imageURL = result.data[0].imageURL;

    res.status(200).json({
      success: true,
      imageURL: imageURL,
      prompt: tattooPrompt,
      taskUUID: taskUUID
    });

  } catch (error) {
    console.error('Full error:', error);
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate tattoo design. Please try again.',
      error: error.message
    });
  }
}