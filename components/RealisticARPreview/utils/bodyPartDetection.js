// components/RealisticARPreview/utils/bodyPartDetection.js
import * as THREE from 'three';

export const smoothVector3 = (current, previous, alpha) => {
  if (!previous) return current.clone();
  return previous.clone().lerp(current, alpha);
};

// Calculate coverage of segmentation mask within a bounding box defined by landmarks
const getMaskCoverage = (mask, points, width, height) => {
  if (!mask || !points.length) return 1;
  try {
    const ctx = mask.getContext('2d');
    if (!ctx) return 1;
    const xs = points.map(p => p.x * width);
    const ys = points.map(p => p.y * height);
    const minX = Math.max(0, Math.min(...xs));
    const minY = Math.max(0, Math.min(...ys));
    const maxX = Math.min(width, Math.max(...xs));
    const maxY = Math.min(height, Math.max(...ys));
    const w = Math.max(1, maxX - minX);
    const h = Math.max(1, maxY - minY);
    const data = ctx.getImageData(minX, minY, w, h).data;
    let count = 0;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] > 128) count++;
    }
    return count / (data.length / 4);
  } catch {
    return 1;
  }
};

// Score a body part based on landmark visibility and segmentation coverage
const scoreBodyPart = ({ keys, landmarks, mask, width, height }) => {
  if (!keys.length) return 0;
  const pts = [];
  let vis = 0;
  keys.forEach(k => {
    const lm = landmarks[k];
    if (lm) {
      pts.push(lm);
      vis += lm.visibility ?? 1;
    }
  });
  const visibilityScore = vis / keys.length;
  const coverage = getMaskCoverage(mask, pts, width, height);
  return visibilityScore * coverage;
};

// Add this to the existing file after the imports

// Enhanced transform calculation with mesh deformation hints
export const calculateTattooTransform = ({
  bodyPart,
  detectedParts,
  landmarks,
  segmentationMask,
  dimensions,
  settings,
  design
}) => {
  const { width, height } = dimensions;
  const { scaleFactor, offset, rotationDeg, enablePose } = settings;
  
  // Manual mode - always visible
  if (!enablePose || bodyPart === 'manual') {
    return {
      position: {
        x: offset.x * width,
        y: offset.y * height,
        z: offset.z
      },
      rotation: (rotationDeg * Math.PI) / 180,
      scale: {
        x: width * scaleFactor * 0.5,
        y: width * scaleFactor * 0.5,
        z: 1
      },
      visible: true,
      meshHints: {
        curvature: 0.1,
        twist: 0,
        bendAngle: 0
      }
    };
  }

  // Auto-detect best body part
  if (bodyPart === 'auto') {
    return autoDetectTransform({ detectedParts, landmarks, segmentationMask, dimensions, settings, design });
  }

  // Get base transform from existing functions
  const baseTransform = getBaseTransform(bodyPart, landmarks, detectedParts, dimensions, settings, design);
  
  // Enhance with mesh deformation hints
  if (baseTransform.visible) {
    baseTransform.meshHints = calculateMeshHints(bodyPart, landmarks, dimensions);
  }
  
  return baseTransform;
};

