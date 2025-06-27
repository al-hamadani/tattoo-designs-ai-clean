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
    
    // Convert buffer to base64 data URL for Replicate
    const base64Data = buf.toString('base64');
    const dataUrl = `data:image/png;base64,${base64Data}`;
    
    try {
      // For Replicate, we can use the data URL directly in the model input
      // No need for separate file upload - Replicate accepts base64 data URLs
      console.log(`✅ Prepared image data URL for Replicate (${base64Data.length} chars)`);
      return dataUrl;
      
    } catch (error) {
      console.error('Replicate data preparation error:', error);
      throw new Error(`Could not prepare data for Replicate: ${error.message}`);
    }
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
      // Feature flag for new dimension-based generation
      if (options.useDimensionGeneration) {
        console.log('🎯 Using dimension-based generation for gap filler');
        // For gap fillers, we only need the mask to determine size
        // Don't need the original image since we're generating fresh
        const maskAnalysis = await this.analyzeMask(maskData);
        // Determine dimensions based on mask
        let width = 512, height = 512;
        if (maskAnalysis.analysis) {
          const coverage = parseFloat(maskAnalysis.analysis.coveragePercentage);
          const bbox = maskAnalysis.analysis.boundingBox;
          // Scale generation size based on mask coverage
          if (coverage < 5) {
            width = height = 256;
          } else if (coverage < 15) {
            width = height = 512;
          } else if (coverage < 30) {
            width = height = 768;
          } else {
            width = height = 1024;
          }
          // Adjust for aspect ratio if needed
          if (bbox && bbox.width && bbox.height) {
            const aspectRatio = bbox.width / bbox.height;
            if (aspectRatio > 1.2) {
              height = Math.round(width / aspectRatio);
            } else if (aspectRatio < 0.8) {
              width = Math.round(height * aspectRatio);
            }
          }
          // Ensure multiples of 8 for model compatibility
          width = Math.round(width / 8) * 8;
          height = Math.round(height / 8) * 8;
          // Clamp to model limits
          width = Math.min(1024, Math.max(256, width));
          height = Math.min(1024, Math.max(256, height));
        }
        // Use standard generation with calculated dimensions
        const sizeHint = width <= 256 ? 'tiny micro ' : width <= 512 ? 'small ' : '';
        const enhancedPrompt = sizeHint + prompt;
        console.log(`📐 Generating ${width}x${height} design based on mask analysis`);
        // Use SDXL with specific dimensions
        const model = this.models.tattoo;
        const input = {
          prompt: enhancedPrompt,
          negative_prompt: options.negativePrompt || this.buildTattooNegativePrompt?.() || 'blurry, low quality, amateur',
          width: width,
          height: height,
          num_inference_steps: 30,
          guidance_scale: 7.5,
          scheduler: 'DPMSolverMultistep',
          num_outputs: options.numVariations || 1,
        };
        const output = await this.replicate.run(model.id, { input });
        // Process output
        let images = [];
        if (Array.isArray(output)) {
          for (const item of output) {
            if (typeof item === 'string' && item.startsWith('http')) {
              images.push(item);
            } else if (item instanceof ReadableStream) {
              const base64 = await this.streamToBase64(item);
              if (base64) images.push(base64);
            }
          }
        } else if (typeof output === 'string') {
          images.push(output);
        }
        return {
          success: true,
          images,
          model: model.id,
          method: 'dimension-based',
          dimensions: { width, height },
        };
      }
      // Original inpainting logic for non-gap-filler use cases
      console.log('🎨 Using traditional inpainting approach');
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
      // CRITICAL FIX: Override model params for gap fillers
      const input = options.gapFillerMode ? {
        image: imageUrl,
        mask: maskUrl,
        prompt: `${enhancedPrompt}, one unified cohesive design filling the entire marked area, single complete tattoo composition, NOT multiple scattered elements`,
        negative_prompt: `${negativePrompt}, multiple separate items, scattered pieces, individual elements, disconnected fragments, dispersed pattern`,
        width: 768,
        height: 768,
        num_inference_steps: 80,
        guidance_scale: 15.0,
        scheduler: "K_EULER_ANCESTRAL",
        num_outputs: options.numVariations || 1,
      } : {
        image: imageUrl,
        mask: maskUrl,
        prompt: enhancedPrompt,
        negative_prompt: negativePrompt,
        ...model.params,
        num_outputs: options.numVariations || 1,
      };
      console.log('🎨 Running inpainting model...');
      const output = await this.replicate.run(model.id, { input });
      // 👇 NEW: dump the raw payload so we know its real structure
      console.log('🖼️ Raw inpainting output:', JSON.stringify(output, null, 2));
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
      console.error('❌ Generation error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Enhanced mask analysis for accurate dimensions
  async analyzeMask(maskData) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        let minX = canvas.width, minY = canvas.height;
        let maxX = 0, maxY = 0;
        let pixelCount = 0;
        for (let y = 0; y < canvas.height; y++) {
          for (let x = 0; x < canvas.width; x++) {
            const idx = (y * canvas.width + x) * 4;
            if (data[idx] > 200 && data[idx + 1] > 200 && data[idx + 2] > 200) {
              minX = Math.min(minX, x);
              minY = Math.min(minY, y);
              maxX = Math.max(maxX, x);
              maxY = Math.max(maxY, y);
              pixelCount++;
            }
          }
        }
        const width = maxX - minX;
        const height = maxY - minY;
        const totalPixels = canvas.width * canvas.height;
        const coverage = (pixelCount / totalPixels) * 100;
        let genWidth, genHeight;
        const maxDimension = Math.max(width, height);
        if (maxDimension < 100) {
          genWidth = genHeight = 256;
        } else if (maxDimension < 200) {
          genWidth = genHeight = 512;
        } else if (maxDimension < 400) {
          genWidth = genHeight = 768;
        } else {
          genWidth = genHeight = 1024;
        }
        const aspectRatio = width / height;
        if (aspectRatio > 1.5) {
          genHeight = Math.round(genWidth / aspectRatio);
        } else if (aspectRatio < 0.67) {
          genWidth = Math.round(genHeight * aspectRatio);
        }
        genWidth = Math.round(genWidth / 64) * 64;
        genHeight = Math.round(genHeight / 64) * 64;
        resolve({
          width: genWidth,
          height: genHeight,
          aspectRatio: aspectRatio,
          coverage: coverage < 5 ? 'tiny' : coverage < 15 ? 'small' : coverage < 30 ? 'medium' : 'large',
          boundingBox: { x: minX, y: minY, width, height },
          originalDimensions: { width: canvas.width, height: canvas.height }
        });
      };
      img.src = maskData;
    });
  }

  // New method for dimension-based generation
  async generateWithDimensions(prompt, options) {
    const {
      width = 512,
      height = 512,
      aspectRatio = 1.0,
      coverage = 'medium',
      style = 'traditional',
    } = options;
    // Enhance prompt based on size
    let sizeHint = '';
    if (width <= 256) {
      sizeHint = 'micro tattoo, tiny detail, minimalist, simple design, ';
    } else if (width <= 512) {
      sizeHint = 'small tattoo, moderate detail, clean design, ';
    } else {
      sizeHint = 'detailed tattoo design, intricate elements, ';
    }
    const enhancedPrompt = sizeHint + prompt;
    // Use FLUX model with explicit dimensions
    const fluxModel = {
      id: 'black-forest-labs/flux-1.1-pro',
      params: {
        prompt: enhancedPrompt,
        width: Math.min(1440, Math.max(256, width)),
        height: Math.min(1440, Math.max(256, height)),
        prompt_upsampling: true,
        seed: options.seed || Math.floor(Math.random() * 1000000),
        safety_tolerance: 2,
        output_format: 'png'
      }
    };
    console.log(`🎨 Generating ${width}x${height} gap filler with FLUX`);
    const output = await this.replicate.run(fluxModel.id, { input: fluxModel.params });
    // Process output
    return {
      success: true,
      images: Array.isArray(output) ? output : [output],
      model: fluxModel.id,
      method: 'dimension-based',
      dimensions: { width, height },
    };
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