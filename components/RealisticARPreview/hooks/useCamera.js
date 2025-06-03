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
      // Ensure video element exists
      if (!videoRef.current) {
        throw new Error("Video element not ready");
      }
  
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: facingMode,
        },
      });
  
      streamRef.current = stream;
      
      // Double-check video element still exists
      if (!videoRef.current) {
        stream.getTracks().forEach(track => track.stop());
        throw new Error("Video element not ready");
      }
  
      videoRef.current.srcObject = stream;
  
      // Wait for video to be ready
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("Video load timeout")), 5000);
        
        videoRef.current.onloadedmetadata = () => {
          clearTimeout(timeout);
          resolve();
        };
        
        videoRef.current.onerror = (e) => {
          clearTimeout(timeout);
          reject(e);
        };
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
