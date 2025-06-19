import Replicate from 'replicate';
import { BaseAIService } from './base.js';
import { analyzeMaskData } from '../maskProcessor.js';

/**
 * Replicate AI Service Implementation
 * Handles all Replicate API calls and model configurations
 */
export class ReplicateService extends BaseAIService {
  constructor(config = {}) {
    super(config);
    
    this.replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });
    
    // Model configurations for different use cases
    this.models = {
      // Standard tattoo generation
      tattoo: {
        id: 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
        params: {
          width: 1024,
          height: 1024,
          num_outputs: 1,
          scheduler: 'K_EULER',
          num_inference_steps: 50,
          guidance_scale: 7.5,
          prompt_strength: 0.8,
          refine: 'expert_ensemble_refiner',
          high_noise_frac: 0.8,
        }
      },
      // Inpainting for coverups/gap fillers
      inpainting: {
        id: 'stability-ai/sdxl-inpainting:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
        params: {
          width: 1024,
          height: 1024,
          num_outputs: 1,
          scheduler: 'K_EULER',
          num_inference_steps: 50,
          guidance_scale: 7.5,
        }
      }
    };
  }

  /**
   * Validate Replicate configuration
   */
  validateConfig() {
    if (!process.env.REPLICATE_API_TOKEN) {
      throw new Error('REPLICATE_API_TOKEN environment variable is required');
    }
    return true;
  }

  /**
   * Get available models
   */
  getAvailableModels() {
    return Object.keys(this.models);
  }

  /**
   * Generate tattoo design from prompt
   */
  async generateImage(prompt, options = {}) {
    this.validateConfig();
    
    const {
      style = 'traditional',
      complexity = 'medium',
      placement = 'generic',
      size = 'medium',
      secondaryStyle = 'none',
      numVariations = 1
    } = options;

    // Select model based on use case
    const model = this.models.tattoo;
    
    // Build enhanced prompt using shared prompt builder
    const { buildTattooPrompt } = await import('../promptBuilder.js');
    const enhancedPrompt = buildTattooPrompt(
      prompt,
      style,
      'generate',
      { complexity, placement, size, secondaryStyle }
    );

    try {
      const output = await this.replicate.run(model.id, {
        input: {
          ...model.params,
          prompt: enhancedPrompt,
          num_outputs: numVariations,
          negative_prompt: 'blurry, low quality, amateur, pixelated, distorted, watermark, signature, text, words, letters, colored background, rainbow colors, neon colors, child-like, cartoon, anime, bad anatomy, poorly drawn'
        }
      });

      return {
        success: true,
        images: Array.isArray(output) ? output : [output],
        prompt: enhancedPrompt,
        model: model.id,
        metadata: {
          style,
          complexity,
          placement,
          size,
          secondaryStyle,
          generatedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Replicate generation error:', error);
      return {
        success: false,
        error: error.message,
        prompt: enhancedPrompt
      };
    }
  }

  /**
   * Generate with mask support (inpainting)
   */
  async generateWithMask(prompt, image, maskData, options = {}) {
    this.validateConfig();
    
    const {
      style = 'traditional',
      complexity = 'medium',
      placement = 'generic',
      size = 'medium',
      secondaryStyle = 'none',
      numVariations = 1
    } = options;

    // Use inpainting model
    const model = this.models.inpainting;
    
    // Build enhanced prompt
    const { buildTattooPrompt } = await import('../promptBuilder.js');
    const enhancedPrompt = buildTattooPrompt(
      prompt,
      style,
      'generate',
      { complexity, placement, size, secondaryStyle }
    );

    try {
      const input = {
        input: {
          ...model.params,
          prompt: enhancedPrompt,
          image: image,
          mask: maskData,
          num_outputs: numVariations,
          negative_prompt: 'blurry, low quality, amateur, pixelated, distorted, watermark, signature, text, words, letters, colored background, rainbow colors, neon colors, child-like, cartoon, anime, bad anatomy, poorly drawn'
        }
      };

      console.log('--- Calling Replicate API with input ---');
      console.log(JSON.stringify(input, null, 2));

      const output = await this.replicate.run(model.id, input);
      
      console.log('--- Received response from Replicate API ---');
      console.log(JSON.stringify(output, null, 2));

      return {
        success: true,
        images: Array.isArray(output) ? output : [output],
        prompt: enhancedPrompt,
        model: model.id,
        metadata: {
          style,
          complexity,
          placement,
          size,
          secondaryStyle,
          generatedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Replicate inpainting error:', error);
      return {
        success: false,
        error: error.message,
        prompt: enhancedPrompt
      };
    }
  }

  /**
   * Analyze mask data for better prompt generation
   */
  async analyzeMask(maskData) {
    try {
      const analysis = await analyzeMaskData(maskData);
      return {
        success: true,
        analysis,
        recommendations: this.generateMaskRecommendations(analysis)
      };
    } catch (error) {
      console.error('Mask analysis error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Process mask for inpainting
   */
  async processMaskForInpainting(maskData) {
    // This function is no longer needed as the original image is passed directly.
    // It can be removed.
    const analysis = await this.analyzeMask(maskData);
    
    return {
      image: maskData, // This was incorrect
      mask: maskData,
      analysis: analysis.analysis || {}
    };
  }

  /**
   * Generate recommendations based on mask analysis
   */
  generateMaskRecommendations(analysis) {
    const recommendations = {
      style: 'traditional',
      complexity: 'medium',
      size: 'medium',
      promptHints: []
    };

    if (analysis.shapeHint === 'elongated') {
      recommendations.style = 'geometric';
      recommendations.promptHints.push('vertical flowing design');
    } else if (analysis.shapeHint === 'circular') {
      recommendations.style = 'mandala';
      recommendations.promptHints.push('radial composition');
    }

    if (analysis.suggestedSize) {
      recommendations.size = analysis.suggestedSize;
    }

    if (analysis.coveragePercentage > 30) {
      recommendations.complexity = 'complex';
      recommendations.promptHints.push('dense coverage');
    } else if (analysis.coveragePercentage < 10) {
      recommendations.complexity = 'simple';
      recommendations.promptHints.push('delicate placement');
    }

    return recommendations;
  }

  /**
   * Health check for Replicate service
   */
  async healthCheck() {
    try {
      this.validateConfig();
      
      // Try a simple API call to verify connectivity
      const models = await this.replicate.models.list();
      
      return {
        success: true,
        status: 'healthy',
        provider: 'replicate',
        modelsAvailable: models.length > 0
      };
    } catch (error) {
      return {
        success: false,
        status: 'unhealthy',
        provider: 'replicate',
        error: error.message
      };
    }
  }
} 