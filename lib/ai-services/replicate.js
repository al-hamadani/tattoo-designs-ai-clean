import Replicate from 'replicate';
import { BaseAIService } from './base.js';
import { Buffer } from 'buffer';
import sharp from 'sharp';

/**
 * Replicate AI Service Implementation
 */
export class ReplicateService extends BaseAIService {
  constructor(config = {}) {
    super(config);
    this.replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

    this.models = {
      tattoo: {
        id: 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
        params: {
          width: 1024,
          height: 1024,
          scheduler: 'K_EULER',
          num_inference_steps: 50,
          guidance_scale: 9,
        },
      },
      inpainting: {
        id: 'stability-ai/stable-diffusion-inpainting:95b7223104132402a9ae91cc677285bc5eb997834bd2349fa486f53910fd68b3',
        params: {
          // Remove all params - we'll set them directly in the method
        },
      },
    };
  }

  /* ---------- helpers ---------- */
  validateConfig() {
    if (!process.env.REPLICATE_API_TOKEN) throw new Error('REPLICATE_API_TOKEN is missing');
  }

  base64ToBuffer(data) {
    return Buffer.from(data.replace(/^data:image\/\w+;base64,/, ''), 'base64');
  }

  async resizeBase64Image(data, w = 768, h = 768) {
    const buf = this.base64ToBuffer(data);
    return sharp(buf).resize(w, h, { withoutEnlargement: true }).png().toBuffer();
  }

  async uploadToReplicate(data, filename) {
    const buf = Buffer.isBuffer(data) ? data : this.base64ToBuffer(data);
    const { urls } = await this.replicate.files.create(buf, { filename, contentType: 'image/png' });
    return urls.get;
  }

  async processReplicateOutput(output) {
    if (!output) throw new Error('No output');
    
    // Handle string URLs directly
    if (typeof output === 'string') return [output];
    
    // Handle array of string URLs
    if (Array.isArray(output) && output.every((u) => typeof u === 'string')) return output;

    // Helper to convert ReadableStream to data URL
    const streamToDataUrl = async (stream) => {
      try {
        const response = new Response(stream);
        const blob = await response.blob();
        const buffer = Buffer.from(await blob.arrayBuffer());
        const base64 = buffer.toString('base64');
        const mimeType = blob.type || 'image/png';
        return `data:${mimeType};base64,${base64}`;
      } catch (error) {
        console.error('Error converting stream to data URL:', error);
        throw error;
      }
    };

    // Handle array of mixed types (URLs, objects, or streams)
    if (Array.isArray(output)) {
      const results = await Promise.all(
        output.map(async (item) => {
          try {
            // String URL
            if (typeof item === 'string') return item;
            
            // Object with URL property
            if (item && typeof item === 'object' && item.url) return item.url;
            
            // ReadableStream - check multiple ways
            if (item instanceof ReadableStream || 
                item?.constructor?.name === 'ReadableStream' ||
                (item && typeof item.getReader === 'function')) {
              console.log('Processing ReadableStream...');
              return await streamToDataUrl(item);
            }
            
            console.warn('Unknown output format:', item);
            return null;
          } catch (error) {
            console.error('Error processing output item:', error);
            return null;
          }
        })
      );
      
      const validResults = results.filter(Boolean);
      console.log(`Processed ${validResults.length} images from ${output.length} outputs`);
      return validResults;
    }

    // Single ReadableStream
    if (output instanceof ReadableStream || 
        output?.constructor?.name === 'ReadableStream' ||
        (output && typeof output.getReader === 'function')) {
      console.log('Processing single ReadableStream...');
      return [await streamToDataUrl(output)];
    }

    console.error('Unrecognised output format:', output);
    throw new Error('Unrecognised output format');
  }

