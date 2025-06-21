import Replicate from 'replicate';
import { BaseAIService } from './base.js';
import { Buffer } from 'buffer';

// Remove sharp import - causes Vercel deployment issues
// import sharp from 'sharp';

/**
 * Fixed Replicate AI Service - Proper URL Extraction
 * Fixed the output processing to correctly extract image URLs
 * PRODUCTION FIX: Removed sharp dependency for Vercel compatibility
 */
export class ReplicateService extends BaseAIService {
  constructor(apiToken = process.env.REPLICATE_API_TOKEN) {
    super();
    this.replicate = new Replicate({ auth: apiToken });
    
    // Professional-grade model configurations
    this.models = {
      tattoo: {
        // Primary model for high-quality tattoo generation
        id: 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
        params: {
          width: 1024,
          height: 1024,
          scheduler: 'DPMSolverMultistep',
          num_inference_steps: 50,
          guidance_scale: 8.5,
          strength: 0.8,
          high_noise_frac: 0.8,
          apply_watermark: false
        },
      },
      inpainting: {
        id: 'stability-ai/stable-diffusion-inpainting:95b7223104132402a9ae91cc677285bc5eb997834bd2349fa486f53910fd68b3',
        params: {
          width: 1024,
          height: 1024,
          num_inference_steps: 50,
          guidance_scale: 9.0,
          scheduler: "DPMSolverMultistep"
        },
      },
    };
  }

  /* ---------- Configuration and Validation ---------- */
  validateConfig() {
    if (!process.env.REPLICATE_API_TOKEN) {
      throw new Error('REPLICATE_API_TOKEN is missing');
    }
  }

  /* ---------- Image Processing Utilities ---------- */
  base64ToBuffer(data) {
    return Buffer.from(data.replace(/^data:image\/\w+;base64,/, ''), 'base64');
  }

  /**
   * PRODUCTION FIX: Simplified resize without sharp
   * For now, we'll skip resizing and let Replicate handle it
   */
  async resizeBase64Image(data, w = 1024, h = 1024) {
    // Skip resizing in production - let Replicate handle image dimensions
    console.log(`Skipping resize (sharp not available). Target was ${w}x${h}`);
    return this.base64ToBuffer(data);
  }

