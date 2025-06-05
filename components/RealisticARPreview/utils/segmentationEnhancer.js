// components/RealisticARPreview/utils/segmentationEnhancer.js

export class SegmentationEnhancer {
    constructor() {
      this.featherCanvas = document.createElement('canvas');
      this.featherCtx = this.featherCanvas.getContext('2d');
      this.morphCanvas = document.createElement('canvas');
      this.morphCtx = this.morphCanvas.getContext('2d');
    }
  
    // Enhance segmentation mask with feathering and smoothing
    enhanceSegmentation(segmentationMask, width, height, options = {}) {
      const {
        featherRadius = 8,
        smoothingIterations = 2,
        edgeThreshold = 0.5,
        contrastBoost = 1.2
      } = options;
  
      // Set canvas sizes
      this.featherCanvas.width = width;
      this.featherCanvas.height = height;
      this.morphCanvas.width = width;
      this.morphCanvas.height = height;
  
      // Draw original mask
      this.featherCtx.drawImage(segmentationMask, 0, 0, width, height);
      
      // Get image data for processing
      let imageData = this.featherCtx.getImageData(0, 0, width, height);
      let data = imageData.data;
  
      // Step 1: Edge detection and refinement
      data = this.refineEdges(data, width, height, edgeThreshold);
  
      // Step 2: Morphological operations (close small gaps)
      data = this.morphologicalClose(data, width, height, 3);
  
      // Step 3: Gaussian blur for smooth edges
      for (let i = 0; i < smoothingIterations; i++) {
        data = this.gaussianBlur(data, width, height, 3);
      }
  
      // Step 4: Feather edges
      data = this.featherEdges(data, width, height, featherRadius);
  
      // Step 5: Contrast adjustment
      data = this.adjustContrast(data, width, height, contrastBoost);
  
      // Put processed data back
      imageData.data.set(data);
      this.featherCtx.putImageData(imageData, 0, 0);
  
      return this.featherCanvas;
    }
  
