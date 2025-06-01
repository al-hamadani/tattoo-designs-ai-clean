// components/RealisticARPreview/hooks/useMediaPipe.js
import { useRef, useCallback } from 'react';
import { SelfieSegmentation } from '@mediapipe/selfie_segmentation';
import { Pose } from '@mediapipe/pose';

const locateFile = (file) => `/mediapipe/${file}`;

// Persistent instances across remounts
let globalPoseInstance = null;
let globalSegmentationInstance = null;

export const useMediaPipe = ({ onPoseResults, onSegmentationResults }) => {
  const poseRef = useRef(null);
  const segRef = useRef(null);

  const initModels = useCallback(async () => {
    try {
      // Initialize Segmentation
      if (!globalSegmentationInstance) {
        console.log('📦 Creating new Selfie Segmentation...');
        const seg = new SelfieSegmentation({ locateFile });
        seg.setOptions({ modelSelection: 1 });
        await seg.initialize();
        globalSegmentationInstance = seg;
      }
      
      segRef.current = globalSegmentationInstance;
      segRef.current.onResults(onSegmentationResults);
      console.log('✅ Segmentation ready');

      // Initialize Pose
      if (!globalPoseInstance) {
        console.log('📦 Creating new Pose Detection...');
        const pose = new Pose({ locateFile });
        pose.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          enableSegmentation: false,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
        await pose.initialize();
        globalPoseInstance = pose;
      }
      
      poseRef.current = globalPoseInstance;
      poseRef.current.onResults(onPoseResults);
      console.log('✅ Pose ready');

    } catch (err) {
      console.error('❌ Failed to init MediaPipe:', err);
      throw new Error('Failed to load AI models');
    }
  }, [onPoseResults, onSegmentationResults]);

  const sendFrame = useCallback(async (video) => {
    if (segRef.current) {
      await segRef.current.send({ image: video });
    }
    if (poseRef.current) {
      await poseRef.current.send({ image: video });
    }
  }, []);

  return {
    poseRef,
    segRef,
    initModels,
    sendFrame
  };
};