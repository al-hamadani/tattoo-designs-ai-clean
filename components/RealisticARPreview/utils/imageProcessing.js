// components/RealisticARPreview/utils/imageProcessing.js
export const compositeWithSegmentation = ({
    ctx,
    threeCanvas,
    segmentationMask,
    width,
    height,
    blendMode,
    opacity
  }) => {
    // Create temporary canvas for masking
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    
    // Draw three.js render
    tempCtx.drawImage(threeCanvas, 0, 0);
    
    // Apply segmentation mask
    tempCtx.globalCompositeOperation = 'destination-in';
    tempCtx.drawImage(segmentationMask, 0, 0, width, height);
    
    // Draw masked result to main canvas
    ctx.globalCompositeOperation = blendMode;
    ctx.globalAlpha = opacity;
    ctx.drawImage(tempCanvas, 0, 0);
  };
  
  export const processVideoFrame = (video, canvas) => {
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return ctx;
  };
  
  export const applyImageFilters = (ctx, filters) => {
    const { brightness = 1, contrast = 1, blur = 0 } = filters;
    ctx.filter = `brightness(${brightness}) contrast(${contrast}) blur(${blur}px)`;
  };