// Calculate mesh deformation hints based on pose
const calculateMeshHints = (bodyPart, landmarks, dimensions) => {
  const hints = {
    curvature: 0.1,
    twist: 0,
    bendAngle: 0,
    surfaceNormal: { x: 0, y: 0, z: 1 }
  };
  
  if (bodyPart.includes('arm')) {
    const side = bodyPart.includes('left') ? 'left' : 'right';
    const shoulder = landmarks[`${side}Shoulder`];
    const elbow = landmarks[`${side}Elbow`];
    const wrist = landmarks[`${side}Wrist`];
    
    if (shoulder && elbow && wrist) {
      // Calculate bend angle
      const upperArm = new THREE.Vector3(
        elbow.x - shoulder.x,
        elbow.y - shoulder.y,
        (elbow.z || 0) - (shoulder.z || 0)
      );
      const forearm = new THREE.Vector3(
        wrist.x - elbow.x,
        wrist.y - elbow.y,
        (wrist.z || 0) - (elbow.z || 0)
      );
      
      hints.bendAngle = upperArm.angleTo(forearm);
      hints.curvature = (hints.bendAngle / Math.PI) * 0.5;
      
      // Calculate twist from hand orientation
      const pinky = landmarks[`${side}Pinky`];
      const index = landmarks[`${side}Index`];
      if (pinky && index) {
        const handDir = new THREE.Vector3(
          index.x - pinky.x,
          index.y - pinky.y,
          0
        );
        hints.twist = Math.atan2(handDir.y, handDir.x);
      }
      
      // Estimate surface normal
      const armDir = forearm.normalize();
      const up = new THREE.Vector3(0, 1, 0);
      hints.surfaceNormal = new THREE.Vector3()
        .crossVectors(armDir, up)
        .normalize();
    }
  } else if (bodyPart === 'chest' || bodyPart === 'back') {
    // Calculate torso curvature
    const leftShoulder = landmarks.leftShoulder;
    const rightShoulder = landmarks.rightShoulder;
    const leftHip = landmarks.leftHip;
    const rightHip = landmarks.rightHip;
    
    if (leftShoulder && rightShoulder && leftHip && rightHip) {
      // Estimate chest/back curvature from shoulder-hip alignment
      const shoulderWidth = Math.abs(rightShoulder.x - leftShoulder.x);
      const hipWidth = Math.abs(rightHip.x - leftHip.x);
      
      hints.curvature = Math.abs(shoulderWidth - hipWidth) * 0.5;
      
      // Calculate surface normal from body orientation
      const shoulderMid = {
        x: (leftShoulder.x + rightShoulder.x) / 2,
        y: (leftShoulder.y + rightShoulder.y) / 2,
        z: ((leftShoulder.z || 0) + (rightShoulder.z || 0)) / 2
      };
      const hipMid = {
        x: (leftHip.x + rightHip.x) / 2,
        y: (leftHip.y + rightHip.y) / 2,
        z: ((leftHip.z || 0) + (rightHip.z || 0)) / 2
      };
      
      const torsoDir = new THREE.Vector3(
        hipMid.x - shoulderMid.x,
        hipMid.y - shoulderMid.y,
        hipMid.z - shoulderMid.z
      ).normalize();
      
      const side = new THREE.Vector3(
        rightShoulder.x - leftShoulder.x,
        rightShoulder.y - leftShoulder.y,
        (rightShoulder.z || 0) - (leftShoulder.z || 0)
      ).normalize();
      
      hints.surfaceNormal = new THREE.Vector3()
        .crossVectors(side, torsoDir)
        .normalize();
      
      // Flip normal for back
      if (bodyPart === 'back') {
        hints.surfaceNormal.multiplyScalar(-1);
      }
    }
  }
  
  return hints;
};

