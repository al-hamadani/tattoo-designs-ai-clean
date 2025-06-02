// components/RealisticARPreview/utils/bodyPartPlacement.js
import * as THREE from 'three';

// Optimized placement configurations for each body part
export const BODY_PART_CONFIGS = {
  'left-arm': {
    scale: { base: 0.8, aspect: 0.3 },
    offsetAdjust: { x: 0, y: 0 },
    rotationAdjust: 0,
    alignToLimb: true
  },
  'right-arm': {
    scale: { base: 0.8, aspect: 0.3 },
    offsetAdjust: { x: 0, y: 0 },
    rotationAdjust: 0,
    alignToLimb: true
  },
  'left-forearm': {
    scale: { base: 1.0, aspect: 0.5 },
    offsetAdjust: { x: 0, y: 0 },
    rotationAdjust: 0,
    alignToLimb: true
  },
  'right-forearm': {
    scale: { base: 1.0, aspect: 0.5 },
    offsetAdjust: { x: 0, y: 0 },
    rotationAdjust: 0,
    alignToLimb: true
  },
  'left-hand': {
    scale: { base: 0.3, aspect: 1.0 },
    offsetAdjust: { x: 0, y: 0 },
    rotationAdjust: 0,
    alignToLimb: false
  },
  'right-hand': {
    scale: { base: 0.3, aspect: 1.0 },
    offsetAdjust: { x: 0, y: 0 },
    rotationAdjust: 0,
    alignToLimb: false
  },
  'chest': {
    scale: { base: 0.8, aspect: 1.0 },
    offsetAdjust: { x: 0, y: 0 },
    rotationAdjust: 0,
    alignToLimb: false
  },
  'back': {
    scale: { base: 0.8, aspect: 1.0 },
    offsetAdjust: { x: 0, y: 0 },
    rotationAdjust: 0,
    alignToLimb: false
  },
  'neck': {
    scale: { base: 0.4, aspect: 1.0 },
    offsetAdjust: { x: 0, y: 0 },
    rotationAdjust: 0,
    alignToLimb: false
  },
  'face': {
    scale: { base: 0.3, aspect: 1.0 },
    offsetAdjust: { x: 0, y: 0 },
    rotationAdjust: 0,
    alignToLimb: false
  },
  'left-leg': {
    scale: { base: 0.3, aspect: 0.8 },
    offsetAdjust: { x: 0, y: 0 },
    rotationAdjust: Math.PI / 2,
    alignToLimb: true
  },
  'right-leg': {
    scale: { base: 0.3, aspect: 0.8 },
    offsetAdjust: { x: 0, y: 0 },
    rotationAdjust: Math.PI / 2,
    alignToLimb: true
  },
  'left-calf': {
    scale: { base: 0.6, aspect: 1.0 },
    offsetAdjust: { x: 0, y: 0 },
    rotationAdjust: Math.PI / 2,
    alignToLimb: true
  },
  'right-calf': {
    scale: { base: 0.6, aspect: 1.0 },
    offsetAdjust: { x: 0, y: 0 },
    rotationAdjust: Math.PI / 2,
    alignToLimb: true
  },
  'left-foot': {
    scale: { base: 0.25, aspect: 1.0 },
    offsetAdjust: { x: 0, y: 0 },
    rotationAdjust: 0,
    alignToLimb: false
  },
  'right-foot': {
    scale: { base: 0.25, aspect: 1.0 },
    offsetAdjust: { x: 0, y: 0 },
    rotationAdjust: 0,
    alignToLimb: false
  }
};

// Smart placement algorithm that considers body part anatomy
export const getSmartPlacement = (bodyPart, landmarks, dimensions, scaleFactor) => {
  const config = BODY_PART_CONFIGS[bodyPart];
  if (!config) return null;

  // Calculate base transform from bodyPartDetection
  const baseTransform = calculateBaseTransform(bodyPart, landmarks, dimensions);
  if (!baseTransform) return null;

  // Apply body part specific adjustments
  const adjustedTransform = {
    ...baseTransform,
    scale: {
      x: baseTransform.scale.x * config.scale.base,
      y: baseTransform.scale.y * config.scale.aspect,
      z: 1
    },
    rotation: baseTransform.rotation + config.rotationAdjust
  };

  // Apply user scale factor
  adjustedTransform.scale.x *= scaleFactor;
  adjustedTransform.scale.y *= scaleFactor;

  return adjustedTransform;
};

// Helper to calculate base transform (simplified version)
const calculateBaseTransform = (bodyPart, landmarks, dimensions) => {
  // This would use the existing calculateTattooTransform logic
  // but with cleaner separation of concerns
  const { width, height } = dimensions;
  
  // Example for arm placement
  if (bodyPart.includes('arm') || bodyPart.includes('forearm')) {
    const side = bodyPart.includes('left') ? 'left' : 'right';
    const shoulder = landmarks[`${side}Shoulder`];
    const elbow = landmarks[`${side}Elbow`];
    const wrist = landmarks[`${side}Wrist`];
    
    if (!shoulder || !elbow) return null;
    
    // Calculate position and rotation based on limb orientation
    let startPoint, endPoint;
    
    if (bodyPart.includes('forearm') && wrist) {
      startPoint = elbow;
      endPoint = wrist;
    } else if (wrist) {
      startPoint = shoulder;
      endPoint = wrist;
    } else {
      startPoint = shoulder;
      endPoint = elbow;
    }
    
    const start = new THREE.Vector3(
      startPoint.x * width - width / 2,
      startPoint.y * height - height / 2,
      0
    );
    const end = new THREE.Vector3(
      endPoint.x * width - width / 2,
      endPoint.y * height - height / 2,
      0
    );
    
    const center = start.clone().add(end).multiplyScalar(0.5);
    const direction = end.clone().sub(start);
    const length = direction.length();
    const angle = Math.atan2(direction.y, direction.x);
    
    return {
      position: { x: center.x, y: center.y, z: 0 },
      rotation: angle,
      scale: { x: length, y: length * 0.4, z: 1 },
      visible: true
    };
  }
  
  // Add other body part calculations...
  return null;
};