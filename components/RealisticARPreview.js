// components/RealisticARPreview.js - Enhanced with MediaPipe Pose for basic orientation
import { useState, useRef, useEffect, useCallback } from 'react'
import { Camera, Download, RotateCcw, X, Move, ZoomIn, ZoomOut, SwitchCamera, Sliders, Loader2, User, Zap } from 'lucide-react'
import { SelfieSegmentation, Results as SegmentationResults } from '@mediapipe/selfie_segmentation'
import { Pose, Results as PoseResults, POSE_LANDMARKS } from '@mediapipe/pose'

// Helper for EMA smoothing
const smoothValue = (currentValue, previousValue, alpha) => {
  if (previousValue === null) return currentValue;
  return previousValue * (1 - alpha) + currentValue * alpha;
};

export default function RealisticARPreview({ imageUrl, design, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null); // For drawing video and tattoo
  const offscreenCanvasRef = useRef(null); // For processing tattoo image
  const streamRef = useRef(null);
  const animationFrameIdRef = useRef(null);
  
  const selfieSegmentationRef = useRef(null);
  const poseRef = useRef(null);

  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Initializing AR...');
  const [error, setError] = useState(null);
  
  // Tattoo visual properties
  const [tattooSize, setTattooSize] = useState(80); // User-controlled base size percentage
  const [tattooPosition, setTattooPosition] = useState({ x: 50, y: 50 }); // User-controlled position %
  const [tattooRotation, setTattooRotation] = useState(0); // User-controlled rotation
  const [opacity, setOpacity] = useState(0.85);
  const [blur, setBlur] = useState(0.5);
  const [blendMode, setBlendMode] = useState('multiply');
  const [tattooImage, setTattooImage] = useState(null);

  // Interaction states
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialTattooPosition, setInitialTattooPosition] = useState({ x: 0, y: 0 });
  const [showControls, setShowControls] = useState(true);
  const [showAdvancedControls, setShowAdvancedControls] = useState(false);
  const [facingMode, setFacingMode] = useState('user');

  // Pose-derived transformation states
  const [enablePoseDetection, setEnablePoseDetection] = useState(true); // Toggle for pose effect
  const [smoothedArmAngle, setSmoothedArmAngle] = useState(null); // Radians
  const [smoothedArmScale, setSmoothedArmScale] = useState(null); // Multiplier
  const [detectedArmCenter, setDetectedArmCenter] = useState(null); // {x, y} in normalized video coords

  const POSE_SMOOTHING_ALPHA = 0.4; // For EMA smoothing of pose data

  // --- Initialization and Lifecycle ---
  const loadTattooImage = useCallback(() => {
    if (!imageUrl) {
      setError('Tattoo image URL is missing.');
      setIsLoading(false);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => setTattooImage(img);
    img.onerror = () => {
      setError('Failed to load tattoo image.');
      setIsLoading(false);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  const initializeModels = useCallback(() => {
    setLoadingMessage('Loading AI models...');
    // Selfie Segmentation
    try {
      const segmentation = new SelfieSegmentation({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`,
      });
      segmentation.setOptions({ modelSelection: 1 });
      segmentation.onResults(onSegmentationResults);
      selfieSegmentationRef.current = segmentation;
    } catch (e) {
      console.error("Failed to init Segmentation:", e);
      setError("Failed to load segmentation model.");
    }

    // Pose Detection
    try {
      const pose = new Pose({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
      });
      pose.setOptions({
        modelComplexity: 1, // 0, 1, 2
        smoothLandmarks: true,
        enableSegmentation: false, // We use SelfieSegmentation for masks
        smoothSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      pose.onResults(onPoseResults);
      poseRef.current = pose;
    } catch (e) {
      console.error("Failed to init Pose:", e);
      setError("Failed to load pose detection model.");
    }
  }, []);

  const startCamera = useCallback(async () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setLoadingMessage('Accessing camera...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: facingMode,
        },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        videoRef.current.onloadedmetadata = () => {
          setupCanvases();
          setIsLoading(false);
          setLoadingMessage('Processing video...');
          if (videoRef.current?.readyState >= 3) { // HAVE_FUTURE_DATA
             sendVideoFrameToModelsLoop();
          }
        };
         videoRef.current.onplaying = () => {
            if (videoRef.current?.readyState >= 3) {
                 sendVideoFrameToModelsLoop();
            }
        };
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setError(`Camera access denied or no camera found. Error: ${err.message}`);
      setIsLoading(false);
    }
  }, [facingMode]);

  useEffect(() => {
    setIsLoading(true);
    loadTattooImage();
    initializeModels();
    const controlsTimer = setTimeout(() => setShowControls(false), 5000);
    return () => {
      clearTimeout(controlsTimer);
      stopCameraAndProcessing();
      selfieSegmentationRef.current?.close().catch(console.error);
      poseRef.current?.close().catch(console.error);
    };
  }, [loadTattooImage, initializeModels]);

  useEffect(() => {
    if (tattooImage && selfieSegmentationRef.current && poseRef.current) {
      startCamera();
    }
  }, [facingMode, startCamera, tattooImage]);

  const stopCameraAndProcessing = () => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject = null;
    }
  };

  const switchCamera = () => {
    stopCameraAndProcessing();
    setIsLoading(true);
    setLoadingMessage('Switching camera...');
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
  };

  const setupCanvases = () => {
    if (!canvasRef.current || !videoRef.current || !videoRef.current.videoWidth) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const offscreenCanvas = offscreenCanvasRef.current || document.createElement('canvas');
    offscreenCanvasRef.current = offscreenCanvas;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    // Offscreen canvas will be resized dynamically based on tattoo size
  };

  // --- MediaPipe Processing ---
  const sendVideoFrameToModelsLoop = async () => {
    if (!videoRef.current || !videoRef.current.srcObject || videoRef.current.paused || videoRef.current.ended || videoRef.current.readyState < 3) {
      if (selfieSegmentationRef.current || poseRef.current) { // Only request if models are active
        animationFrameIdRef.current = requestAnimationFrame(sendVideoFrameToModelsLoop);
      }
      return;
    }
    const video = videoRef.current;
    try {
      if (selfieSegmentationRef.current?.send && video) {
        await selfieSegmentationRef.current.send({ image: video });
      }
      if (enablePoseDetection && poseRef.current?.send && video) {
        await poseRef.current.send({ image: video });
      }
    } catch (e) {
      console.error("Error sending frame to MediaPipe:", e);
    }
    // The onResults callbacks will handle requesting the next frame IF they are the main driver.
    // Here, we let segmentation be the driver. Pose just updates its state.
    // If segmentation isn't driving, this loop needs to ensure it continues.
    // For simplicity, let segmentation's onResults drive the next animation frame.
  };

  const onPoseResults = useCallback((results) => {
    if (!results.poseLandmarks) {
      setSmoothedArmAngle(null); // Reset if no landmarks
      setSmoothedArmScale(null);
      setDetectedArmCenter(null);
      return;
    }

    const landmarks = results.poseLandmarks;
    // Try left arm first, then right arm
    let p1 = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
    let p2 = landmarks[POSE_LANDMARKS.LEFT_ELBOW];
    let p3 = landmarks[POSE_LANDMARKS.LEFT_WRIST];

    if (!p1 || !p2 || !p3 || p1.visibility < 0.4 || p2.visibility < 0.4 || p3.visibility < 0.4) {
      p1 = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
      p2 = landmarks[POSE_LANDMARKS.RIGHT_ELBOW];
      p3 = landmarks[POSE_LANDMARKS.RIGHT_WRIST];
    }

    if (p1 && p2 && p3 && p1.visibility > 0.4 && p2.visibility > 0.4 && p3.visibility > 0.4) {
      // Calculate forearm orientation (elbow to wrist)
      const dxElbowWrist = p3.x - p2.x;
      const dyElbowWrist = p3.y - p2.y;
      const currentAngle = Math.atan2(dyElbowWrist, dxElbowWrist);

      // Calculate scale based on forearm length on screen
      const forearmScreenLength = Math.sqrt(dxElbowWrist**2 + dyElbowWrist**2);
      // Normalize scale: assume a forearm length of 0.3 (30% of video width/height) is 'normal' scale 1
      let currentScale = forearmScreenLength / 0.25; // Adjust 0.25 as needed
      currentScale = Math.max(0.3, Math.min(2.5, currentScale)); // Clamp

      // Center of the forearm (for potential auto-placement, though user controls position)
      const armCenterX = (p2.x + p3.x) / 2;
      const armCenterY = (p2.y + p3.y) / 2;
      
      setSmoothedArmAngle(prev => smoothValue(currentAngle, prev, POSE_SMOOTHING_ALPHA));
      setSmoothedArmScale(prev => smoothValue(currentScale, prev, POSE_SMOOTHING_ALPHA));
      setDetectedArmCenter({ x: armCenterX, y: armCenterY });

    } else {
      setSmoothedArmAngle(null);
      setSmoothedArmScale(null);
      setDetectedArmCenter(null);
    }
  }, []);

  const onSegmentationResults = useCallback((results) => {
    if (!canvasRef.current || !videoRef.current || !tattooImage || !results.segmentationMask || !offscreenCanvasRef.current) {
      animationFrameIdRef.current = requestAnimationFrame(sendVideoFrameToModelsLoop); // Keep loop going
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const video = videoRef.current;
    const segmentationMask = results.segmentationMask;
    const offCanvas = offscreenCanvasRef.current;
    const offCtx = offCanvas.getContext('2d');

    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      setupCanvases();
    }
    
    // --- Tattoo Base Sizing ---
    const canvasMinDim = Math.min(canvas.width, canvas.height);
    // Base size of tattoo relative to canvasMinDim, then scaled by user's tattooSize %
    const baseTattooDim = canvasMinDim * 0.25 * (tattooSize / 100); 

    // Apply pose-based scale if available and enabled
    const finalScaleMultiplier = (enablePoseDetection && smoothedArmScale !== null) ? smoothedArmScale : 1;
    const actualTattooWidth = baseTattooDim * finalScaleMultiplier;
    const actualTattooHeight = (actualTattooWidth * tattooImage.height) / tattooImage.width;

    // --- Tattoo Positioning ---
    // User controls position relative to canvas center or detected arm center
    let anchorX = canvas.width * tattooPosition.x / 100;
    let anchorY = canvas.height * tattooPosition.y / 100;

    if (enablePoseDetection && detectedArmCenter) {
        // Option: Make user position relative to detected arm center
        // For now, let user position be absolute, but tattoo orients with arm
    }

    const posX = anchorX - actualTattooWidth / 2;
    const posY = anchorY - actualTattooHeight / 2;
    
    // --- Drawing ---
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Prepare tattoo on offscreen canvas
    offCanvas.width = actualTattooWidth;
    offCanvas.height = actualTattooHeight;
    offCtx.clearRect(0, 0, offCanvas.width, offCanvas.height);

    offCtx.translate(actualTattooWidth / 2, actualTattooHeight / 2); // Translate to center for rotation
    const finalRotation = tattooRotation * (Math.PI / 180) + ((enablePoseDetection && smoothedArmAngle !== null) ? smoothedArmAngle : 0);
    offCtx.rotate(finalRotation);
    offCtx.translate(-actualTattooWidth / 2, -actualTattooHeight / 2); // Translate back
    offCtx.drawImage(tattooImage, 0, 0, actualTattooWidth, actualTattooHeight);

    // Composite tattoo using segmentation mask
    const tempMaskedCanvas = document.createElement('canvas');
    tempMaskedCanvas.width = canvas.width;
    tempMaskedCanvas.height = canvas.height;
    const tempMaskedCtx = tempMaskedCanvas.getContext('2d');
    
    tempMaskedCtx.drawImage(offCanvas, posX, posY, actualTattooWidth, actualTattooHeight);
    tempMaskedCtx.globalCompositeOperation = 'destination-in';
    tempMaskedCtx.drawImage(segmentationMask, 0, 0, canvas.width, canvas.height);

    // Draw masked tattoo to main canvas
    ctx.globalCompositeOperation = blendMode;
    ctx.globalAlpha = opacity;
    ctx.filter = `blur(${blur}px)`;
    ctx.drawImage(tempMaskedCanvas, 0, 0);
    
    ctx.restore();
    animationFrameIdRef.current = requestAnimationFrame(sendVideoFrameToModelsLoop);
  }, [
    tattooImage, tattooSize, tattooPosition, tattooRotation, opacity, blur, blendMode, 
    enablePoseDetection, smoothedArmAngle, smoothedArmScale, detectedArmCenter
  ]);


  // --- UI Handlers (Capture, Interaction, Reset) ---
  const captureARPhoto = () => { /* ... same as before ... */ 
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `ar-tattoo-${design?.style || 'custom'}-${Date.now()}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }
    }, 'image/png', 1.0)
  };
  const getEventCoordinates = (e) => { /* ... same as before ... */ 
    if (e.touches && e.touches.length > 0) {
      return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
    }
    return { clientX: e.clientX, clientY: e.clientY };
  };
  const handleInteractionStart = (e) => { /* ... same as before ... */ 
    e.preventDefault(); 
    setIsDragging(true);
    setShowControls(true); 
    const coords = getEventCoordinates(e);
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    setDragStart({
      x: coords.clientX - rect.left,
      y: coords.clientY - rect.top,
    });
    setInitialTattooPosition(tattooPosition);
  };
  const handleInteractionMove = (e) => { /* ... same as before ... */ 
    if (!isDragging || !canvasRef.current) return;
    e.preventDefault();
    const coords = getEventCoordinates(e);
    const rect = canvasRef.current.getBoundingClientRect();
    
    const deltaX = coords.clientX - rect.left - dragStart.x;
    const deltaY = coords.clientY - rect.top - dragStart.y;

    const deltaPercentX = (deltaX / rect.width) * 100;
    const deltaPercentY = (deltaY / rect.height) * 100;

    setTattooPosition({
      x: Math.max(0, Math.min(100, initialTattooPosition.x + deltaPercentX)),
      y: Math.max(0, Math.min(100, initialTattooPosition.y + deltaPercentY)),
    });
  };
  const handleInteractionEnd = () => setIsDragging(false); /* ... same as before ... */
  const resetPosition = () => { /* ... same as before ... */ 
    setTattooPosition({ x: 50, y: 50 });
    setTattooSize(80);
    setTattooRotation(0);
    setOpacity(0.85);
    setBlur(0.5);
    setBlendMode('multiply');
    setEnablePoseDetection(true); // Reset pose detection toggle
  };
  
  // --- Error Boundary ---
  if (error) { /* ... same as before ... */ 
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-[100] p-4">
        <div className="bg-gray-800 p-6 rounded-lg shadow-xl text-center text-white max-w-md mx-auto">
          <Camera className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <h3 className="text-xl font-semibold mb-2">AR Preview Error</h3>
          <p className="text-gray-300 mb-6 text-sm">{error}</p>
          <button
            onClick={onClose}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Close AR View
          </button>
        </div>
      </div>
    )
  }

  // --- JSX Structure ---
  return (
    <div className="fixed inset-0 bg-black z-[100] overflow-hidden select-none" 
         onTouchMove={(e) => { if(isDragging) e.preventDefault(); }}>
      {isLoading && ( /* ... same loading UI ... */ 
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-50">
          <Loader2 className="w-12 h-12 text-white animate-spin mb-4" />
          <p className="text-white text-lg">{loadingMessage}</p>
        </div>
      )}

      <video ref={videoRef} autoPlay playsInline muted className="hidden" />
      
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 w-full h-full object-contain ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onMouseDown={handleInteractionStart}
        onMouseMove={handleInteractionMove}
        onMouseUp={handleInteractionEnd}
        onMouseLeave={handleInteractionEnd}
        onTouchStart={handleInteractionStart}
        onTouchMove={handleInteractionMove}
        onTouchEnd={handleInteractionEnd}
        onClick={() => !isDragging && setShowControls(prev => !prev)}
      />

      {/* Header Controls */}
      <div className={`fixed top-0 left-0 right-0 bg-gradient-to-b from-black/60 to-transparent p-3 sm:p-4 transition-all duration-300 z-20 ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none'}`}>
        <div className="flex items-center justify-between max-w-screen-lg mx-auto">
          <h3 className="text-white font-semibold text-base sm:text-lg truncate pr-2">AR Tattoo Preview</h3>
          <div className="flex items-center gap-1 sm:gap-2">
             <button
              onClick={() => setEnablePoseDetection(prev => !prev)}
              className={`p-2 rounded-full text-white transition-colors backdrop-blur-md ${enablePoseDetection ? 'bg-green-500/30 hover:bg-green-500/40' : 'bg-white/10 hover:bg-white/20'}`}
              title={enablePoseDetection ? "Disable Arm Tracking" : "Enable Arm Tracking"}
            >
              <User className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <button onClick={switchCamera} className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-colors" title="Switch camera">
              <SwitchCamera className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <button onClick={() => setShowAdvancedControls(prev => !prev)} className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-colors" title="Advanced settings">
              <Sliders className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <button onClick={onClose} className="p-2 bg-red-500/20 backdrop-blur-md rounded-full text-white hover:bg-red-500/40 transition-colors" title="Close AR">
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Advanced Controls Panel (conditionally rendered) */}
      {showAdvancedControls && showControls && (
          <div className="fixed top-16 sm:top-20 right-3 sm:right-4 bg-black/70 backdrop-blur-lg rounded-lg p-3 sm:p-4 text-white w-[260px] sm:w-[280px] z-30 shadow-xl">
            <h4 className="font-semibold mb-3 text-sm sm:text-base">Advanced Settings</h4>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="text-xs sm:text-sm mb-1 block">Opacity: {Math.round(opacity * 100)}%</label>
                <input type="range" min="0.1" max="1" step="0.01" value={opacity} onChange={(e) => setOpacity(parseFloat(e.target.value))} className="w-full ar-slider" />
              </div>
              <div>
                <label className="text-xs sm:text-sm mb-1 block">Edge Blur: {blur}px</label>
                <input type="range" min="0" max="5" step="0.1" value={blur} onChange={(e) => setBlur(parseFloat(e.target.value))} className="w-full ar-slider" />
              </div>
              <div>
                <label className="text-xs sm:text-sm mb-1 block">Rotation: {tattooRotation}°</label>
                <input type="range" min="-180" max="180" value={tattooRotation} onChange={(e) => setTattooRotation(parseInt(e.target.value))} className="w-full ar-slider" />
              </div>
              <div>
                <label className="text-xs sm:text-sm mb-1 block">Blend Mode:</label>
                <select value={blendMode} onChange={(e) => setBlendMode(e.target.value)} className="w-full p-2 bg-white/10 rounded text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="multiply">Multiply</option>
                  <option value="screen">Screen</option>
                  <option value="overlay">Overlay</option>
                  <option value="normal">Normal</option>
                  <option value="color-burn">Color Burn</option>
                  <option value="color-dodge">Color Dodge</option>
                  <option value="soft-light">Soft Light</option>
                  <option value="hard-light">Hard Light</option>
                </select>
              </div>
            </div>
          </div>
      )}


      {/* Bottom Controls */}
      <div className={`fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/50 to-transparent transition-all duration-300 z-20 ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full pointer-events-none'}`}>
        {/* ... same bottom controls UI: Size, Reset, Save ... */}
        <div className="px-4 sm:px-6 pt-3 sm:pt-4 pb-safe">
          <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
            <ZoomOut className="w-5 h-5 sm:w-6 sm:h-6 text-white opacity-80" />
            <input
              type="range" min="20" max="200" value={tattooSize}
              onChange={(e) => setTattooSize(parseInt(e.target.value))}
              className="flex-1 ar-slider"
              aria-label="Tattoo size"
            />
            <ZoomIn className="w-5 h-5 sm:w-6 sm:h-6 text-white opacity-80" />
          </div>
          <div className="flex gap-2 sm:gap-3">
            <button onClick={resetPosition} className="flex-1 bg-white/10 backdrop-blur-md text-white py-2.5 sm:py-3 rounded-xl font-medium hover:bg-white/20 transition-colors flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base">
              <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" /> Reset
            </button>
            <button onClick={captureARPhoto} className="flex-1 bg-blue-500 text-white py-2.5 sm:py-3 rounded-xl font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base">
              <Download className="w-4 h-4 sm:w-5 sm:h-5" /> Save
            </button>
          </div>
        </div>
      </div>
      
      {!isDragging && showControls && ( /* ... same tap instructions ... */ 
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10">
          <div className="bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm shadow-lg">
            <Move className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1.5 sm:mr-2" />
            Drag to move tattoo
          </div>
        </div>
      )}

      <style jsx global>{`
        .ar-slider { /* ... same slider styles ... */ 
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 8px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 5px;
          outline: none;
          transition: background 0.3s;
        }
        .ar-slider:hover {
          background: rgba(255, 255, 255, 0.3);
        }
        .ar-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          background: #3B82F6; /* Blue-500 */
          border-radius: 50%;
          cursor: grab;
          border: 3px solid white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }
        .ar-slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          background: #3B82F6;
          border-radius: 50%;
          cursor: grab;
          border: 3px solid white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }
        .pb-safe { 
          padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 1rem); 
        }
      `}</style>
    </div>
  )
}