// Helper function to get base transform (extract from existing switch cases)
const getBaseTransform = (bodyPart, landmarks, detectedParts, dimensions, settings, design) => {
  const transformFunctions = {
    'left-arm': () => getArmTransform('left', landmarks, detectedParts, dimensions, settings, design),
    'right-arm': () => getArmTransform('right', landmarks, detectedParts, dimensions, settings, design),
    'left-forearm': () => getForearmTransform('left', landmarks, dimensions, settings, design),
    'right-forearm': () => getForearmTransform('right', landmarks, dimensions, settings, design),
    'left-hand': () => getHandTransform('left', landmarks, dimensions, settings, design),
    'right-hand': () => getHandTransform('right', landmarks, dimensions, settings, design),
    'chest': () => getChestTransform(landmarks, detectedParts, dimensions, settings, design),
    'back': () => getBackTransform(landmarks, detectedParts, dimensions, settings, design),
    'neck': () => getNeckTransform(landmarks, dimensions, settings, design),
    'face': () => getFaceTransform(landmarks, detectedParts, dimensions, settings, design),
    'left-leg': () => getLegTransform('left', landmarks, detectedParts, dimensions, settings, design),
    'right-leg': () => getLegTransform('right', landmarks, detectedParts, dimensions, settings, design),
    'left-calf': () => getCalfTransform('left', landmarks, dimensions, settings, design),
    'right-calf': () => getCalfTransform('right', landmarks, dimensions, settings, design),
    'left-foot': () => getFootTransform('left', landmarks, dimensions, settings, design),
    'right-foot': () => getFootTransform('right', landmarks, dimensions, settings, design),
  };

  const transformFunc = transformFunctions[bodyPart];
  if (transformFunc) {
    return transformFunc();
  }

  return { visible: false };
};
// Auto-detect best placement
const autoDetectTransform = ({ detectedParts, landmarks, segmentationMask, dimensions, settings, design }) => {
  const { width, height } = dimensions;
  const candidates = [
    { key: 'rightArm',  landmarks: ['rightShoulder','rightElbow','rightWrist'], transform: () => getArmTransform('right', landmarks, detectedParts, dimensions, settings, design) },
    { key: 'leftArm',   landmarks: ['leftShoulder','leftElbow','leftWrist'],  transform: () => getArmTransform('left', landmarks, detectedParts, dimensions, settings, design) },
    { key: 'chest',     landmarks: ['leftShoulder','rightShoulder','leftHip','rightHip'], transform: () => getChestTransform(landmarks, detectedParts, dimensions, settings, design) },
    { key: 'back',      landmarks: ['leftShoulder','rightShoulder','leftHip','rightHip'], transform: () => getBackTransform(landmarks, detectedParts, dimensions, settings, design) },
    { key: 'rightLeg',  landmarks: ['rightHip','rightKnee','rightAnkle'], transform: () => getLegTransform('right', landmarks, detectedParts, dimensions, settings, design) },
    { key: 'leftLeg',   landmarks: ['leftHip','leftKnee','leftAnkle'],  transform: () => getLegTransform('left', landmarks, detectedParts, dimensions, settings, design) },
    { key: 'neck',      landmarks: ['nose','leftShoulder','rightShoulder'], transform: () => getNeckTransform(landmarks, dimensions, settings, design) },
    { key: 'face',      landmarks: ['nose','leftEye','rightEye'], transform: () => getFaceTransform(landmarks, detectedParts, dimensions, settings, design) }
  ];

  candidates.forEach(c => {
    c.score = scoreBodyPart({ keys: c.landmarks, landmarks, mask: segmentationMask, width, height });
  });
  candidates.sort((a,b) => b.score - a.score);
  const best = candidates[0];
  if (!best || best.score < 0.25) return { visible: false };
  return best.transform();
};

// Arm transforms
const getArmTransform = (side, landmarks, detectedParts, dimensions, settings, design) => {
  const { width, height } = dimensions;
  const { scaleFactor, offset, rotationDeg } = settings;
  
  const shoulder = landmarks[`${side}Shoulder`];
  const elbow = landmarks[`${side}Elbow`];
  const wrist = landmarks[`${side}Wrist`];
  
  if (!shoulder || !elbow) return { visible: false };
  
  // Full arm
  if (wrist) {
    const shoulderPos = new THREE.Vector3(
      shoulder.x * width - width / 2,
      shoulder.y * height - height / 2,
      0
    );
    const wristPos = new THREE.Vector3(
      wrist.x * width - width / 2,
      wrist.y * height - height / 2,
      0
    );
    
    const mid = shoulderPos.clone().add(wristPos).multiplyScalar(0.5);
    const dir = wristPos.clone().sub(shoulderPos);
    
    return {
      position: {
        x: mid.x + offset.x * width,
        y: mid.y + offset.y * height,
        z: offset.z
      },
      rotation: Math.atan2(dir.y, dir.x) + (rotationDeg * Math.PI) / 180,
      scale: {
        x: dir.length() * scaleFactor * 0.8,
        y: dir.length() * scaleFactor * 0.3,
        z: 1
      },
      visible: true
    };
  }
  
  // Upper arm only
  const shoulderPos = new THREE.Vector3(
    shoulder.x * width - width / 2,
    shoulder.y * height - height / 2,
    0
  );
  const elbowPos = new THREE.Vector3(
    elbow.x * width - width / 2,
    elbow.y * height - height / 2,
    0
  );
  
  const mid = shoulderPos.clone().add(elbowPos).multiplyScalar(0.5);
  const dir = elbowPos.clone().sub(shoulderPos);
  
  return {
    position: {
      x: mid.x + offset.x * width,
      y: mid.y + offset.y * height,
      z: offset.z
    },
    rotation: Math.atan2(dir.y, dir.x) + (rotationDeg * Math.PI) / 180,
    scale: {
      x: dir.length() * scaleFactor,
      y: dir.length() * scaleFactor * 0.4,
      z: 1
    },
    visible: true
  };
};

