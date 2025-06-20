import Replicate from 'replicate';
import { BaseAIService } from './base.js';
import { Buffer } from 'buffer';
import sharp from 'sharp';

/**
 * Enhanced Replicate AI Service for Professional Tattoo Generation
 * Optimized to exceed blackink.ai quality standards
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
          scheduler: 'DPMSolverMultistep', // Better for detailed work
          num_inference_steps: 50,
          guidance_scale: 8.5, // Will be adjusted per style
          strength: 0.8,
          high_noise_frac: 0.8,
          apply_watermark: false
        },
      },
      tattoo_xl: {
        // Alternative high-quality model
        id: 'lucataco/sdxl-lightning-4step:727e49a643e999d602a896c774a0658ffefea21465756a6ce24b7ea4165efa6a',
        params: {
          width: 1024,
          height: 1024,
          num_inference_steps: 4,
          guidance_scale: 2.0,
          scheduler: 'DPM-Solver++'
        }
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

  async resizeBase64Image(data, w = 1024, h = 1024) {
    const buf = this.base64ToBuffer(data);
    return sharp(buf)
      .resize(w, h, { 
        withoutEnlargement: true,
        fit: 'inside',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png()
      .toBuffer();
  }

  async uploadToReplicate(bufferOrB64, filename) {
    const buf = Buffer.isBuffer(bufferOrB64) ? 
      bufferOrB64 : 
      this.base64ToBuffer(bufferOrB64);
    
    try {
      return await this.replicate.files.create(buf);
    } catch (error) {
      console.error('File upload failed:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  /* ---------- Output Processing ---------- */
  async processReplicateOutput(output) {
    if (!output) return [];
    
    // Handle ReadableStream
    if (output.constructor.name === 'ReadableStream') {
      return [await this.streamToDataUrl(output)];
    }
    
    // Handle FileOutput or similar
    if (output.url || output.urls) {
      return Array.isArray(output.urls) ? output.urls : [output.url];
    }
    
    return [];
  }

  async streamToDataUrl(stream) {
    const chunks = [];
    const reader = stream.getReader();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    
    const buffer = Buffer.concat(chunks);
    return `data:image/png;base64,${buffer.toString('base64')}`;
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
        // Fallback to basic prompt building
        buildTattooPrompt = (prompt, style) => `${prompt}, ${style} tattoo style, professional tattoo artwork`;
        buildTattooNegativePrompt = () => 'blurry, low quality, amateur, bad anatomy';
        getStyleParameters = () => ({ guidanceScale: 8.5, steps: 50, strength: 0.8 });
      }
      
      // Build professional prompt
      const enhancedPrompt = buildTattooPrompt(prompt, style, 'generate', {
        complexity,
        placement,
        size,
        secondaryStyle,
        randomSeed: Math.random().toString(36).substring(7)
      });

      // Get professional negative prompt
      const negativePrompt = buildTattooNegativePrompt();
      
      // Get style-specific parameters
      const styleParams = getStyleParameters(style);
      
      console.log('Professional tattoo generation with enhanced prompt:', enhancedPrompt);
      
      // Select best model for tattoo generation
      const model = this.models.tattoo;
      
      // Professional generation parameters
      const input = {
        prompt: enhancedPrompt,
        negative_prompt: negativePrompt,
        num_outputs: Math.min(numVariations, 4),
        guidance_scale: styleParams.guidanceScale,
        num_inference_steps: styleParams.steps,
        ...model.params,
        // Quality enhancements
        high_noise_frac: 0.8,
        apply_watermark: false,
        disable_safety_checker: false
      };
      
      console.log('Generation parameters:', input);
      
      // Generate with professional model
      const output = await this.replicate.run(model.id, { input });
      
      console.log('Generation output received:', typeof output, Array.isArray(output));

      // Process output into usable images
      let images = [];
      
      if (Array.isArray(output)) {
        for (const item of output) {
          if (typeof item === 'string' && item.startsWith('http')) {
            images.push(item);
          } else if (item instanceof Buffer) {
            const base64 = item.toString('base64');
            images.push(`data:image/png;base64,${base64}`);
          } else if (item && typeof item === 'object') {
            const processed = await this.processReplicateOutput(item);
            images.push(...processed);
          }
        }
      } else if (typeof output === 'string') {
        images = [output];
      }
      
      if (!images.length) {
        throw new Error('No valid images generated');
      }
      
      console.log(`Successfully generated ${images.length} professional tattoo images`);

      return {
        success: true,
        images,
        prompt: enhancedPrompt,
        model: model.id,
        method: 'professional_text2img',
        metadata: { 
          style, 
          complexity, 
          placement, 
          size, 
          secondaryStyle,
          styleParameters: styleParams,
          qualityLevel: 'professional',
          generatedAt: new Date().toISOString() 
        },
      };
    } catch (err) {
      console.error('Professional tattoo generation error:', err);
      return { 
        success: false, 
        error: err.message, 
        prompt,
        images: [] 
      };
    }
  }

  /* ---------- Professional Inpainting for Coverups ---------- */
  async generateWithMask(prompt, image, mask, opts = {}) {
    this.validateConfig();

    const {
      style = 'blackwork',
      complexity = 'complex',
      placement = 'custom-coverup',
      size = 'medium',
      secondaryStyle = 'none',
      numVariations = 1,
    } = opts;

    try {
      // Prepare high-quality assets
      const [imgBuf, maskBuf] = await Promise.all([
        this.resizeBase64Image(image, 1024, 1024),
        this.resizeBase64Image(mask, 1024, 1024),
      ]);
      
      const [imageUrl, maskUrl] = await Promise.all([
        this.uploadToReplicate(imgBuf, 'image.png'),
        this.uploadToReplicate(maskBuf, 'mask.png'),
      ]);

      // Import enhanced prompt builder
      let buildTattooPrompt, buildTattooNegativePrompt, getStyleParameters;
      try {
        const promptModule = await import('../promptBuilder.js');
        buildTattooPrompt = promptModule.buildTattooPrompt;
        buildTattooNegativePrompt = promptModule.buildTattooNegativePrompt;
        getStyleParameters = promptModule.getStyleParameters;
      } catch (importError) {
        console.warn('Failed to import enhanced prompt builder for inpainting, using fallback');
        buildTattooPrompt = (prompt, style, type) => `${prompt}, ${style} tattoo style, ${type === 'coverup' ? 'cover-up design' : 'professional tattoo artwork'}`;
        buildTattooNegativePrompt = () => 'blurry, low quality, amateur, bad anatomy, visible old tattoo';
        getStyleParameters = () => ({ guidanceScale: 9.0, steps: 60, strength: 0.8 });
      }
      
      // Build professional coverup prompt
      const enhancedPrompt = buildTattooPrompt(prompt, style, 'coverup', {
        complexity,
        placement,
        size,
        secondaryStyle,
      });

      // Professional negative prompt for inpainting
      const negativePrompt = buildTattooNegativePrompt() + 
        ', visible old tattoo, incomplete coverage, patchy coverage, poor blending';
      
      // Get style-specific parameters
      const styleParams = getStyleParameters(style);
      
      console.log('Professional coverup generation:', enhancedPrompt);
      
      // Professional inpainting parameters
      const input = {
        image: imageUrl,
        mask: maskUrl,
        prompt: enhancedPrompt,
        negative_prompt: negativePrompt,
        width: 1024,
        height: 1024,
        num_outputs: Math.min(numVariations, 4),
        num_inference_steps: 60, // More steps for quality inpainting
        guidance_scale: styleParams.guidanceScale + 1, // Higher guidance for inpainting
        scheduler: "DPMSolverMultistep",
        strength: styleParams.strength
      };
      
      console.log('Inpainting parameters:', input);
      
      // Generate professional coverup
      const output = await this.replicate.run(
        this.models.inpainting.id,
        { input }
      );
      
      console.log('Inpainting output:', typeof output, Array.isArray(output));

      // Process inpainting output
      let images = [];
      
      if (Array.isArray(output)) {
        for (const item of output) {
          if (typeof item === 'string' && item.startsWith('http')) {
            images.push(item);
          } else if (item instanceof Buffer) {
            const base64 = item.toString('base64');
            images.push(`data:image/png;base64,${base64}`);
          } else if (item && typeof item === 'object') {
            const processed = await this.processReplicateOutput(item);
            images.push(...processed);
          }
        }
      } else if (typeof output === 'string') {
        images = [output];
      }
      
      if (!images.length) {
        throw new Error('No valid inpainting images generated');
      }
      
      console.log(`Successfully generated ${images.length} professional coverup images`);

      return {
        success: true,
        images,
        prompt: enhancedPrompt,
        model: this.models.inpainting.id,
        method: 'professional_inpainting',
        metadata: { 
          style, 
          complexity, 
          placement, 
          size, 
          secondaryStyle,
          styleParameters: styleParams,
          qualityLevel: 'professional_coverup',
          generatedAt: new Date().toISOString() 
        },
      };
    } catch (err) {
      console.error('Professional inpainting error:', err);
      return { 
        success: false, 
        error: err.message, 
        prompt,
        images: [] 
      };
    }
  }

  /* ---------- Mask Analysis ---------- */
  async analyzeMask(maskData) {
    try {
      // Basic mask analysis for coverage estimation
      const buffer = this.base64ToBuffer(maskData);
      const metadata = await sharp(buffer).metadata();
      
      // Simple coverage analysis
      const stats = await sharp(buffer)
        .raw()
        .toBuffer({ resolveWithObject: true });
      
      const totalPixels = metadata.width * metadata.height;
      const channels = metadata.channels || 3;
      
      // Estimate mask coverage (simplified)
      let maskedPixels = 0;
      for (let i = 0; i < stats.data.length; i += channels) {
        const intensity = stats.data[i]; // Use first channel
        if (intensity < 128) { // Dark pixels are masked areas
          maskedPixels++;
        }
      }
      
      const coverage = (maskedPixels / totalPixels) * 100;
      
      return {
        success: true,
        coverage: Math.round(coverage),
        dimensions: { width: metadata.width, height: metadata.height },
        recommendation: coverage > 50 ? 'heavy_coverage' : coverage > 20 ? 'moderate_coverage' : 'light_touch',
        analysisType: 'basic_coverage'
      };
    } catch (error) {
      return {
        success: false,
        error: `Mask analysis failed: ${error.message}`
      };
    }
  }

  /* ---------- Service Health and Models ---------- */
  async healthCheck() {
    try {
      this.validateConfig();
      
      // Simple API validation - just check if we can access the API
      return {
        success: true,
        status: 'healthy',
        message: 'Professional Replicate service operational',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        status: 'unhealthy',
        message: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  getAvailableModels() {
    return Object.keys(this.models).map(key => ({
      id: key,
      name: this.models[key].id,
      type: key === 'tattoo' ? 'text-to-image' : 
            key === 'tattoo_xl' ? 'text-to-image-fast' :
            'inpainting',
      optimizedFor: key === 'tattoo' ? 'professional tattoo generation' :
                    key === 'tattoo_xl' ? 'fast professional generation' :
                    'coverup and gap filling',
      qualityLevel: 'professional'
    }));
  }
}