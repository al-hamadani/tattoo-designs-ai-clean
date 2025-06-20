/**
 * Professional Tattoo Prompt Builder - Enhanced for Industry-Leading Quality
 * Engineered to exceed blackink.ai standards with advanced tattoo terminology
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
    technique: 'perfect line work, symmetrical patterns, technical accuracy',
    composition: 'balanced proportions, repeating motifs, harmonious structure',
    details: 'crisp lines, precise angles, flawless symmetry'
  },
  minimalist: {
    core: 'minimalist tattoo aesthetic, clean simplicity, refined elegance',
    technique: 'fine line work, subtle shading, delicate execution',
    composition: 'negative space mastery, essential elements only, refined balance',
    details: 'ultra-fine lines, subtle details, sophisticated restraint'
  },
  watercolor: {
    core: 'watercolor tattoo style, fluid color transitions, artistic splashes',
    technique: 'gradient blending, color bleeding effects, painterly approach',
    composition: 'organic flow, natural color progression, artistic spontaneity',
    details: 'soft edges, color blending, artistic paint effects'
  },
  japanese: {
    core: 'traditional Japanese tattoo style, irezumi influence, cultural authenticity',
    technique: 'flowing composition, wind bars, traditional motifs',
    composition: 'curved flow lines, natural movement, organic arrangement',
    details: 'traditional Japanese elements, authentic cultural styling, masterful flow'
  },
  newschool: {
    core: 'new school tattoo style, cartoon influences, exaggerated features',
    technique: 'bold outlines, vibrant colors, dimensional shading',
    composition: 'dynamic poses, cartoon aesthetics, playful arrangement',
    details: 'thick black outlines, cartoon shading, dimensional effects'
  },
  neotraditional: {
    core: 'neo-traditional style, modern twist on classic, enhanced detail work',
    technique: 'varied line weights, dimensional shading, contemporary elements',
    composition: 'traditional subjects, modern execution, enhanced detail',
    details: 'decorative elements, ornamental details, contemporary enhancement'
  },
  tribal: {
    core: 'tribal tattoo design, cultural symbolism, bold geometric patterns',
    technique: 'solid black work, flowing curves, interconnected patterns',
    composition: 'rhythmic patterns, cultural authenticity, symbolic meaning',
    details: 'thick black lines, flowing tribal patterns, cultural significance'
  }
};

// Advanced complexity descriptors with professional terminology
const COMPLEXITY_ENHANCEMENT = {
  simple: {
    description: 'clean minimalist execution, essential elements only',
    technique: 'crisp line work, subtle shading, refined simplicity',
    details: 'fundamental shapes, basic shading, clean execution'
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
  },
  masterpiece: {
    description: 'museum-quality artwork, extraordinary detail, virtuoso execution',
    technique: 'master-level techniques, flawless execution, artistic brilliance',
    details: 'extraordinary detail, perfect technique, artistic mastery'
  }
};

// Professional placement optimization with anatomical awareness
const PLACEMENT_OPTIMIZATION = {
  forearm: {
    composition: 'vertical emphasis, anatomical flow, natural arm curve adaptation',
    proportion: 'elongated design, forearm proportions, muscle contour following',
    technical: 'wrap-around potential, visibility consideration, natural movement flow'
  },
  bicep: {
    composition: 'curved muscle adaptation, circular flow, bicep contour following',
    proportion: 'rounded composition, muscle definition enhancement, anatomical awareness',
    technical: 'muscle flex adaptation, curved surface optimization, dimensional flow'
  },
  shoulder: {
    composition: 'shoulder cap adaptation, natural deltoid curve, radiating design',
    proportion: 'shoulder blade consideration, joint movement accommodation, curved flow',
    technical: 'deltoid muscle flow, shoulder movement adaptation, anatomical integration'
  },
  back: {
    composition: 'spine alignment, bilateral symmetry, large canvas utilization',
    proportion: 'back muscle definition, shoulder blade integration, full back potential',
    technical: 'spinal column respect, muscle group integration, large-scale composition'
  },
  chest: {
    composition: 'pectoral muscle flow, sternum alignment, bilateral balance',
    proportion: 'chest muscle definition, ribcage consideration, symmetrical layout',
    technical: 'pectoral muscle adaptation, breathing movement consideration, anatomical flow'
  },
  wrist: {
    composition: 'delicate placement, wrist bone consideration, compact elegance',
    proportion: 'small scale mastery, wrist anatomy respect, delicate proportions',
    technical: 'fine line work, detailed execution, limited space optimization'
  },
  ankle: {
    composition: 'ankle bone accommodation, foot curve integration, delicate placement',
    proportion: 'small elegant design, ankle anatomy consideration, graceful curves',
    technical: 'bone structure respect, movement accommodation, delicate execution'
  },
  neck: {
    composition: 'cervical curve adaptation, jawline integration, bold statement',
    proportion: 'neck muscle flow, head movement consideration, proportional balance',
    technical: 'sensitive skin adaptation, bold design execution, anatomical awareness'
  },
  thigh: {
    composition: 'quadriceps muscle flow, leg curve adaptation, large canvas potential',
    proportion: 'thigh muscle definition, leg proportions, substantial design space',
    technical: 'muscle group integration, leg movement consideration, substantial coverage'
  },
  ribcage: {
    composition: 'rib line following, breathing accommodation, curved anatomical flow',
    proportion: 'ribcage expansion consideration, breathing movement adaptation, curved design',
    technical: 'rib structure respect, expansion accommodation, anatomical integration'
  },
  calf: {
    composition: 'calf muscle definition, leg curve following, proportional design',
    proportion: 'lower leg proportions, muscle contour adaptation, balanced composition',
    technical: 'calf muscle flow, walking movement consideration, anatomical harmony'
  }
};

// Size descriptors with professional scale references
const SIZE_ENHANCEMENT = {
  tiny: {
    scale: 'micro-tattoo scale, coin-sized precision',
    technique: 'ultra-fine detail work, microscopic precision, delicate execution',
    approach: 'minimalist perfection, essential elements only, refined simplicity'
  },
  small: {
    scale: 'small-scale artistry, palm-sized composition',
    technique: 'detailed fine work, precise execution, intimate scale mastery',
    approach: 'concentrated detail, perfect proportions, skilled craftsmanship'
  },
  medium: {
    scale: 'medium format design, substantial presence',
    technique: 'balanced detail work, proportional execution, skillful rendering',
    approach: 'optimal detail level, professional execution, balanced composition'
  },
  large: {
    scale: 'large-scale artwork, commanding presence',
    technique: 'extensive detail work, major piece execution, artistic statement',
    approach: 'comprehensive design, substantial coverage, artistic impact'
  },
  'extra-large': {
    scale: 'major tattoo piece, extensive coverage',
    technique: 'masterpiece execution, extensive detail work, artistic tour de force',
    approach: 'full artistic expression, comprehensive coverage, major artistic statement'
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
 */