// Forearm transforms
const getForearmTransform = (side, landmarks, dimensions, settings, design) => {
  const { width, height } = dimensions;
  const { scaleFactor, offset, rotationDeg } = settings;
  
  const elbow = landmarks[`${side}Elbow`];
  const wrist = landmarks[`${side}Wrist`];
  
  if (!elbow || !wrist) return { visible: false };
  
  const elbowPos = new THREE.Vector3(
    elbow.x * width - width / 2,
    elbow.y * height - height / 2,
    0
  );
  const wristPos = new THREE.Vector3(
    wrist.x * width - width / 2,
    wrist.y * height - height / 2,
    0
  );
  
  const mid = elbowPos.clone().add(wristPos).multiplyScalar(0.5);
  const dir = wristPos.clone().sub(elbowPos);
  
  return {
    position: {
      x: mid.x + offset.x * width,
      y: mid.y + offset.y * height,
      z: offset.z
    },
    rotation: Math.atan2(dir.y, dir.x) + (rotationDeg * Math.PI) / 180,
    scale: {
      x: dir.length() * scaleFactor,
      y: dir.length() * scaleFactor * 0.5,
      z: 1
    },
    visible: true
  };
};

// Hand transforms
const getHandTransform = (side, landmarks, dimensions, settings, design) => {
  const { width, height } = dimensions;
  const { scaleFactor, offset, rotationDeg } = settings;
  
  const wrist = landmarks[`${side}Wrist`];
  const index = landmarks[`${side}Index`];
  const pinky = landmarks[`${side}Pinky`];
  
  if (!wrist) return { visible: false };
  
  const wristPos = new THREE.Vector3(
    wrist.x * width - width / 2,
    wrist.y * height - height / 2,
    0
  );
  
  let rotation = (rotationDeg * Math.PI) / 180;
  
  // Calculate hand orientation if fingers are visible
  if (index && pinky) {
    const fingerDir = new THREE.Vector3(
      index.x - wrist.x,
      index.y - wrist.y,
      0
    );
    rotation = Math.atan2(fingerDir.y, fingerDir.x) + rotation;
  }
  
  return {
    position: {
      x: wristPos.x + offset.x * width,
      y: wristPos.y + offset.y * height,
      z: offset.z
    },
    rotation,
    scale: {
      x: width * scaleFactor * 0.3,
      y: width * scaleFactor * 0.3 * (design?.aspectRatio || 1),
      z: 1
    },
    visible: true
  };
};

