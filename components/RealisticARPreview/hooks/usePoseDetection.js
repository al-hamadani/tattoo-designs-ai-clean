// components/RealisticARPreview/hooks/usePoseDetection.js
import { useState, useCallback } from 'react';
import { POSE_LANDMARKS } from '@mediapipe/pose';
import * as THREE from 'three';
import { smoothVector3 } from '../utils/bodyPartDetection';

const SMOOTHING_ALPHA = 0.4;

export const usePoseDetection = () => {
  const [landmarks, setLandmarks] = useState({
    // Head/Face
    nose: null,
    leftEye: null,
    rightEye: null,
    leftEar: null,
    rightEar: null,
    
    // Arms
    leftShoulder: null,
    rightShoulder: null,
    leftElbow: null,
    rightElbow: null,
    leftWrist: null,
    rightWrist: null,
    leftPinky: null,
    rightPinky: null,
    leftIndex: null,
    rightIndex: null,
    leftThumb: null,
    rightThumb: null,
    
    // Torso
    leftHip: null,
    rightHip: null,
    
    // Legs
    leftKnee: null,
    rightKnee: null,
    leftAnkle: null,
    rightAnkle: null,
    leftHeel: null,
    rightHeel: null,
    leftFootIndex: null,
    rightFootIndex: null
  });

  const [detectedParts, setDetectedParts] = useState({
    face: { visible: false, orientation: 'front' },
    neck: { visible: false },
    chest: { visible: false, orientation: 'front' },
    leftArm: { visible: false, section: null }, // upper, lower, full
    rightArm: { visible: false, section: null },
    leftHand: { visible: false },
    rightHand: { visible: false },
    abdomen: { visible: false },
    leftLeg: { visible: false, section: null }, // upper, lower, full
    rightLeg: { visible: false, section: null },
    leftFoot: { visible: false },
    rightFoot: { visible: false },
    back: { visible: false, section: null } // upper, lower, full
  });

  const processResults = useCallback((results) => {
    if (!results.poseLandmarks) {
      setLandmarks({});
      setDetectedParts({});
      return;
    }

    const lms = results.poseLandmarks;
    const newLandmarks = { ...landmarks };
    const newDetectedParts = { ...detectedParts };

    // Helper to smooth and convert landmarks
    const processLandmark = (key, idx) => {
      const point = lms[idx];
      if (point && point.visibility > 0.3) {
        const vec = new THREE.Vector3(point.x, 1 - point.y, point.z);
        return smoothVector3(vec, newLandmarks[key], SMOOTHING_ALPHA);
      }
      return null;
    };

    // Process all landmarks
    // Face
    newLandmarks.nose = processLandmark('nose', POSE_LANDMARKS.NOSE);
    newLandmarks.leftEye = processLandmark('leftEye', POSE_LANDMARKS.LEFT_EYE);
    newLandmarks.rightEye = processLandmark('rightEye', POSE_LANDMARKS.RIGHT_EYE);
    newLandmarks.leftEar = processLandmark('leftEar', POSE_LANDMARKS.LEFT_EAR);
    newLandmarks.rightEar = processLandmark('rightEar', POSE_LANDMARKS.RIGHT_EAR);

    // Arms
    newLandmarks.leftShoulder = processLandmark('leftShoulder', POSE_LANDMARKS.LEFT_SHOULDER);
    newLandmarks.rightShoulder = processLandmark('rightShoulder', POSE_LANDMARKS.RIGHT_SHOULDER);
    newLandmarks.leftElbow = processLandmark('leftElbow', POSE_LANDMARKS.LEFT_ELBOW);
    newLandmarks.rightElbow = processLandmark('rightElbow', POSE_LANDMARKS.RIGHT_ELBOW);
    newLandmarks.leftWrist = processLandmark('leftWrist', POSE_LANDMARKS.LEFT_WRIST);
    newLandmarks.rightWrist = processLandmark('rightWrist', POSE_LANDMARKS.RIGHT_WRIST);

    // Hands
    newLandmarks.leftPinky = processLandmark('leftPinky', POSE_LANDMARKS.LEFT_PINKY);
    newLandmarks.rightPinky = processLandmark('rightPinky', POSE_LANDMARKS.RIGHT_PINKY);
    newLandmarks.leftIndex = processLandmark('leftIndex', POSE_LANDMARKS.LEFT_INDEX);
    newLandmarks.rightIndex = processLandmark('rightIndex', POSE_LANDMARKS.RIGHT_INDEX);
    newLandmarks.leftThumb = processLandmark('leftThumb', POSE_LANDMARKS.LEFT_THUMB);
    newLandmarks.rightThumb = processLandmark('rightThumb', POSE_LANDMARKS.RIGHT_THUMB);

    // Torso
    newLandmarks.leftHip = processLandmark('leftHip', POSE_LANDMARKS.LEFT_HIP);
    newLandmarks.rightHip = processLandmark('rightHip', POSE_LANDMARKS.RIGHT_HIP);

    // Legs
    newLandmarks.leftKnee = processLandmark('leftKnee', POSE_LANDMARKS.LEFT_KNEE);
    newLandmarks.rightKnee = processLandmark('rightKnee', POSE_LANDMARKS.RIGHT_KNEE);
    newLandmarks.leftAnkle = processLandmark('leftAnkle', POSE_LANDMARKS.LEFT_ANKLE);
    newLandmarks.rightAnkle = processLandmark('rightAnkle', POSE_LANDMARKS.RIGHT_ANKLE);
    newLandmarks.leftHeel = processLandmark('leftHeel', POSE_LANDMARKS.LEFT_HEEL);
    newLandmarks.rightHeel = processLandmark('rightHeel', POSE_LANDMARKS.RIGHT_HEEL);
    newLandmarks.leftFootIndex = processLandmark('leftFootIndex', POSE_LANDMARKS.LEFT_FOOT_INDEX);
    newLandmarks.rightFootIndex = processLandmark('rightFootIndex', POSE_LANDMARKS.RIGHT_FOOT_INDEX);

    // Detect body parts and orientation
    // Face detection and orientation
    if (newLandmarks.nose && newLandmarks.leftEye && newLandmarks.rightEye) {
      newDetectedParts.face.visible = true;
      
      // Check if both ears are visible for profile detection
      if (newLandmarks.leftEar && !newLandmarks.rightEar) {
        newDetectedParts.face.orientation = 'left-profile';
      } else if (!newLandmarks.leftEar && newLandmarks.rightEar) {
        newDetectedParts.face.orientation = 'right-profile';
      } else {
        newDetectedParts.face.orientation = 'front';
      }
    }

    // Neck detection
    if (newLandmarks.nose && (newLandmarks.leftShoulder || newLandmarks.rightShoulder)) {
      newDetectedParts.neck.visible = true;
    }

    // Chest/Back detection
    if (newLandmarks.leftShoulder && newLandmarks.rightShoulder && 
        newLandmarks.leftHip && newLandmarks.rightHip) {
      newDetectedParts.chest.visible = true;
      
      // Determine front/back based on shoulder width vs hip width
      const shoulderDist = Math.abs(newLandmarks.leftShoulder.x - newLandmarks.rightShoulder.x);
      const hipDist = Math.abs(newLandmarks.leftHip.x - newLandmarks.rightHip.x);
      
      newDetectedParts.chest.orientation = shoulderDist > hipDist * 0.8 ? 'front' : 'back';
      
      if (newDetectedParts.chest.orientation === 'back') {
        newDetectedParts.back.visible = true;
        newDetectedParts.back.section = 'full';
      }
    }

    // Arms detection
    // Left arm
    if (newLandmarks.leftShoulder && newLandmarks.leftElbow) {
      newDetectedParts.leftArm.visible = true;
      if (newLandmarks.leftWrist) {
        newDetectedParts.leftArm.section = 'full';
      } else {
        newDetectedParts.leftArm.section = 'upper';
      }
    } else if (newLandmarks.leftElbow && newLandmarks.leftWrist) {
      newDetectedParts.leftArm.visible = true;
      newDetectedParts.leftArm.section = 'lower';
    }

    // Right arm
    if (newLandmarks.rightShoulder && newLandmarks.rightElbow) {
      newDetectedParts.rightArm.visible = true;
      if (newLandmarks.rightWrist) {
        newDetectedParts.rightArm.section = 'full';
      } else {
        newDetectedParts.rightArm.section = 'upper';
      }
    } else if (newLandmarks.rightElbow && newLandmarks.rightWrist) {
      newDetectedParts.rightArm.visible = true;
      newDetectedParts.rightArm.section = 'lower';
    }

    // Hands detection
    if (newLandmarks.leftWrist && (newLandmarks.leftPinky || newLandmarks.leftIndex || newLandmarks.leftThumb)) {
      newDetectedParts.leftHand.visible = true;
    }
    if (newLandmarks.rightWrist && (newLandmarks.rightPinky || newLandmarks.rightIndex || newLandmarks.rightThumb)) {
      newDetectedParts.rightHand.visible = true;
    }

    // Legs detection
    // Left leg
    if (newLandmarks.leftHip && newLandmarks.leftKnee) {
      newDetectedParts.leftLeg.visible = true;
      if (newLandmarks.leftAnkle) {
        newDetectedParts.leftLeg.section = 'full';
      } else {
        newDetectedParts.leftLeg.section = 'upper';
      }
    } else if (newLandmarks.leftKnee && newLandmarks.leftAnkle) {
      newDetectedParts.leftLeg.visible = true;
      newDetectedParts.leftLeg.section = 'lower';
    }

    // Right leg
    if (newLandmarks.rightHip && newLandmarks.rightKnee) {
      newDetectedParts.rightLeg.visible = true;
      if (newLandmarks.rightAnkle) {
        newDetectedParts.rightLeg.section = 'full';
      } else {
        newDetectedParts.rightLeg.section = 'upper';
      }
    } else if (newLandmarks.rightKnee && newLandmarks.rightAnkle) {
      newDetectedParts.rightLeg.visible = true;
      newDetectedParts.rightLeg.section = 'lower';
    }

    // Feet detection
    if (newLandmarks.leftAnkle && (newLandmarks.leftHeel || newLandmarks.leftFootIndex)) {
      newDetectedParts.leftFoot.visible = true;
    }
    if (newLandmarks.rightAnkle && (newLandmarks.rightHeel || newLandmarks.rightFootIndex)) {
      newDetectedParts.rightFoot.visible = true;
    }

    setLandmarks(newLandmarks);
    setDetectedParts(newDetectedParts);
  }, [landmarks, detectedParts]);

  // Static method to be called from parent
  usePoseDetection.processResults = processResults;

  return {
    landmarks,
    detectedParts
  };
};