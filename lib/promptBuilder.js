export function buildTattooPrompt(basePrompt, style, type = 'generate', options = {}) {
  let prompt = basePrompt.trim();
  if (type === 'coverup') {
    prompt += `, ${style} style, bold black ink with heavy shading, dense pattern work, high contrast, designed to effectively cover existing tattoo, intricate details, complete coverage design, tattoo stencil ready, white background, no text, no words, no letters, design only`;
  } else if (type === 'gapfiller') {
    prompt += `, ${style} style tattoo design, small detailed elements, perfect for filling spaces between existing tattoos, complementary design, tattoo filler piece, clean design, white background, suitable for small spaces, cohesive with existing tattoos, no text, no words, no letters, design only`;
    if (options.theme) {
      prompt = `${options.theme} themed gap filler elements, ` + prompt;
    }
  } else {
    // generate.js logic
    prompt += `, ${style} tattoo style`;
    if (options.secondaryStyle && options.secondaryStyle !== 'none') {
      prompt += ` with ${options.secondaryStyle} influences`;
    }
    if (options.complexity) {
      const complexityMap = {
        simple: 'clean and simple',
        medium: 'moderate detail',
        complex: 'highly detailed',
        masterpiece: 'intricate masterpiece quality'
      };
      prompt += `, ${complexityMap[options.complexity]}`;
    }
    if (options.placement && options.placement !== 'generic') {
      const placementMap = {
        forearm: 'designed for forearm placement, vertical composition',
        bicep: 'designed for bicep placement, curved composition',
        shoulder: 'designed for shoulder placement, circular flow',
        back: 'designed for back placement, large scale composition',
        chest: 'designed for chest placement, symmetrical layout',
        wrist: 'designed for wrist placement, compact and delicate',
        ankle: 'designed for ankle placement, small elegant design',
        neck: 'designed for neck placement, bold statement',
        thigh: 'designed for thigh placement, vertical emphasis',
        ribcage: 'designed for ribcage placement, curved flowing lines',
        calf: 'designed for calf placement, good proportions'
      };
      prompt += `, ${placementMap[options.placement]}`;
    }
    if (options.size) {
      const sizeMap = {
        tiny: 'tiny detailed design, coin-sized',
        small: 'small intricate design, palm-sized',
        medium: 'medium sized design with good detail',
        large: 'large detailed design, forearm-sized',
        'extra-large': 'extra large detailed design, major tattoo piece'
      };
      prompt += `, ${sizeMap[options.size]}`;
    }
    prompt += ', black and white tattoo design, clean white background, high contrast, professional tattoo art, stencil ready';
    if (options.randomSeed) {
      prompt += `, unique design ${options.randomSeed}`;
    }
  }
  return prompt;
} 