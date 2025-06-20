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
          guidance_scale: 7.5,
          prompt_strength: 0.8,
          num_inference_steps: 50,
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
    if (typeof output === 'string') return [output];
    if (Array.isArray(output) && output.every((u) => typeof u === 'string')) return output;

    const streamToDataUrl = async (stream) => {
      const resp = new Response(stream);
      const blob = await resp.blob();
      const buf = Buffer.from(await blob.arrayBuffer());
      return `data:${blob.type};base64,${buf.toString('base64')}`;
    };

    if (Array.isArray(output)) {
      const conv = await Promise.all(
        output.map(async (item) => {
          if (typeof item === 'string') return item;
          if (item?.url) return item.url;
          if (item?.constructor?.name === 'ReadableStream') return streamToDataUrl(item);
          return null;
        }),
      );
      return conv.filter(Boolean);
    }

    if (output?.constructor?.name === 'ReadableStream') return [await streamToDataUrl(output)];

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
      // 1. prepare assets
      const [imgBuf, maskBuf] = await Promise.all([
        this.resizeBase64Image(image),
        this.resizeBase64Image(mask),
      ]);
      const [imageUrl, maskUrl] = await Promise.all([
        this.uploadToReplicate(imgBuf, 'image.png'),
        this.uploadToReplicate(maskBuf, 'mask.png'),
      ]);

      // 2. build prompt (lazy import avoids circular deps)
      const { buildTattooPrompt } = await import('../promptBuilder.js');
      const enhancedPrompt = buildTattooPrompt(prompt, style, 'generate', {
        complexity,
        placement,
        size,
        secondaryStyle,
      });

      // 3. call Replicate
      const model = this.models.inpainting;
      const prediction = await this.replicate.run(
        model.id,
        {
          image: imageUrl,
          mask: maskUrl,
          prompt: enhancedPrompt,
          num_outputs: numVariations,
          wait: { mode: 'poll', interval: 1000 },
          ...model.params,
        }
      );
      console.log('Replicate prediction output:', prediction);

      const images = await this.processReplicateOutput(prediction);
      if (!images.length) throw new Error('No usable images');

      return {
        success: true,
        images,
        prompt: enhancedPrompt,
        model: model.id,
        method: 'inpainting',
        metadata: { style, complexity, placement, size, secondaryStyle, generatedAt: new Date().toISOString() },
      };
    } catch (err) {
      console.error('Replicate inpainting error:', err);
      return { success: false, error: err.message, prompt };
    }
  }
}