// Chest transform
const getChestTransform = (landmarks, detectedParts, dimensions, settings, design) => {
  const { width, height } = dimensions;
  const { scaleFactor, offset, rotationDeg } = settings;
  
  const leftShoulder = landmarks.leftShoulder;
  const rightShoulder = landmarks.rightShoulder;
  const leftHip = landmarks.leftHip;
  const rightHip = landmarks.rightHip;
  
  if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) return { visible: false };
  
  // Calculate center of chest
  const chestCenter = new THREE.Vector3(
    ((leftShoulder.x + rightShoulder.x + leftHip.x + rightHip.x) / 4) * width - width / 2,
    ((leftShoulder.y + rightShoulder.y) / 2) * height - height / 2,
    0
  );
  
  // Calculate chest width
  const chestWidth = Math.abs(rightShoulder.x - leftShoulder.x) * width;
  
  return {
    position: {
      x: chestCenter.x + offset.x * width,
      y: chestCenter.y + offset.y * height,
      z: offset.z
    },
    rotation: (rotationDeg * Math.PI) / 180,
    scale: {
      x: chestWidth * scaleFactor * 0.8,
      y: chestWidth * scaleFactor * 0.8 * (design?.aspectRatio || 1),
      z: 1
    },
    visible: true
  };
};

// Back transform
const getBackTransform = (landmarks, detectedParts, dimensions, settings, design) => {
  // Similar to chest but adjusted for back view
  return getChestTransform(landmarks, detectedParts, dimensions, settings, design);
};

// Neck transform
const getNeckTransform = (landmarks, dimensions, settings, design) => {
  const { width, height } = dimensions;
  const { scaleFactor, offset, rotationDeg } = settings;
  
  const nose = landmarks.nose;
  const leftShoulder = landmarks.leftShoulder;
  const rightShoulder = landmarks.rightShoulder;
  
  if (!nose || (!leftShoulder && !rightShoulder)) return { visible: false };
  
  const shoulder = leftShoulder || rightShoulder;
  
  const neckCenter = new THREE.Vector3(
    nose.x * width - width / 2,
    ((nose.y + shoulder.y) / 2) * height - height / 2,
    0
  );
  
  return {
    position: {
      x: neckCenter.x + offset.x * width,
      y: neckCenter.y + offset.y * height,
      z: offset.z
    },
    rotation: (rotationDeg * Math.PI) / 180,
    scale: {
      x: width * scaleFactor * 0.4,
      y: width * scaleFactor * 0.4 * (design?.aspectRatio || 1),
      z: 1
    },
    visible: true
  };
};

// Face transform
const getFaceTransform = (landmarks, detectedParts, dimensions, settings, design) => {
  const { width, height } = dimensions;
  const { scaleFactor, offset, rotationDeg } = settings;
  
  const nose = landmarks.nose;
  const leftEye = landmarks.leftEye;
  const rightEye = landmarks.rightEye;
  
  if (!nose) return { visible: false };
  
  const faceCenter = new THREE.Vector3(
    nose.x * width - width / 2,
    nose.y * height - height / 2,
    0
  );
  
  // Adjust for profile views
  let rotation = (rotationDeg * Math.PI) / 180;
  if (detectedParts.face.orientation === 'left-profile') {
    rotation += Math.PI / 4;
  } else if (detectedParts.face.orientation === 'right-profile') {
    rotation -= Math.PI / 4;
  }
  
  // Calculate face size
  let faceWidth = width * scaleFactor * 0.3;
  if (leftEye && rightEye) {
    const eyeDistance = Math.abs(rightEye.x - leftEye.x) * width;
    faceWidth = eyeDistance * scaleFactor * 3;
  }
  
  return {
    position: {
      x: faceCenter.x + offset.x * width,
      y: faceCenter.y + offset.y * height,
      z: offset.z
    },
    rotation,
    scale: {
      x: faceWidth,
      y: faceWidth * (design?.aspectRatio || 1),
      z: 1
    },
    visible: true
  };
};

