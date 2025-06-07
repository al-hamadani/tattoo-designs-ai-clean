// lib/maskProcessor.js
// Advanced mask processing utilities for future inpainting support

import { createCanvas, loadImage } from 'canvas';

export class MaskProcessor {
  constructor(maskDataUrl) {
    this.maskDataUrl = maskDataUrl;
    this.canvas = null;
    this.ctx = null;
    this.width = 0;
    this.height = 0;
  }

  async initialize() {
    try {
      const img = await loadImage(this.maskDataUrl);
      this.width = img.width;
      this.height = img.height;
      
      this.canvas = createCanvas(this.width, this.height);
      this.ctx = this.canvas.getContext('2d');
      this.ctx.drawImage(img, 0, 0);
      
      return true;
    } catch (error) {
      console.error('Failed to initialize mask processor:', error);
      return false;
    }
  }

  // Get the bounding box of the masked area
  getBoundingBox() {
    const imageData = this.ctx.getImageData(0, 0, this.width, this.height);
    const data = imageData.data;
    
    let minX = this.width;
    let minY = this.height;
    let maxX = 0;
    let maxY = 0;
    
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const idx = (y * this.width + x) * 4;
        // Check if pixel is white (part of mask)
        if (data[idx] > 128) {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      centerX: minX + (maxX - minX) / 2,
      centerY: minY + (maxY - minY) / 2
    };
  }

  // Calculate the coverage percentage
  getCoveragePercentage() {
    const imageData = this.ctx.getImageData(0, 0, this.width, this.height);
    const data = imageData.data;
    
    let whitePixels = 0;
    const totalPixels = this.width * this.height;
    
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] > 128) {
        whitePixels++;
      }
    }
    
    return (whitePixels / totalPixels) * 100;
  }

  // Detect the general shape of the mask
  detectShape() {
    const bbox = this.getBoundingBox();
    const aspectRatio = bbox.width / bbox.height;
    const coverage = this.getCoveragePercentage();
    const bboxArea = bbox.width * bbox.height;
    const totalArea = this.width * this.height;
    const bboxCoverage = (bboxArea / totalArea) * 100;
    
    // Shape detection logic
    if (aspectRatio > 2.5 || aspectRatio < 0.4) {
      return 'elongated';
    } else if (Math.abs(aspectRatio - 1) < 0.2) {
      if (coverage > bboxCoverage * 0.7) {
        return 'square-ish';
      } else {
        return 'circular';
      }
    } else {
      return 'irregular';
    }
  }

  // Get size recommendation based on mask area
  getSizeRecommendation() {
    const coverage = this.getCoveragePercentage();
    const bbox = this.getBoundingBox();
    const diagonalSize = Math.sqrt(bbox.width * bbox.width + bbox.height * bbox.height);
    const relativeDiagonal = diagonalSize / Math.sqrt(this.width * this.width + this.height * this.height);
    
    if (relativeDiagonal < 0.1) return 'tiny';
    if (relativeDiagonal < 0.2) return 'small';
    if (relativeDiagonal < 0.4) return 'medium';
    if (relativeDiagonal < 0.6) return 'large';
    return 'extra-large';
  }

  // Analyze mask for prompt enhancement
  async analyzeMask() {
    const initialized = await this.initialize();
    if (!initialized) {
      return { hasData: false };
    }
    
    const bbox = this.getBoundingBox();
    const coverage = this.getCoveragePercentage();
    const shape = this.detectShape();
    const size = this.getSizeRecommendation();
    
    return {
      hasData: true,
      boundingBox: bbox,
      coveragePercentage: coverage.toFixed(1),
      estimatedCoverage: coverage < 10 ? 'small' : coverage < 30 ? 'medium' : 'large',
      suggestedSize: size,
      shapeHint: shape,
      aspectRatio: (bbox.width / bbox.height).toFixed(2),
      promptHints: this.generatePromptHints(shape, size, coverage)
    };
  }

  // Generate specific prompt hints based on mask analysis
  generatePromptHints(shape, size, coverage) {
    const hints = [];
    
    // Shape-based hints
    switch (shape) {
      case 'elongated':
        hints.push('vertical flowing design', 'elongated composition');
        break;
      case 'circular':
        hints.push('circular composition', 'radial design');
        break;
      case 'square-ish':
        hints.push('balanced composition', 'symmetrical design');
        break;
      default:
        hints.push('organic flow', 'adaptive shape');
    }
    
    // Size-based hints
    switch (size) {
      case 'tiny':
      case 'small':
        hints.push('minimalist details', 'simple elements');
        break;
      case 'large':
      case 'extra-large':
        hints.push('complex details possible', 'intricate design');
        break;
    }
    
    // Coverage-based hints
    if (coverage > 30) {
      hints.push('dense coverage', 'full saturation');
    } else if (coverage < 10) {
      hints.push('delicate placement', 'sparse elements');
    }
    
    return hints;
  }

  // Convert mask to format suitable for API (when inpainting is supported)
  async prepareForAPI() {
    const analysis = await this.analyzeMask();
    
    return {
      maskData: this.maskDataUrl,
      analysis,
      // Additional processed formats could be added here
      // e.g., binary mask, resized versions, etc.
    };
  }
}

// Utility function for quick mask analysis
export async function analyzeMaskData(maskDataUrl) {
  if (!maskDataUrl) return null;
  
  try {
    const processor = new MaskProcessor(maskDataUrl);
    return await processor.analyzeMask();
  } catch (error) {
    console.error('Mask analysis failed:', error);
    return { hasData: false, error: error.message };
  }
}