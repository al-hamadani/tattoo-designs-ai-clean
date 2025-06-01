// components/RealisticARPreview/hooks/useCamera.js
import { useRef, useCallback } from 'react';

export const useCamera = (videoRef, facingMode) => {
  const streamRef = useRef(null);

  const stopCamera = useCallback(() => {
    console.log("🛑 Stopping camera...");
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [videoRef]);

  const startCamera = useCallback(async () => {
    stopCamera();
    console.log("📸 Starting camera...");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: facingMode,
        },
      });

      streamRef.current = stream;
      
      if (!videoRef.current) {
        throw new Error("Video element not ready");
      }

      videoRef.current.srcObject = stream;

      await new Promise((resolve, reject) => {
        videoRef.current.onloadedmetadata = resolve;
        videoRef.current.onerror = reject;
      });

      await videoRef.current.play();
      
      console.log("✅ Camera started successfully");
      
      return {
        width: videoRef.current.videoWidth,
        height: videoRef.current.videoHeight
      };
      
    } catch (err) {
      console.error("❌ Camera error:", err);
      stopCamera();
      throw new Error(`Camera access failed: ${err.message}`);
    }
  }, [facingMode, videoRef, stopCamera]);

  const switchCamera = useCallback(() => {
    // Parent component should handle facingMode state change
    // This will trigger a restart with new facingMode
    console.log("🔄 Switching camera...");
  }, []);

  return {
    stream: streamRef.current,
    startCamera,
    stopCamera,
    switchCamera
  };
};