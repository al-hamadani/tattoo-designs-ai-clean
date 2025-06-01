// components/RealisticARPreview/utils/bodyPartDetection.js
import * as THREE from 'three';

export const smoothVector3 = (current, previous, alpha) => {
  if (!previous) return current.clone();
  return previous.clone().lerp(current, alpha);
};

export const calculateTattooTransform = ({
  bodyPart,
  detectedParts,
  landmarks,
  dimensions,
  settings,
  design
}) => {
  const { width, height } = dimensions;
  const { scaleFactor, offset, rotationDeg, enablePose } = settings;
  
  // Manual mode
  if (!enablePose || bodyPart === 'manual') {
    return {
      position: { 
        x: offset.x * width, 
        y: offset.y * height, 
        z: offset.z 
      },
      rotation: (rotationDeg * Math.PI) / 180,
      scale: {
        x: width * scaleFactor,
        y: width * scaleFactor * (design?.aspectRatio || 1),
        z: 1
      },
      visible: true
    };
  }

  // Auto-detect best body part
  if (bodyPart === 'auto') {
    return autoDetectTransform({ detectedParts, landmarks, dimensions, settings, design });
  }

  // Specific body part transforms
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
const autoDetectTransform = ({ detectedParts, landmarks, dimensions, settings, design }) => {
  // Priority order for auto-detection
  if (detectedParts.rightArm.visible && detectedParts.rightArm.section === 'full') {
    return getArmTransform('right', landmarks, detectedParts, dimensions, settings, design);
  }
  if (detectedParts.leftArm.visible && detectedParts.leftArm.section === 'full') {
    return getArmTransform('left', landmarks, detectedParts, dimensions, settings, design);
  }
  if (detectedParts.chest.visible && detectedParts.chest.orientation === 'front') {
    return getChestTransform(landmarks, detectedParts, dimensions, settings, design);
  }
  if (detectedParts.back.visible) {
    return getBackTransform(landmarks, detectedParts, dimensions, settings, design);
  }
  if (detectedParts.rightLeg.visible) {
    return getLegTransform('right', landmarks, detectedParts, dimensions, settings, design);
  }
  if (detectedParts.leftLeg.visible) {
    return getLegTransform('left', landmarks, detectedParts, dimensions, settings, design);
  }
  if (detectedParts.neck.visible) {
    return getNeckTransform(landmarks, dimensions, settings, design);
  }
  
  return { visible: false };
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