  /* ---------- inpainting ---------- */
  async generateWithMask(prompt, image, mask, opts = {}) {
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
      // 1. prepare assets - resize to 512x512 (valid dimension)
      const [imgBuf, maskBuf] = await Promise.all([
        this.resizeBase64Image(image, 512, 512),
        this.resizeBase64Image(mask, 512, 512),
      ]);
      const [imageUrl, maskUrl] = await Promise.all([
        this.uploadToReplicate(imgBuf, 'image.png'),
        this.uploadToReplicate(maskBuf, 'mask.png'),
      ]);

      // 2. build prompt
      const { buildTattooPrompt } = await import('../promptBuilder.js');
      const enhancedPrompt = buildTattooPrompt(prompt, style, 'generate', {
        complexity,
        placement,
        size,
        secondaryStyle,
      });

      // 3. Run the model exactly like the Replicate example
      console.log('Running inpainting model...');
      
      const input = {
        image: imageUrl,
        mask: maskUrl,
        prompt: enhancedPrompt,
        width: 512,
        height: 512,
        num_outputs: Math.min(numVariations, 4),
        num_inference_steps: 25,
        guidance_scale: 7.5,
        scheduler: "DPMSolverMultistep",
        negative_prompt: "blurry, bad anatomy, bad composition, poor quality, low quality"
      };
      
      console.log('Input:', input);
      
      // Use replicate.run() exactly as shown in their example
      const output = await this.replicate.run(
        "stability-ai/stable-diffusion-inpainting:95b7223104132402a9ae91cc677285bc5eb997834bd2349fa486f53910fd68b3",
        { input }
      );
      
      console.log('Raw output:', output);
      console.log('Output type:', typeof output);
      console.log('Is array?', Array.isArray(output));

      // The output should be an array of URLs or Buffers
      let images = [];
      
      if (Array.isArray(output)) {
        for (const item of output) {
          if (typeof item === 'string' && item.startsWith('http')) {
            images.push(item);
          } else if (item instanceof Buffer) {
            // Convert buffer to base64
            const base64 = item.toString('base64');
            images.push(`data:image/png;base64,${base64}`);
          } else if (item && typeof item === 'object') {
            // Might be a ReadableStream or other object
            console.log('Unknown output item type:', item);
            // Try the processReplicateOutput method
            const processed = await this.processReplicateOutput([item]);
            images.push(...processed);
          }
        }
      } else if (typeof output === 'string') {
        images = [output];
      }
      
      if (!images.length) {
        throw new Error('No valid images in output');
      }
      
      console.log(`Successfully generated ${images.length} images`);

      return {
        success: true,
        images,
        prompt: enhancedPrompt,
        model: "stability-ai/stable-diffusion-inpainting",
        method: 'inpainting',
        metadata: { 
          style, 
          complexity, 
          placement, 
          size, 
          secondaryStyle, 
          generatedAt: new Date().toISOString() 
        },
      };
    } catch (err) {
      console.error('Replicate inpainting error:', err);
      return { 
        success: false, 
        error: err.message, 
        prompt,
        images: [] 
      };
    }
  }

  /* ---------- main generation method ---------- */
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
      // 1. build enhanced prompt
      const { buildTattooPrompt } = await import('../promptBuilder.js');
      const enhancedPrompt = buildTattooPrompt(prompt, style, 'generate', {
        complexity,
        placement,
        size,
        secondaryStyle,
      });

      // 2. Run the SDXL model
      console.log('Running SDXL model...');
      
      const model = this.models.tattoo;
      const input = {
        prompt: enhancedPrompt,
        num_outputs: numVariations,
        ...model.params,
        negative_prompt: "blurry, bad anatomy, bad hands, bad composition, poor quality, low quality, ugly"
      };
      
      const output = await this.replicate.run(model.id, { input });
      
      console.log('Raw output:', output);

      // Process output
      let images = [];
      
      if (Array.isArray(output)) {
        for (const item of output) {
          if (typeof item === 'string' && item.startsWith('http')) {
            images.push(item);
          } else if (item instanceof Buffer) {
            const base64 = item.toString('base64');
            images.push(`data:image/png;base64,${base64}`);
          } else if (item && typeof item === 'object') {
            console.log('Processing stream/object output...');
            const processed = await this.processReplicateOutput([item]);
            images.push(...processed);
          }
        }
      } else if (typeof output === 'string') {
        images = [output];
      }
      
      if (!images.length) {
        throw new Error('No valid images generated');
      }
      
      console.log(`Successfully generated ${images.length} images`);

      return {
        success: true,
        images,
        prompt: enhancedPrompt,
        model: model.id,
        method: 'text2img',
        metadata: { 
          style, 
          complexity, 
          placement, 
          size, 
          secondaryStyle, 
          generatedAt: new Date().toISOString() 
        },
      };
    } catch (err) {
      console.error('Replicate generation error:', err);
      return { 
        success: false, 
        error: err.message, 
        prompt,
        images: [] 
      };
    }
  }

  /* ---------- health check ---------- */
  async healthCheck() {
    try {
      this.validateConfig();
      
      // Test the API connection with a simple request
      const models = await this.replicate.collections.get('text-to-image');
      
      return {
        success: true,
        status: 'healthy',
        message: 'Replicate service is operational',
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

  /* ---------- get available models ---------- */
  getAvailableModels() {
    return Object.keys(this.models).map(key => ({
      id: key,
      name: this.models[key].id,
      type: key === 'tattoo' ? 'text2img' : 'inpainting'
    }));
  }

  /* ---------- mask analysis ---------- */
  async analyzeMask(maskData) {
    try {
      const maskBuf = this.base64ToBuffer(maskData);
      const metadata = await sharp(maskBuf).metadata();
      
      // Basic analysis of the mask
      const stats = await sharp(maskBuf).stats();
      const whitePixelRatio = stats.channels[0].mean / 255; // Assuming grayscale mask
      
      return {
        success: true,
        analysis: {
          width: metadata.width,
          height: metadata.height,
          coverage: Math.round(whitePixelRatio * 100), // Percentage of mask coverage
          shape: this.detectMaskShape(metadata.width, metadata.height),
          recommendation: this.getMaskRecommendation(whitePixelRatio)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  detectMaskShape(width, height) {
    const ratio = width / height;
    if (ratio > 1.5) return 'horizontal';
    if (ratio < 0.67) return 'vertical';
    return 'square';
  }

  getMaskRecommendation(coverage) {
    if (coverage < 0.1) return 'Mask area is very small - consider a minimalist design';
    if (coverage > 0.7) return 'Large mask area - suitable for complex designs';
    return 'Medium mask area - good for balanced designs';
  }
}
