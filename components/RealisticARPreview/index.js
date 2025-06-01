// components/RealisticARPreview/index.js
import { useState, useRef, useEffect, useCallback } from "react";
import { useMediaPipe } from './hooks/useMediaPipe';
import { useThreeScene } from './hooks/useThreeScene';
import { usePoseDetection } from './hooks/usePoseDetection';
import { useCamera } from './hooks/useCamera';
import { ARControls } from './components/ARControls';
import { AdvancedControls } from './components/AdvancedControls';
import { DebugInfo } from './components/DebugInfo';
import { ErrorDisplay } from './components/ErrorDisplay';
import { calculateTattooTransform } from './utils/bodyPartDetection';
import { compositeWithSegmentation } from './utils/imageProcessing';
import { DEFAULTS } from './utils/constants';
import { Move, Loader2 } from "lucide-react";

export default function RealisticARPreview({ imageUrl, design, onClose }) {
  // Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const processingRef = useRef(false);
  const frameIdRef = useRef(null);

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMsg, setLoadingMsg] = useState("Initializing AR…");
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState({ fps: 0, lastFrame: 0 });
  
  // Settings
  const [settings, setSettings] = useState({
    scaleFactor: DEFAULTS.SCALE_FACTOR,
    offset: { x: 0, y: 0, z: 0.01 },
    rotationDeg: 0,
    opacity: DEFAULTS.OPACITY,
    blendMode: DEFAULTS.BLEND_MODE,
    enablePose: true,
    bodyPart: "auto",
    facing: "user"
  });

  // UI State
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initOffset, setInitOffset] = useState({ x: 0, y: 0 });
  const [showControls, setShowControls] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Custom hooks
  const { stream, startCamera, stopCamera, switchCamera } = useCamera(videoRef, settings.facing);
  const { landmarks, detectedParts } = usePoseDetection();
  const { scene, renderer, mesh, threeCanvas, initThree, updateMesh } = useThreeScene(imageUrl);
  const { poseRef, segRef, initModels, sendFrame } = useMediaPipe({
    onPoseResults: (results) => usePoseDetection.processResults(results),
    onSegmentationResults: (results) => processSegmentation(results)
  });

  // Process segmentation results
  const processSegmentation = useCallback((results) => {
    if (!canvasRef.current || !videoRef.current || !mesh || 
        !renderer || !results.segmentationMask || processingRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;

    // FPS tracking
    const now = performance.now();
    const fps = Math.round(1000 / (now - debugInfo.lastFrame));
    setDebugInfo({ fps, lastFrame: now });

    // Draw base video
    ctx.save();
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(videoRef.current, 0, 0, width, height);

    // Calculate and apply transform
    const transform = calculateTattooTransform({
      bodyPart: settings.bodyPart,
      detectedParts,
      landmarks,
      dimensions: { width, height },
      settings,
      design
    });

    if (transform.visible) {
      updateMesh(transform);
      renderer.render(scene, camera);
      
      // Composite with segmentation
      compositeWithSegmentation({
        ctx,
        threeCanvas,
        segmentationMask: results.segmentationMask,
        width,
        height,
        blendMode: settings.blendMode,
        opacity: settings.opacity
      });
    }

    ctx.restore();
    processingRef.current = false;
  }, [mesh, renderer, scene, landmarks, detectedParts, settings, debugInfo]);

  // Main render loop
  const loop = useCallback(async () => {
    if (!videoRef.current || videoRef.current.readyState < 3 || !segRef) {
      frameIdRef.current = requestAnimationFrame(loop);
      return;
    }

    if (!processingRef.current) {
      processingRef.current = true;
      try {
        await sendFrame(videoRef.current);
      } catch (err) {
        console.error("Frame processing error:", err);
        processingRef.current = false;
      }
    }

    frameIdRef.current = requestAnimationFrame(loop);
  }, [sendFrame, segRef]);

  // Initialize
  useEffect(() => {
    const init = async () => {
      try {
        await initModels();
        const controlsTimer = setTimeout(() => setShowControls(false), 5000);
        return () => clearTimeout(controlsTimer);
      } catch (err) {
        setError(err.message);
      }
    };
    init();

    return () => {
      stopCamera();
      if (frameIdRef.current) cancelAnimationFrame(frameIdRef.current);
    };
  }, []);

  // Start when ready
  useEffect(() => {
    if (mesh && segRef && poseRef) {
      startCamera().then(() => {
        const { videoWidth, videoHeight } = videoRef.current;
        initThree(videoWidth, videoHeight);
        setIsLoading(false);
        loop();
      }).catch(err => setError(err.message));
    }
  }, [mesh, segRef, poseRef, startCamera, initThree, loop]);

  // Drag handlers
  const handleDragStart = (e) => {
    e.preventDefault();
    setDragging(true);
    setShowControls(true);
    const point = e.touches ? e.touches[0] : e;
    const rect = canvasRef.current.getBoundingClientRect();
    setDragStart({ x: point.clientX - rect.left, y: point.clientY - rect.top });
    setInitOffset({ x: settings.offset.x, y: settings.offset.y });
  };

  const handleDragMove = (e) => {
    if (!dragging || !canvasRef.current) return;
    const point = e.touches ? e.touches[0] : e;
    const rect = canvasRef.current.getBoundingClientRect();
    const dx = (point.clientX - rect.left - dragStart.x) / rect.width;
    const dy = (point.clientY - rect.top - dragStart.y) / rect.height;
    
    setSettings(prev => ({
      ...prev,
      offset: {
        ...prev.offset,
        x: Math.max(-0.5, Math.min(0.5, initOffset.x + dx)),
        y: Math.max(-0.5, Math.min(0.5, initOffset.y - dy))
      }
    }));
  };

  const handleDragEnd = () => setDragging(false);

  const capturePhoto = () => {
    if (!canvasRef.current) return;
    canvasRef.current.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `ar-tattoo-${Date.now()}.png`;
        link.click();
        URL.revokeObjectURL(url);
      }
    }, 'image/png', 1.0);
  };

  if (error) return <ErrorDisplay error={error} onClose={onClose} />;

  return (
    <div className="fixed inset-0 bg-black select-none overflow-hidden z-40" 
         onTouchMove={(e) => dragging && e.preventDefault()}>
      
      <DebugInfo show={!isLoading} fps={debugInfo.fps} />
      
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-50">
          <Loader2 className="w-12 h-12 animate-spin text-white mb-4" />
          <p className="text-white text-lg">{loadingMsg}</p>
        </div>
      )}

      <video ref={videoRef} muted playsInline autoPlay className="hidden" />
      
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 w-full h-full object-contain ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
        onMouseDown={handleDragStart}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onTouchStart={handleDragStart}
        onTouchMove={handleDragMove}
        onTouchEnd={handleDragEnd}
        onClick={() => !dragging && setShowControls(prev => !prev)}
      />

      <ARControls
        show={showControls}
        settings={settings}
        detectedParts={detectedParts}
        onTogglePose={() => setSettings(prev => ({ ...prev, enablePose: !prev.enablePose }))}
        onSwitchCamera={() => {
          setIsLoading(true);
          setSettings(prev => ({ ...prev, facing: prev.facing === 'user' ? 'environment' : 'user' }));
        }}
        onShowAdvanced={() => setShowAdvanced(prev => !prev)}
        onClose={onClose}
        onReset={() => setSettings({
          ...DEFAULTS,
          facing: settings.facing
        })}
        onCapture={capturePhoto}
        onScaleChange={(scaleFactor) => setSettings(prev => ({ ...prev, scaleFactor }))}
      />

      {showAdvanced && (
        <AdvancedControls
          show={showControls}
          settings={settings}
          onUpdateSettings={setSettings}
        />
      )}

      {!dragging && showControls && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10">
          <div className="bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm shadow-lg">
            <Move className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1.5 sm:mr-2" />
            Drag to move tattoo
          </div>
        </div>
      )}
    </div>
  );
}