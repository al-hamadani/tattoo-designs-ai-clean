// components/RealisticARPreview/hooks/useMediaPipe.js
import { useRef, useCallback, useEffect, useState } from 'react';
import { loadMediaPipe } from '../utils/mediapipeClient';

// Singletons to prevent multiple initializations
let poseInstance = null;
let segmentationInstance = null;
let isInitializing = false;

export const useMediaPipe = ({ onPoseResults, onSegmentationResults }) => {
  const poseRef = useRef(null);
  const segRef = useRef(null);
  const [modelsReady, setModelsReady] = useState(false);

  const initModels = useCallback(async () => {
    if (isInitializing) {
      // console.log('⏳ Already initializing...');
      return;
    }

    isInitializing = true;

    try {
      // console.log('🚀 Loading MediaPipe...');
      const { Pose, SelfieSegmentation } = await loadMediaPipe();

      // Initialize Pose
      if (!poseInstance) {
        // console.log('📦 Creating Pose Detection...');
        const pose = new Pose({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
          }
        });

        pose.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          enableSegmentation: false,
          smoothSegmentation: false,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        pose.onResults(onPoseResults);
        await pose.initialize();

        poseInstance = pose;
        poseRef.current = pose;
      }

      // Initialize Selfie Segmentation
      if (!segmentationInstance) {
        // console.log('📦 Creating Selfie Segmentation...');
        const segmentation = new SelfieSegmentation({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`;
          }
        });

        segmentation.setOptions({
          modelSelection: 1,
          selfieMode: true,
        });

        segmentation.onResults(onSegmentationResults);
        await segmentation.initialize();

        segmentationInstance = segmentation;
        segRef.current = segmentation;
      }

      setModelsReady(true);
      // console.log('🎉 All models ready!');
    } catch (error) {
      // console.error('❌ MediaPipe initialization failed:', error);
    } finally {
      isInitializing = false;
    }
  }, [onPoseResults, onSegmentationResults]);

  const sendFrame = useCallback(async (videoElement) => {
    if (!segRef.current || !poseRef.current) {
      // console.warn('⚠️ Models not ready for sendFrame', {
      //   seg: !!segRef.current,
      //   pose: !!poseRef.current
      // });
      return;
    }

    if (!videoElement || videoElement.readyState < 2) {
      // console.warn('⚠️ Video not ready', videoElement?.readyState);
      return;
    }

    try {
      if (segRef.current?.send) {
        // console.log('   → Sending to segmentation...');
        await segRef.current.send({ image: videoElement });
      } else {
        // console.warn('   ⚠️ Segmentation send method not available');
      }

      if (poseRef.current?.send) {
        // console.log('   → Sending to pose...');
        await poseRef.current.send({ image: videoElement });
      } else {
        // console.warn('   ⚠️ Pose send method not available');
      }
    } catch (error) {
      // console.error('❌ Error sending frame:', error);
    }
  }, []);

  const cleanup = useCallback(() => {
    setModelsReady(false);
  }, []);

  return {
    poseRef,
    segRef,
    initModels,
    sendFrame,
    modelsReady,
    cleanup
  };
};
