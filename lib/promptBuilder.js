/**
 * Professional Tattoo Prompt Builder - Enhanced for Industry-Leading Quality
 * FIXED VERSION - Resolves all syntax errors and production issues
 */

// Professional tattoo composition techniques
const COMPOSITION_TECHNIQUES = {
  flow: 'dynamic visual flow, natural body curve adaptation, anatomical harmony',
  balance: 'visual weight distribution, compositional balance, symmetrical elements',
  depth: 'layered depth, dimensional shading, spatial hierarchy',
  movement: 'implied motion, directional lines, kinetic energy',
  focus: 'clear focal point, visual hierarchy, strategic emphasis'
};

// Advanced tattoo technical terminology
const TATTOO_TECHNIQUES = {
  linework: 'precise linework, clean outlines, consistent line weight, technical precision',
  shading: 'smooth gradient shading, realistic shadow work, dimensional form',
  dotwork: 'stippling technique, pointillism shading, dot density variation',
  blackwork: 'solid black fill, negative space utilization, high contrast areas',
  whipshading: 'traditional whip shading, smooth transitions, graduated tones',
  realism: 'photorealistic rendering, accurate proportions, lifelike details',
  geometric: 'mathematical precision, clean geometric forms, perfect symmetry'
};

// Professional style enhancements with industry terminology
const PROFESSIONAL_STYLE_ENHANCEMENTS = {
  traditional: {
    core: 'traditional American tattoo style, bold outlines, limited color palette',
    technique: 'solid black linework, classic shading, vintage aesthetic',
    composition: 'iconic imagery, bold design elements, timeless appeal',
    details: 'thick black outlines, traditional color blocking, old school charm'
  },
  realism: {
    core: 'photorealistic tattoo art, lifelike representation, detailed rendering',
    technique: 'smooth gradient work, realistic shadows, precise detail work',
    composition: 'natural proportions, realistic lighting, dimensional depth',
    details: 'fine detail work, realistic textures, accurate anatomy'
  },
  blackwork: {
    core: 'bold blackwork style, high contrast design, negative space utilization',
    technique: 'solid black application, geometric patterns, tribal influences',
    composition: 'strong silhouettes, dramatic contrast, architectural elements',
    details: 'deep black saturation, clean negative space, bold graphic elements'
  },
  geometric: {
    core: 'geometric tattoo design, mathematical precision, sacred geometry',
    technique: 'precise angles, clean geometry, symmetrical patterns',
    composition: 'mathematical harmony, geometric balance, sacred proportions',
    details: 'perfect symmetry, clean angles, precise measurements'
  },
  minimalist: {
    core: 'minimalist tattoo style, clean simplicity, refined elegance',
    technique: 'fine line work, minimal shading, subtle details',
    composition: 'elegant simplicity, refined composition, understated beauty',
    details: 'delicate lines, minimal elements, sophisticated restraint'
  },
  watercolor: {
    core: 'watercolor tattoo style, fluid color transitions, painterly effects',
    technique: 'soft color blending, watercolor effects, artistic flow',
    composition: 'organic color flow, artistic composition, painterly beauty',
    details: 'soft color edges, watercolor splashes, artistic effects'
  },
  neotraditional: {
    core: 'neo-traditional tattoo style, modern interpretation, enhanced detail',
    technique: 'varied line weights, enhanced shading, contemporary approach',
    composition: 'traditional motifs, modern execution, artistic evolution',
    details: 'enhanced detail work, contemporary shading, artistic refinement'
  }
};

// Complexity enhancement mapping
const COMPLEXITY_ENHANCEMENT = {
  simple: {
    description: 'clean simple design, fundamental elements, essential form',
    technique: 'basic linework, fundamental shapes, basic shading, clean execution',
    details: 'minimal complexity, clean execution, essential elements'
  },
  medium: {
    description: 'balanced detail work, moderate complexity, skilled execution',
    technique: 'varied line weights, gradient shading, compositional interest',
    details: 'moderate detail level, skillful shading, balanced elements'
  },
  complex: {
    description: 'intricate detail work, advanced techniques, masterful execution',
    technique: 'complex shading, fine detail work, technical mastery',
    details: 'extensive detail, multiple techniques, professional craftsmanship'
  }
};

// Size enhancement mapping
const SIZE_ENHANCEMENT = {
  small: {
    scale: 'compact design, intimate scale, precise detail',
    technique: 'fine detail work, precise execution, small-scale mastery',
    approach: 'delicate precision, intimate detail, refined execution'
  },
  medium: {
    scale: 'balanced proportions, moderate coverage, harmonious scale',
    technique: 'balanced detail level, proportionate execution, moderate coverage',
    approach: 'balanced composition, moderate impact, harmonious presence'
  },
  large: {
    scale: 'bold statement piece, substantial coverage, commanding presence',
    technique: 'extensive detail work, large-scale execution, substantial coverage',
    approach: 'bold artistic statement, commanding presence, substantial coverage'
  }
};

