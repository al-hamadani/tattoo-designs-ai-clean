import Replicate from 'replicate';
import { BaseAIService } from './base.js';
import { Buffer } from 'buffer';
import FormData from 'form-data';

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
    this.replicate = new Replicate({ auth: apiToken, useFileOutput: false });
    
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
      freshInk: {
        id: 'fofr/sdxl-fresh-ink:8515c238222fa529763ec99b4ba1fa9d32ab5d6ebc82b4281de99e4dbdcec943',
        params: {
          width: 1024,
          height: 1024,
          refine: "expert_ensemble_refiner",
          scheduler: "K_EULER",
          lora_scale: 0.6,
          num_outputs: 1,
          guidance_scale: 7.5,
          apply_watermark: false,
          high_noise_frac: 0.9,
          prompt_strength: 0.8,
          num_inference_steps: 25
        }
      }
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
    // console.log(`Skipping resize (sharp not available). Target was ${w}x${h}`);
    return this.base64ToBuffer(data);
  }

  async uploadToReplicate(bufferOrB64, filename) {
    const buf = Buffer.isBuffer(bufferOrB64)
      ? bufferOrB64
      : this.base64ToBuffer(bufferOrB64);

    // ✅ Node-safe multipart body
    const formData = new FormData();
    formData.append('file', buf, {
      filename,
      contentType: 'image/png',
    });

    const uploadResponse = await fetch('https://api.replicate.com/v1/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.REPLICATE_API_TOKEN}`,
        ...formData.getHeaders(),          // sets correct boundary header
      },
      body: formData,
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
      // console.log('❌ No stream provided');
      return null;
    }

    try {
      // Convert ReadableStream to Response then to ArrayBuffer
      const response = new Response(readableStream);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      const base64 = `data:image/png;base64,${buffer.toString('base64')}`;
      // console.log(`✅ Created base64 data URL (${base64.length} chars)`);
      
      return base64;
    } catch (error) {
      // console.log('❌ Stream processing failed:', error.message);
      return null;
    }
  }

  /* ---------- Professional Tattoo Generation ---------- */
  async generateImage(prompt, opts = {}) {
    console.log('🔍 Starting Replicate generateImage with:', { prompt: prompt.substring(0, 100), opts });
    
    try {
      this.validateConfig();
      console.log('✅ Config validation passed');
    } catch (configError) {
      console.error('❌ Config validation failed:', configError.message);
      return {
        success: false,
        error: `Configuration error: ${configError.message}`,
      };
    }

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
        console.log('🔄 Importing prompt builder...');
        const promptModule = await import('../promptBuilder.js');
        buildTattooPrompt = promptModule.buildTattooPrompt;
        buildTattooNegativePrompt = promptModule.buildTattooNegativePrompt;
        getStyleParameters = promptModule.getStyleParameters;
        console.log('✅ Prompt builder imported successfully');
      } catch (importError) {
        console.warn('⚠️ Failed to import enhanced prompt builder, using fallback:', importError.message);
        // Fallback prompt building
        buildTattooPrompt = (p) => `${p}, ${style} tattoo style, professional tattoo design`;
        buildTattooNegativePrompt = () => 'blurry, low quality, amateur';
        getStyleParameters = () => ({ guidance_scale: 8.5 });
      }

      console.log('🎨 Building enhanced prompt...');
      const enhancedPrompt = buildTattooPrompt(prompt, style, 'generate', {
        complexity,
        placement,
        size,
        secondaryStyle,
      });

      const negativePrompt = buildTattooNegativePrompt();
      const styleParams = getStyleParameters(style);

      const model = this.models.tattoo;
      
      console.log(`🎨 Generated enhanced prompt: "${enhancedPrompt.substring(0, 150)}..."`);
      console.log(`🚫 Negative prompt: "${negativePrompt}"`);
      console.log(`⚙️ Using model: ${model.id}`);

      const input = {
        prompt: enhancedPrompt,
        negative_prompt: negativePrompt,
        ...model.params,
        guidance_scale: styleParams.guidance_scale || model.params.guidance_scale,
        num_outputs: numVariations,
      };

      console.log('📊 Final input parameters:', JSON.stringify(input, null, 2));

      // Test Replicate instance
      console.log('🔍 Testing Replicate instance...');
      if (!this.replicate) {
        throw new Error('Replicate instance not initialized');
      }
      console.log('✅ Replicate instance exists');

      // Run the model
      console.log('🚀 Starting Replicate model run...');
      const output = await this.replicate.run(model.id, { input });
      
      console.log('🖼️ Raw Replicate output received:', {
        type: typeof output,
        isArray: Array.isArray(output),
        isStream: output instanceof ReadableStream,
        keys: typeof output === 'object' ? Object.keys(output) : 'N/A',
        stringValue: typeof output === 'string' ? output.substring(0, 100) : 'N/A'
      });

      // Process output - handle various formats
      let images = [];
      
      if (Array.isArray(output)) {
        console.log(`📋 Processing array output with ${output.length} items`);
        for (const [index, item] of output.entries()) {
          console.log(`  Item ${index}: type=${typeof item}, isStream=${item instanceof ReadableStream}`);
          if (typeof item === 'string' && item.startsWith('http')) {
            images.push(item);
            console.log(`    ✅ Added URL: ${item.substring(0, 50)}...`);
          } else if (item instanceof ReadableStream) {
            console.log('    🔄 Converting stream to base64...');
            const base64 = await this.streamToBase64(item);
            if (base64) {
              images.push(base64);
              console.log(`    ✅ Added base64 (${base64.length} chars)`);
            } else {
              console.log('    ❌ Stream conversion failed');
            }
          } else if (typeof item === 'object' && item.url) {
            images.push(item.url);
            console.log(`    ✅ Added object URL: ${item.url.substring(0, 50)}...`);
          } else {
            console.log(`    ⚠️ Unhandled item type: ${typeof item}`);
          }
        }
      } else if (typeof output === 'string') {
        console.log('📋 Processing string output');
        images.push(output);
        console.log(`  ✅ Added string: ${output.substring(0, 50)}...`);
      } else if (output instanceof ReadableStream) {
        console.log('📋 Processing stream output');
        const base64 = await this.streamToBase64(output);
        if (base64) {
          images.push(base64);
          console.log(`  ✅ Added base64 (${base64.length} chars)`);
        } else {
          console.log('  ❌ Stream conversion failed');
        }
      } else {
        console.log(`⚠️ Unexpected output type: ${typeof output}`);
        console.log('Raw output:', output);
      }

      console.log(`📊 Final results: ${images.length} images processed`);

      if (images.length === 0) {
        const errorMsg = 'No images generated from Replicate - output processing failed';
        console.error('❌', errorMsg);
        return {
          success: false,
          error: errorMsg,
          debug: {
            outputType: typeof output,
            outputValue: output,
            model: model.id
          }
        };
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
      console.error('❌ Replicate generation error:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      return {
        success: false,
        error: error.message,
        model: this.models.tattoo.id,
        debug: {
          errorType: error.name,
          errorMessage: error.message
        }
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
      // console.log('📤 Uploading images for inpainting...');
      const [imageUrl, maskUrl] = await Promise.all([
        this.uploadToReplicate(image, 'original.png'),
        this.uploadToReplicate(maskData, 'mask.png'),
      ]);

      const model = this.models.inpainting;
      
      // omit width/height so the API uses the image's own dimensions
      const { width, height, ...inpaintingParams } = model.params;

      const input = {
        image: imageUrl,
        mask: maskUrl,
        prompt: enhancedPrompt,
        negative_prompt: negativePrompt,
        ...inpaintingParams,      // guidance_scale, scheduler, etc.
        num_outputs: options.numVariations || 1,
        invert_mask: true,
      };

      const output = await this.replicate.run(model.id, { input });
      
      // console.log('🖼️ Raw inpainting output:', JSON.stringify(output, null, 2));

      /* ---------- robust output parsing (same as generateImage) ---------- */
      let images = [];
      if (Array.isArray(output)) {
        for (const item of output) {
          if (typeof item === 'string' && item.startsWith('http')) {
            images.push(item);
          } else if (item && typeof item === 'object' && item.url) {
            images.push(item.url);
          } else if (item instanceof ReadableStream) {
            const b64 = await this.streamToBase64(item);
            if (b64) images.push(b64);
          }
        }
      } else if (typeof output === 'string') {
        images.push(output);
      } else if (output && typeof output === 'object' && output.url) {
        images.push(output.url);
      }

      if (images.length === 0) {
        throw new Error('No images generated from Replicate');
      }

      return {
        success: true,
        images,
        model: model.id,
        method: 'inpainting',
      };

    } catch (error) {
      // console.error('❌ Inpainting error:', error);
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

  /* ---------- Fresh Ink Model Generation ---------- */
  async generateWithFreshInk(prompt, opts = {}) {
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
      // Import enhanced prompt builder and truncation utility
      let buildTattooPrompt, buildTattooNegativePrompt, getStyleParameters, truncateToTokenLimit;
      try {
        const promptModule = await import('../promptBuilder.js');
        buildTattooPrompt = promptModule.buildTattooPrompt;
        buildTattooNegativePrompt = promptModule.buildTattooNegativePrompt;
        getStyleParameters = promptModule.getStyleParameters;
        truncateToTokenLimit = promptModule.truncateToTokenLimit;
      } catch (importError) {
        // Fallback prompt building
        buildTattooPrompt = (p) => `${p}, ${style} tattoo style, professional tattoo design`;
        buildTattooNegativePrompt = () => 'blurry, low quality, amateur';
        getStyleParameters = () => ({ guidance_scale: 7.5 });
        truncateToTokenLimit = (p) => p.substring(0, 200); // Simple fallback
      }

      const enhancedPrompt = buildTattooPrompt(prompt, style, 'generate', {
        complexity,
        placement,
        size,
        secondaryStyle,
      });

      // Truncate prompt for Fresh Ink model (77 token limit)
      const truncatedPrompt = truncateToTokenLimit(enhancedPrompt, 77);
      
      const negativePrompt = buildTattooNegativePrompt();
      const styleParams = getStyleParameters(style);

      const model = this.models.freshInk;
      
      const input = {
        prompt: truncatedPrompt,
        negative_prompt: negativePrompt,
        ...model.params,
        guidance_scale: styleParams.guidance_scale || model.params.guidance_scale,
        num_outputs: numVariations,
      };

      // Run the Fresh Ink model
      const output = await this.replicate.run(model.id, { input });
      
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
        throw new Error('No images generated from Fresh Ink model');
      }

      return {
        success: true,
        images,
        model: model.id,
        prompt: truncatedPrompt,
        originalPrompt: enhancedPrompt,
        parameters: input,
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        model: this.models.freshInk.id,
      };
    }
  }
} 