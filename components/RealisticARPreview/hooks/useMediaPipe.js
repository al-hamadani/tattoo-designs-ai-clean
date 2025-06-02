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
    // Prevent multiple simultaneous initializations
    if (isInitializing) {
      console.log('⏳ Already initializing...');
      return;
    }

    // Check if already initialized
    if (poseInstance && segmentationInstance) {
      console.log('♻️ Reusing existing instances');
      poseRef.current = poseInstance;
      segRef.current = segmentationInstance;
      
      if (onPoseResults) {
        poseInstance.onResults(onPoseResults);
      }
      if (onSegmentationResults) {
        segmentationInstance.onResults(onSegmentationResults);
      }
    }

    isInitializing = true;

    try {
      console.log('🚀 Loading MediaPipe...');
      const { Pose, SelfieSegmentation } = await loadMediaPipe();

      // Initialize Selfie Segmentation
      if (!segmentationInstance) {
        console.log('📦 Creating Selfie Segmentation...');
        const segmentation = new SelfieSegmentation({
          locateFile: (file) => {
            return `/mediapipe/selfie_segmentation/${file}`;
          }
        });

        segmentation.setOptions({
          modelSelection: 1,
          selfieMode: true,
        });

        // Set callback before initialize
        segmentation.onResults(onSegmentationResults);

        await segmentation.initialize();
        console.log('✅ Segmentation initialized');
        
        segmentationInstance = segmentation;
        segRef.current = segmentation;
      }

      // Initialize Pose
      if (!poseInstance) {
        console.log('📦 Creating Pose Detection...');
        const pose = new Pose({
          locateFile: (file) => {
            return `/mediapipe/pose/${file}`;
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

        // Set callback before initialize
        pose.onResults(onPoseResults);

        await pose.initialize();
        console.log('✅ Pose initialized');
        
        poseInstance = pose;
        poseRef.current = pose;
      }

      setModelsReady(true);
      console.log('🎉 All models ready!');

    } catch (error) {
      console.error('❌ MediaPipe initialization failed:', error);
      throw error;
    } finally {
      isInitializing = false;
    }
  }, [onPoseResults, onSegmentationResults]);

  const sendFrame = useCallback(async (videoElement) => {
    if (!segRef.current || !poseRef.current) {
      console.warn('⚠️ Models not ready for sendFrame', {
        seg: !!segRef.current,
        pose: !!poseRef.current
      });
      return;
    }

    if (!videoElement || videoElement.readyState < 2) {
      console.warn('⚠️ Video not ready', videoElement?.readyState);
      return;
    }
  
    try {
      // Log frame sending
      //console.log('📤 Sending frame to models', {
       //  videoWidth: videoElement.videoWidth,
       //  videoHeight: videoElement.videoHeight,
        // readyState: videoElement.readyState
       //});
      
      // Send to segmentation
      if (segRef.current && segRef.current.send) {
        console.log('   → Sending to segmentation...');
        await segRef.current.send({ image: videoElement });
      } else {
        console.warn('   ⚠️ Segmentation send method not available');
      }
      
      // Send to pose
      if (poseRef.current && poseRef.current.send) {
        console.log('   → Sending to pose...');
        await poseRef.current.send({ image: videoElement });
      } else {
        console.warn('   ⚠️ Pose send method not available');
      }
    } catch (error) {
      console.error('❌ Error sending frame:', error);
    }
  }, []);

  // Cleanup function
  const cleanup = useCallback(() => {
    // Note: We keep instances alive for reuse
    // Only truly cleanup if needed
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