// Advanced negative prompting for tattoo quality
const QUALITY_NEGATIVE_PROMPTS = {
  artistic: 'amateur work, poor execution, bad linework, uneven shading, poor composition, sloppy execution',
  technical: 'blurry lines, pixelated, low resolution, distorted proportions, bad anatomy, poor detail',
  aesthetic: 'ugly, unappealing, childish, cartoon-like, amateur tattoo, prison tattoo, scratchy lines',
  color: 'colored background, rainbow colors, neon colors, garish colors, inappropriate coloring',
  text: 'text, words, letters, numbers, signatures, watermarks, logos, brand names',
  quality: 'low quality, poor quality, bad quality, amateur, unprofessional, rough execution'
};

/**
 * Enhanced Professional Tattoo Prompt Builder
 * Industry-leading prompt engineering for superior tattoo generation
 * FIXED VERSION - All syntax errors resolved
 */
export function buildTattooPrompt(basePrompt, style, type = 'generate', options = {}) {
  let prompt = basePrompt.trim();
  
  // Get style enhancement safely
  const styleEnhancement = PROFESSIONAL_STYLE_ENHANCEMENTS[style] || PROFESSIONAL_STYLE_ENHANCEMENTS.traditional;
  
  if (type === 'coverup') {
    // Enhanced coverup prompting
    prompt += `, professional cover-up tattoo design, ${styleEnhancement.core}`;
    prompt += `, bold black ink coverage, heavy shading density, complete coverage design`;
    prompt += `, ${styleEnhancement.technique}, ${TATTOO_TECHNIQUES.blackwork}`;
    prompt += `, strategic negative space, coverage optimization, professional execution`;
    prompt += `, tattoo stencil ready, clean white background, no text elements`;
    
  } else if (type === 'gapfiller') {
    // FIXED: Enhanced gap filler prompting
    prompt += `, professional gap filler tattoo design, ${styleEnhancement.core}`;
    prompt += `, small detailed elements, space-filling mastery, complementary design`;
    prompt += `, ${styleEnhancement.technique}, ${COMPOSITION_TECHNIQUES.balance}`;
    prompt += `, existing tattoo harmony, cohesive integration, professional filler work`;
    prompt += `, clean background, no text elements, design focus only`;
    
    // FIXED: Proper theme handling for gap fillers
    if (options.theme) {
      prompt = `${options.theme} themed professional gap filler elements, ` + prompt;
    }
    
  } else {
    // Enhanced standard generation
    prompt += `, ${styleEnhancement.core}`;
    
    // Add secondary style influence
    if (options.secondaryStyle && options.secondaryStyle !== 'none') {
      const secondaryEnhancement = PROFESSIONAL_STYLE_ENHANCEMENTS[options.secondaryStyle];
      if (secondaryEnhancement) {
        prompt += ` with ${secondaryEnhancement.core} influences`;
      }
    }
    
    // Enhanced complexity with professional terminology
    if (options.complexity && COMPLEXITY_ENHANCEMENT[options.complexity]) {
      const complexityData = COMPLEXITY_ENHANCEMENT[options.complexity];
      prompt += `, ${complexityData.description}, ${complexityData.technique}`;
    }
    
    // Enhanced size descriptions
    if (options.size && SIZE_ENHANCEMENT[options.size]) {
      const sizeData = SIZE_ENHANCEMENT[options.size];
      prompt += `, ${sizeData.scale}, ${sizeData.technique}`;
    }
    
    // Core tattoo quality specifications
    prompt += `, ${styleEnhancement.technique}, ${styleEnhancement.details}`;
    prompt += `, ${COMPOSITION_TECHNIQUES.flow}, ${COMPOSITION_TECHNIQUES.depth}`;
    prompt += `, professional tattoo artwork, industry standard execution`;
    prompt += `, clean white background, high contrast, stencil ready design`;
    prompt += `, masterful craftsmanship, tattoo artist quality`;
    
    // Add uniqueness factor
    if (options.randomSeed) {
      prompt += `, unique artistic interpretation ${options.randomSeed}`;
    }
  }
  
  return prompt;
}

/**
 * Generate comprehensive negative prompt for tattoo quality
 */
export function buildTattooNegativePrompt() {
  return [
    QUALITY_NEGATIVE_PROMPTS.artistic,
    QUALITY_NEGATIVE_PROMPTS.technical,
    QUALITY_NEGATIVE_PROMPTS.aesthetic,
    QUALITY_NEGATIVE_PROMPTS.color,
    QUALITY_NEGATIVE_PROMPTS.text,
    QUALITY_NEGATIVE_PROMPTS.quality
  ].join(', ');
}

/**
 * Get style-specific enhancement parameters
 */
export function getStyleParameters(style) {
  const enhancement = PROFESSIONAL_STYLE_ENHANCEMENTS[style] || PROFESSIONAL_STYLE_ENHANCEMENTS.traditional;
  return {
    guidanceScale: style === 'realism' ? 9.5 : style === 'geometric' ? 10 : 8.5,
    steps: style === 'realism' ? 60 : style === 'minimalist' ? 40 : 50,
    strength: style === 'blackwork' ? 0.9 : style === 'watercolor' ? 0.7 : 0.8
  };
}