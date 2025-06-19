// Shared tattoo options for complexity, placement, and size

export const complexityLevels = [
  { value: 'simple', label: 'Simple', description: 'Clean, basic design (1-3 elements)' },
  { value: 'medium', label: 'Medium', description: 'Moderate detail (3-5 elements)' },
  { value: 'complex', label: 'Complex', description: 'Highly detailed (5+ elements)' },
  { value: 'masterpiece', label: 'Masterpiece', description: 'Maximum detail and artistry' }
];

export const placementOptions = [
  { value: 'generic', label: 'Generic Design', description: 'Standalone design' },
  { value: 'forearm', label: 'Forearm', description: 'Vertical orientation, medium size' },
  { value: 'bicep', label: 'Bicep', description: 'Curved placement, bold design' },
  { value: 'shoulder', label: 'Shoulder', description: 'Circular/curved composition' },
  { value: 'back', label: 'Back', description: 'Large canvas, detailed work' },
  { value: 'chest', label: 'Chest', description: 'Symmetrical, powerful placement' },
  { value: 'wrist', label: 'Wrist', description: 'Small, delicate design' },
  { value: 'ankle', label: 'Ankle', description: 'Compact, elegant placement' },
  { value: 'neck', label: 'Neck', description: 'Bold statement piece' },
  { value: 'thigh', label: 'Thigh', description: 'Large area, detailed possibilities' },
  { value: 'ribcage', label: 'Ribcage', description: 'Curved, flowing design' },
  { value: 'calf', label: 'Calf', description: 'Vertical space, good visibility' }
];

export const sizeOptions = [
  { value: 'tiny', label: 'Tiny (1-2\")', description: 'Coin-sized, minimal detail' },
  { value: 'small', label: 'Small (2-4\")', description: 'Palm-sized, simple elements' },
  { value: 'medium', label: 'Medium (4-6\")', description: 'Hand-sized, good detail' },
  { value: 'large', label: 'Large (6-10\")', description: 'Forearm-sized, complex detail' },
  { value: 'extra-large', label: 'XL (10\"+)', description: 'Major piece, maximum detail' }
];

export const styleCategories = [
  { id: 'all', name: 'All Styles' },
  { id: 'modern', name: 'Modern' },
  { id: 'traditional', name: 'Traditional' },
  { id: 'cultural', name: 'Cultural' },
  { id: 'artistic', name: 'Artistic' },
  { id: 'technical', name: 'Technical' }
];

export const tattooThemes = [
  { value: 'floral', label: 'Floral', icon: '🌸' },
  { value: 'stars', label: 'Stars & Cosmos', icon: '⭐' },
  { value: 'nature', label: 'Nature', icon: '🌿' },
  { value: 'geometric', label: 'Geometric', icon: '◆' },
  { value: 'symbols', label: 'Symbols', icon: '☯' },
  { value: 'animals', label: 'Small Animals', icon: '🦋' },
  { value: 'abstract', label: 'Abstract', icon: '🎨' },
  { value: 'ornamental', label: 'Ornamental', icon: '✨' }
];

export const examplePrompts = [
  'A majestic wolf howling at the moon',
  'Japanese cherry blossom branch with falling petals',
  'Geometric mandala with lotus flower center',
  'Minimalist mountain range silhouette with sunrise',
  'Celtic knot with hidden trinity symbol',
  'Watercolor butterfly emerging from chrysalis',
  'Biomechanical arm enhancement',
  'Traditional anchor with banner',
  'Dotwork sunflower in bloom',
  'Abstract ocean waves flow'
]; 