export function buildTattooPrompt(basePrompt, style, type = 'generate', options = {}) {
  let prompt = basePrompt.trim();
  
  // Get style enhancement
  const styleEnhancement = PROFESSIONAL_STYLE_ENHANCEMENTS[style] || PROFESSIONAL_STYLE_ENHANCEMENTS.traditional;
  
  if (type === 'coverup') {
    // Enhanced coverup prompting
    prompt += `, professional cover-up tattoo design, ${styleEnhancement.core}`;
    prompt += `, bold black ink coverage, heavy shading density, complete coverage design`;
    prompt += `, ${styleEnhancement.technique}, ${TATTOO_TECHNIQUES.blackwork}`;
    prompt += `, strategic negative space, coverage optimization, professional execution`;
    prompt += `, tattoo stencil ready, clean white background, no text elements`;
    
  } else if (type === 'gapfiller') {
    // Enhanced gap filler prompting
    prompt += `, professional gap filler tattoo design, ${styleEnhancement.core}`;
    prompt += `, small detailed elements, space-filling mastery, complementary design`;
    prompt += `, ${styleEnhancement.technique}, ${COMPOSITION_TECHNIQUES.balance}`;
    prompt += `, existing tattoo harmony, cohesive integration, professional filler work`;
    prompt += `, clean background, no text elements, design focus only`;
    
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
    
    // Enhanced placement optimization
    if (options.placement && options.placement !== 'generic' && PLACEMENT_OPTIMIZATION[options.placement]) {
      const placementData = PLACEMENT_OPTIMIZATION[options.placement];
      prompt += `, ${placementData.composition}, ${placementData.technical}`;
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