// Leg transforms
const getLegTransform = (side, landmarks, detectedParts, dimensions, settings, design) => {
  const { width, height } = dimensions;
  const { scaleFactor, offset, rotationDeg } = settings;
  
  const hip = landmarks[`${side}Hip`];
  const knee = landmarks[`${side}Knee`];
  const ankle = landmarks[`${side}Ankle`];
  
  if (!hip || !knee) return { visible: false };
  
  // Full leg
  if (ankle) {
    const hipPos = new THREE.Vector3(
      hip.x * width - width / 2,
      hip.y * height - height / 2,
      0
    );
    const anklePos = new THREE.Vector3(
      ankle.x * width - width / 2,
      ankle.y * height - height / 2,
      0
    );
    
    const mid = hipPos.clone().add(anklePos).multiplyScalar(0.5);
    const dir = anklePos.clone().sub(hipPos);
    
    return {
      position: {
        x: mid.x + offset.x * width,
        y: mid.y + offset.y * height,
        z: offset.z
      },
      rotation: Math.atan2(dir.y, dir.x) + (rotationDeg * Math.PI) / 180,
      scale: {
        x: dir.length() * scaleFactor * 0.3,
        y: dir.length() * scaleFactor * 0.8,
        z: 1
      },
      visible: true
    };
  }
  
  // Upper leg only
  const hipPos = new THREE.Vector3(
    hip.x * width - width / 2,
    hip.y * height - height / 2,
    0
  );
  const kneePos = new THREE.Vector3(
    knee.x * width - width / 2,
    knee.y * height - height / 2,
    0
  );
  
  const mid = hipPos.clone().add(kneePos).multiplyScalar(0.5);
  const dir = kneePos.clone().sub(hipPos);
  
  return {
    position: {
      x: mid.x + offset.x * width,
      y: mid.y + offset.y * height,
      z: offset.z
    },
    rotation: Math.atan2(dir.y, dir.x) + (rotationDeg * Math.PI) / 180,
    scale: {
      x: dir.length() * scaleFactor * 0.5,
      y: dir.length() * scaleFactor,
      z: 1
    },
    visible: true
  };
};

// Calf transforms
const getCalfTransform = (side, landmarks, dimensions, settings, design) => {
  const { width, height } = dimensions;
  const { scaleFactor, offset, rotationDeg } = settings;
  
  const knee = landmarks[`${side}Knee`];
  const ankle = landmarks[`${side}Ankle`];
  
  if (!knee || !ankle) return { visible: false };
  
  const kneePos = new THREE.Vector3(
    knee.x * width - width / 2,
    knee.y * height - height / 2,
    0
  );
  const anklePos = new THREE.Vector3(
    ankle.x * width - width / 2,
    ankle.y * height - height / 2,
    0
  );
  
  const mid = kneePos.clone().add(anklePos).multiplyScalar(0.5);
  const dir = anklePos.clone().sub(kneePos);
  
  return {
    position: {
      x: mid.x + offset.x * width,
      y: mid.y + offset.y * height,
      z: offset.z
    },
    rotation: Math.atan2(dir.y, dir.x) + (rotationDeg * Math.PI) / 180,
    scale: {
      x: dir.length() * scaleFactor * 0.6,
      y: dir.length() * scaleFactor,
      z: 1
    },
    visible: true
  };
};

// Foot transforms
const getFootTransform = (side, landmarks, dimensions, settings, design) => {
  const { width, height } = dimensions;
  const { scaleFactor, offset, rotationDeg } = settings;
  
  const ankle = landmarks[`${side}Ankle`];
  const heel = landmarks[`${side}Heel`];
  const footIndex = landmarks[`${side}FootIndex`];
  
  if (!ankle) return { visible: false };
  
  const anklePos = new THREE.Vector3(
    ankle.x * width - width / 2,
    ankle.y * height - height / 2,
    0
  );
  
  let rotation = (rotationDeg * Math.PI) / 180;
  
  // Calculate foot orientation if toe is visible
  if (footIndex) {
    const footDir = new THREE.Vector3(
      footIndex.x - ankle.x,
      footIndex.y - ankle.y,
      0
    );
    rotation = Math.atan2(footDir.y, footDir.x) + rotation;
  }
  
  return {
    position: {
      x: anklePos.x + offset.x * width,
      y: anklePos.y + offset.y * height,
      z: offset.z
    },
    rotation,
    scale: {
      x: width * scaleFactor * 0.25,
      y: width * scaleFactor * 0.25 * (design?.aspectRatio || 1),
      z: 1
    },
    visible: true
  };
};

