// components/RealisticARPreview/utils/constants.js

export const DEFAULTS = {
    SCALE_FACTOR: 0.15,
    OPACITY: 0.85,
    BLEND_MODE: 'multiply',
    OFFSET: { x: 0, y: 0, z: 0.01 },
    ROTATION: 0,
  };
  
  export const BLEND_MODES = [
    { value: 'normal', label: 'Normal' },
    { value: 'multiply', label: 'Multiply' },
    { value: 'screen', label: 'Screen' },
    { value: 'overlay', label: 'Overlay' },
    { value: 'darken', label: 'Darken' },
    { value: 'lighten', label: 'Lighten' },
    { value: 'color-dodge', label: 'Color Dodge' },
    { value: 'color-burn', label: 'Color Burn' },
    { value: 'hard-light', label: 'Hard Light' },
    { value: 'soft-light', label: 'Soft Light' },
  ];
  
  export const BODY_PARTS = {
    'Arms': [
      'left-arm',
      'right-arm',
      'left-forearm',
      'right-forearm',
      'left-hand',
      'right-hand',
    ],
    'Torso': [
      'chest',
      'back',
      'neck',
      'abdomen',
    ],
    'Legs': [
      'left-leg',
      'right-leg',
      'left-calf',
      'right-calf',
      'left-foot',
      'right-foot',
    ],
    'Head': [
      'face',
    ],
  };
  
  export const DEBUG_MODE = process.env.NODE_ENV === 'development';
  
  export const CAMERA_CONSTRAINTS = {
    video: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      facingMode: 'user',
    },
  };
  
  export const MEDIAPIPE_CONFIG = {
    pose: {
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      smoothSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    },
    selfieSegmentation: {
      modelSelection: 1, // 0 = general, 1 = landscape
      selfieMode: true,
    },

  };

  const CONFIG = {
    mesh: {
      subdivisionLevels: { min: 1, max: 4 },
      curvatureThreshold: 0.3, // radians
      limbWidthMultiplier: 1.0,
      torsoSubdivisions: 8
    },
    rendering: {
      enableShadows: true,
      curvatureIntensity: 0.3,
      fresnelPower: 2.0
    },
    performance: {
      enableMeshCaching: true,
      maxCachedMeshes: 50,
      updateThreshold: 0.02 // minimum movement to trigger update
    }
  };