// components/RealisticARPreview/hooks/useMediaPipe.js
import { useRef, useCallback } from 'react';
import { Pose } from '@mediapipe/pose';
import { SelfieSegmentation } from '@mediapipe/selfie_segmentation';

// --------- MediaPipe CDN helpers (update to match your installed versions) ---------
const MP_POSE_VERSION = '0.5.1675469404';
const MP_SELFIE_SEG_VERSION = '0.1.1675465747';


const poseLocate = (file) =>
  `https://cdn.jsdelivr.net/npm/@mediapipe/pose@${MP_POSE_VERSION}/${file}`;
const segLocate = (file) =>
  `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation@${MP_SELFIE_SEG_VERSION}/${file}`;


// --------- Keep singletons to avoid multiple WASM loads ---------
let poseSingleton = null;
let segSingleton = null;

export const useMediaPipe = ({ onPoseResults, onSegmentationResults }) => {
  const poseRef = useRef(null);
  const segRef = useRef(null);

  // --------- One-time initialization for both models ---------
  const initModels = useCallback(async () => {
    try {
      // -- SelfieSegmentation --
      if (!segSingleton) {
        console.log('📦 Loading Selfie Segmentation...');
        segSingleton = new SelfieSegmentation({ locateFile: segLocate });
        segSingleton.setOptions({ modelSelection: 1 }); // 1 = landscape, 0 = general
        await segSingleton.initialize();
      }
      segRef.current = segSingleton;
      segRef.current.onResults(onSegmentationResults);
      console.log('✅ Segmentation ready');

      // -- Pose Detection --
      if (!poseSingleton) {
        console.log('📦 Loading Pose Detection...');
        poseSingleton = new Pose({ locateFile: poseLocate });
        poseSingleton.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          enableSegmentation: false,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
        await poseSingleton.initialize();
      }
      poseRef.current = poseSingleton;
      poseRef.current.onResults(onPoseResults);
      console.log('✅ Pose ready');
    } catch (e) {
      console.error('❌ Failed to init MediaPipe models:', e);
      throw e;
    }
  }, [onPoseResults, onSegmentationResults]);

  // --------- Send a frame to both models ---------
  const sendFrame = useCallback(
    async (video) => {
      if (segRef.current) {
        await segRef.current.send({ image: video });
      }
      if (poseRef.current) {
        await poseRef.current.send({ image: video });
      }
    },
    []
  );

  return { poseRef, segRef, initModels, sendFrame };
};