    // Refine edges using edge detection
    refineEdges(data, width, height, threshold) {
      const output = new Uint8ClampedArray(data);
      const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
      const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
  
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          let gx = 0, gy = 0;
          
          // Apply Sobel operator
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const idx = ((y + ky) * width + (x + kx)) * 4 + 3; // Alpha channel
              const val = data[idx] / 255;
              const kernelIdx = (ky + 1) * 3 + (kx + 1);
              
              gx += val * sobelX[kernelIdx];
              gy += val * sobelY[kernelIdx];
            }
          }
          
          const magnitude = Math.sqrt(gx * gx + gy * gy);
          const idx = (y * width + x) * 4 + 3;
          
          // Enhance edges
          if (magnitude > threshold) {
            output[idx] = data[idx] > 128 ? 255 : 0;
          }
        }
      }
  
      return output;
    }
  
    // Morphological close operation
    morphologicalClose(data, width, height, radius) {
      // First dilate, then erode
      let dilated = this.dilate(data, width, height, radius);
      return this.erode(dilated, width, height, radius);
    }
  
    // Dilation operation
    dilate(data, width, height, radius) {
      const output = new Uint8ClampedArray(data);
      
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          let maxVal = 0;
          
          for (let ky = -radius; ky <= radius; ky++) {
            for (let kx = -radius; kx <= radius; kx++) {
              const ny = y + ky;
              const nx = x + kx;
              
              if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
                const idx = (ny * width + nx) * 4 + 3;
                maxVal = Math.max(maxVal, data[idx]);
              }
            }
          }
          
          const idx = (y * width + x) * 4 + 3;
          output[idx] = maxVal;
        }
      }
      
      return output;
    }
  
    // Erosion operation
    erode(data, width, height, radius) {
      const output = new Uint8ClampedArray(data);
      
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          let minVal = 255;
          
          for (let ky = -radius; ky <= radius; ky++) {
            for (let kx = -radius; kx <= radius; kx++) {
              const ny = y + ky;
              const nx = x + kx;
              
              if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
                const idx = (ny * width + nx) * 4 + 3;
                minVal = Math.min(minVal, data[idx]);
              }
            }
          }
          
          const idx = (y * width + x) * 4 + 3;
          output[idx] = minVal;
        }
      }
      
      return output;
    }
  
    // Gaussian blur for smoothing
    gaussianBlur(data, width, height, radius) {
      const output = new Uint8ClampedArray(data);
      const sigma = radius / 3;
      const kernel = this.generateGaussianKernel(radius, sigma);
      
      // Horizontal pass
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          let sum = 0;
          let weightSum = 0;
          
          for (let k = -radius; k <= radius; k++) {
            const nx = x + k;
            if (nx >= 0 && nx < width) {
              const idx = (y * width + nx) * 4 + 3;
              const weight = kernel[k + radius];
              sum += data[idx] * weight;
              weightSum += weight;
            }
          }
          
          const idx = (y * width + x) * 4 + 3;
          output[idx] = sum / weightSum;
        }
      }
      
      // Vertical pass
      const temp = new Uint8ClampedArray(output);
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          let sum = 0;
          let weightSum = 0;
          
          for (let k = -radius; k <= radius; k++) {
            const ny = y + k;
            if (ny >= 0 && ny < height) {
              const idx = (ny * width + x) * 4 + 3;
              const weight = kernel[k + radius];
              sum += temp[idx] * weight;
              weightSum += weight;
            }
          }
          
          const idx = (y * width + x) * 4 + 3;
          output[idx] = sum / weightSum;
        }
      }
      
      return output;
    }
  
    // Generate Gaussian kernel
    generateGaussianKernel(radius, sigma) {
      const kernel = [];
      let sum = 0;
      
      for (let i = -radius; i <= radius; i++) {
        const weight = Math.exp(-(i * i) / (2 * sigma * sigma));
        kernel.push(weight);
        sum += weight;
      }
      
      // Normalize
      return kernel.map(w => w / sum);
    }
  
    // Feather edges with gradient falloff
    featherEdges(data, width, height, featherRadius) {
      const output = new Uint8ClampedArray(data);
      const distanceMap = this.computeDistanceMap(data, width, height);
      
      for (let i = 0; i < data.length; i += 4) {
        const alphaIdx = i + 3;
        const distance = distanceMap[i / 4];
        
        if (distance <= featherRadius && data[alphaIdx] > 0) {
          // Apply smooth gradient falloff
          const falloff = this.smoothstep(0, featherRadius, distance);
          output[alphaIdx] = data[alphaIdx] * falloff;
        }
      }
      
      return output;
    }
  
    // Compute distance from edge
    computeDistanceMap(data, width, height) {
      const distanceMap = new Float32Array(width * height);
      
      // Initialize with large values for inside, 0 for outside
      for (let i = 0; i < distanceMap.length; i++) {
        const alphaIdx = i * 4 + 3;
        distanceMap[i] = data[alphaIdx] > 128 ? 9999 : 0;
      }
      
      // Forward pass
      for (let y = 1; y < height; y++) {
        for (let x = 1; x < width; x++) {
          const idx = y * width + x;
          if (distanceMap[idx] > 0) {
            distanceMap[idx] = Math.min(
              distanceMap[idx],
              distanceMap[idx - 1] + 1,
              distanceMap[idx - width] + 1
            );
          }
        }
      }
      
      // Backward pass
      for (let y = height - 2; y >= 0; y--) {
        for (let x = width - 2; x >= 0; x--) {
          const idx = y * width + x;
          if (distanceMap[idx] > 0) {
            distanceMap[idx] = Math.min(
              distanceMap[idx],
              distanceMap[idx + 1] + 1,
              distanceMap[idx + width] + 1
            );
          }
        }
      }
      
      return distanceMap;
    }
  
    // Smooth step function for gradients
    smoothstep(edge0, edge1, x) {
      const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
      return t * t * (3 - 2 * t);
    }
  
    // Adjust contrast
    adjustContrast(data, width, height, factor) {
      const output = new Uint8ClampedArray(data);
      
      for (let i = 3; i < data.length; i += 4) {
        const val = data[i] / 255;
        const adjusted = Math.pow(val, 1 / factor);
        output[i] = adjusted * 255;
      }
      
      return output;
    }
  
    // Get skin tone adaptive blend settings
    getSkinToneBlendSettings(videoFrame, segmentationMask, samplePoints) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = videoFrame.width;
      canvas.height = videoFrame.height;
      
      ctx.drawImage(videoFrame, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      let r = 0, g = 0, b = 0, count = 0;
      
      // Sample skin colors from detected body parts
      for (const point of samplePoints) {
        const x = Math.floor(point.x * canvas.width);
        const y = Math.floor(point.y * canvas.height);
        const idx = (y * canvas.width + x) * 4;
        
        // Check if point is within segmentation mask
        const maskCtx = segmentationMask.getContext('2d');
        const maskData = maskCtx.getImageData(x, y, 1, 1).data;
        
        if (maskData[3] > 128) { // If within mask
          r += data[idx];
          g += data[idx + 1];
          b += data[idx + 2];
          count++;
        }
      }
      
      if (count > 0) {
        return {
          averageColor: {
            r: r / count / 255,
            g: g / count / 255,
            b: b / count / 255
          },
          blendMode: this.recommendBlendMode(r / count, g / count, b / count),
          opacity: this.recommendOpacity(r / count, g / count, b / count)
        };
      }
      
      return {
        averageColor: { r: 0.8, g: 0.7, b: 0.6 },
        blendMode: 'multiply',
        opacity: 0.85
      };
    }
  
    // Recommend blend mode based on skin tone
    recommendBlendMode(r, g, b) {
      const brightness = (r + g + b) / 3 / 255;
      
      if (brightness < 0.3) {
        return 'screen'; // For very dark skin
      } else if (brightness < 0.5) {
        return 'overlay'; // For dark skin
      } else if (brightness < 0.7) {
        return 'multiply'; // For medium skin
      } else {
        return 'darken'; // For light skin
      }
    }
  
    // Recommend opacity based on skin tone
    recommendOpacity(r, g, b) {
      const brightness = (r + g + b) / 3 / 255;
      
      // Darker skin tones may need slightly higher opacity
      return 0.75 + (1 - brightness) * 0.15;
    }
  }