  async uploadToReplicate(bufferOrB64, filename) {
    const buf = Buffer.isBuffer(bufferOrB64) ? 
      bufferOrB64 : this.base64ToBuffer(bufferOrB64);
    
    // Upload the buffer directly without resizing
    const formData = new FormData();
    const blob = new Blob([buf], { type: 'image/png' });
    formData.append('content', blob, filename);
    
    const uploadResponse = await fetch('https://api.replicate.com/v1/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.REPLICATE_API_TOKEN}`,
      },
      body: formData
    });
    
    if (!uploadResponse.ok) {
      throw new Error(`Upload failed: ${uploadResponse.statusText}`);
    }
    
    const { urls } = await uploadResponse.json();
    return urls.get;
  }

  /**
   * PRODUCTION FIX: Process stream to base64 without reading chunks
   * Use a more reliable method for production
   */
  async streamToBase64(readableStream) {
    if (!readableStream) {
      console.log('❌ No stream provided');
      return null;
    }

    try {
      // Convert ReadableStream to Response then to ArrayBuffer
      const response = new Response(readableStream);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      const base64 = `data:image/png;base64,${buffer.toString('base64')}`;
      console.log(`✅ Created base64 data URL (${base64.length} chars)`);
      
      return base64;
    } catch (error) {
      console.log('❌ Stream processing failed:', error.message);
      return null;
    }
  }

  /* ---------- Professional Tattoo Generation ---------- */
  async generateImage(prompt, opts = {}) {
    this.validateConfig();

    const {
      style = 'traditional',
      complexity = 'medium',
      placement = 'generic',
      size = 'medium',
      secondaryStyle = 'none',
      numVariations = 1,
    } = opts;

    try {
      // Import enhanced prompt builder
      let buildTattooPrompt, buildTattooNegativePrompt, getStyleParameters;
      try {
        const promptModule = await import('../promptBuilder.js');
        buildTattooPrompt = promptModule.buildTattooPrompt;
        buildTattooNegativePrompt = promptModule.buildTattooNegativePrompt;
        getStyleParameters = promptModule.getStyleParameters;
      } catch (importError) {
        console.warn('Failed to import enhanced prompt builder, using fallback');
        // Fallback prompt building
        buildTattooPrompt = (p) => `${p}, ${style} tattoo style, professional tattoo design`;
        buildTattooNegativePrompt = () => 'blurry, low quality, amateur';
        getStyleParameters = () => ({ guidance_scale: 8.5 });
      }

      const enhancedPrompt = buildTattooPrompt(prompt, style, 'generate', {
        complexity,
        placement,
        size,
        secondaryStyle,
      });

      const negativePrompt = buildTattooNegativePrompt();
      const styleParams = getStyleParameters(style);

      const model = this.models.tattoo;
      
      console.log(`🎨 Generating ${style} tattoo with prompt:`, enhancedPrompt.substring(0, 100) + '...');

      const input = {
        prompt: enhancedPrompt,
        negative_prompt: negativePrompt,
        ...model.params,
        guidance_scale: styleParams.guidance_scale || model.params.guidance_scale,
        num_outputs: numVariations,
      };

      // Run the model
      const output = await this.replicate.run(model.id, { input });
      
      console.log('🖼️ Raw Replicate output:', JSON.stringify(output, null, 2));

      // Process output - handle various formats
      let images = [];
      
      if (Array.isArray(output)) {
        for (const item of output) {
          if (typeof item === 'string' && item.startsWith('http')) {
            images.push(item);
          } else if (item instanceof ReadableStream) {
            const base64 = await this.streamToBase64(item);
            if (base64) images.push(base64);
          } else if (typeof item === 'object' && item.url) {
            images.push(item.url);
          }
        }
      } else if (typeof output === 'string') {
        images.push(output);
      } else if (output instanceof ReadableStream) {
        const base64 = await this.streamToBase64(output);
        if (base64) images.push(base64);
      }

      if (images.length === 0) {
        throw new Error('No images generated from Replicate');
      }

      console.log(`✅ Successfully generated ${images.length} images`);

      return {
        success: true,
        images,
        model: model.id,
        prompt: enhancedPrompt,
        parameters: input,
      };

    } catch (error) {
      console.error('❌ Replicate generation error:', error);
      return {
        success: false,
        error: error.message,
        model: this.models.tattoo.id,
      };
    }
  }

  /* ---------- Mask-based Generation (Inpainting) ---------- */
  async generateWithMask(prompt, image, maskData, options = {}) {
    this.validateConfig();

    try {
      // Import prompt builder
      let buildTattooPrompt, buildTattooNegativePrompt;
      try {
        const promptModule = await import('../promptBuilder.js');
        buildTattooPrompt = promptModule.buildTattooPrompt;
        buildTattooNegativePrompt = promptModule.buildTattooNegativePrompt;
      } catch (importError) {
        buildTattooPrompt = (p) => `${p}, professional tattoo design`;
        buildTattooNegativePrompt = () => 'blurry, low quality';
      }

      const enhancedPrompt = buildTattooPrompt(prompt, options.style, 'inpaint', options);
      const negativePrompt = buildTattooNegativePrompt();

      // Upload images without resizing
      console.log('📤 Uploading images for inpainting...');
      const [imageUrl, maskUrl] = await Promise.all([
        this.uploadToReplicate(image, 'original.png'),
        this.uploadToReplicate(maskData, 'mask.png'),
      ]);

      const model = this.models.inpainting;
      
      const input = {
        image: imageUrl,
        mask: maskUrl,
        prompt: enhancedPrompt,
        negative_prompt: negativePrompt,
        ...model.params,
        num_outputs: options.numVariations || 1,
      };

      console.log('🎨 Running inpainting model...');
      const output = await this.replicate.run(model.id, { input });

      // Process output
      let images = [];
      if (Array.isArray(output)) {
        images = output.filter(url => typeof url === 'string' && url.startsWith('http'));
      } else if (typeof output === 'string') {
        images = [output];
      }

      return {
        success: true,
        images,
        model: model.id,
        method: 'inpainting',
      };

    } catch (error) {
      console.error('❌ Inpainting error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /* ---------- Mask Analysis ---------- */
  async analyzeMask(maskData) {
    // Simplified analysis without sharp
    try {
      return {
        success: true,
        analysis: {
          hasMask: true,
          coverage: 'medium', // Default estimate
          bounds: {
            x: 0,
            y: 0,
            width: 100,
            height: 100,
          },
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /* ---------- Service Information ---------- */
  getAvailableModels() {
    return Object.keys(this.models);
  }

  async healthCheck() {
    try {
      this.validateConfig();
      
      // Test API connection
      const response = await fetch('https://api.replicate.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${process.env.REPLICATE_API_TOKEN}`,
        },
      });

      return {
        success: response.ok,
        service: 'Replicate',
        models: this.getAvailableModels(),
      };
    } catch (error) {
      return {
        success: false,
        service: 'Replicate',
        error: error.message,
      };
    }
  }
} 