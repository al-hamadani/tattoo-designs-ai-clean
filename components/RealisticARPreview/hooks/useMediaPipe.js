// components/RealisticARPreview/hooks/useMediaPipe.js
import { useRef, useCallback } from 'react';
import { Pose } from '@mediapipe/pose';
import { SelfieSegmentation } from '@mediapipe/selfie_segmentation';

/* ---------- CDN helper for Pose assets ---------- */
const poseLocate = (file) =>
  `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;

/* ---------- singleton keep-alives (avoid re-download) ---------- */
let poseSingleton = null;
let segSingleton  = null;

export const useMediaPipe = ({ onPoseResults, onSegmentationResults }) => {
  const poseRef = useRef(null);
  const segRef  = useRef(null);

  /* one-time bootstrap */
  const initModels = useCallback(async () => {
    try {
      /* Selfie Segmentation (SIMD build from CDN) */
      if (!segSingleton) {
        console.log('📦 Loading Selfie Segmentation…');
        segSingleton = new SelfieSegmentation({ modelSelection: 1 });
        await segSingleton.initialize();            // pulls wasm + JS
      }
      segRef.current = segSingleton;
      segRef.current.onResults(onSegmentationResults);
      console.log('✅ Segmentation ready');

      /* Pose Detection */
      if (!poseSingleton) {
        console.log('📦 Loading Pose Detection…');
        poseSingleton = new Pose({ locateFile: poseLocate });
        poseSingleton.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
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

  /* feed a frame through both models */
  const sendFrame = useCallback(async (video) => {
    if (segRef.current)  await segRef.current.send({ image: video });
    if (poseRef.current) await poseRef.current.send({ image: video });
  }, []);

  return { poseRef, segRef, initModels, sendFrame };
};
