import { useState, useRef, useEffect, useCallback } from 'react';
import { useCamera }        from './hooks/useCamera';
import { useMediaPipe }     from './hooks/useMediaPipe';
import { usePoseDetection } from './hooks/usePoseDetection';
import { useThreeScene }    from './hooks/useThreeScene';

import ARControls        from './components/ARControls';
import AdvancedControls  from './components/AdvancedControls';
import DebugInfo         from './components/DebugInfo';
import ErrorDisplay      from './components/ErrorDisplay';

import { calculateTattooTransform }  from './utils/bodyPartDetection';
import { compositeWithSegmentation } from './utils/imageProcessing';
import { DEFAULTS }                  from './utils/constants';

import { Move, Loader2 } from 'lucide-react';

export default function RealisticARPreview({ imageUrl, design, onClose }) {
  const videoRef      = useRef(null);
  const canvasRef     = useRef(null);
  const frameIdRef    = useRef(null);
  const processingRef = useRef(false);

  const [isLoading, setIsLoading]   = useState(true);
  const [loadingMsg, setLoadingMsg] = useState('Initializing AR…');
  const [error,     setError]       = useState(null);
  const [debug,     setDebug]       = useState({ fps: 0, last: 0 });

  const [settings, setSettings] = useState({
    scaleFactor : DEFAULTS.SCALE_FACTOR,
    offset      : { x: 0, y: 0, z: 0.01 },
    rotationDeg : 0,
    opacity     : DEFAULTS.OPACITY,
    blendMode   : DEFAULTS.BLEND_MODE,
    enablePose  : false,
    bodyPart    : 'auto',
    facing      : 'user'
  });

  const [dragging,      setDragging]      = useState(false);
  const [dragStart,     setDragStart]     = useState({ x: 0, y: 0 });
  const [initOffset,    setInitOffset]    = useState({ x: 0, y: 0 });
  const [showControls,  setShowControls]  = useState(true);
  const [showAdvanced,  setShowAdvanced]  = useState(false);

  const { startCamera, stopCamera } = useCamera(videoRef, settings.facing);
  const { landmarks, detectedParts, processResults } = usePoseDetection();

  const {
    scene, renderer, mesh, threeCanvas,
    initThree, updateMesh
  } = useThreeScene(imageUrl);

  const {
    poseRef, segRef, initModels, sendFrame
  } = useMediaPipe({
    onPoseResults: processResults,
    onSegmentationResults: () => {}
  });

  const processSegmentation = useCallback((results) => {
    if (
      !canvasRef.current ||
      !videoRef.current  ||
      !mesh              ||
      !renderer          ||
      !results.segmentationMask
    ) { processingRef.current = false; return; }

    const ctx = canvasRef.current.getContext('2d');
    const { width, height } = canvasRef.current;

    // FPS calculation
    const now = performance.now();
    const fps = Math.round(1000 / (now - (debug.last || now)));
    setDebug({ fps, last: now });

    // Draw base video frame
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(videoRef.current, 0, 0, width, height);

    // Calculate tattoo transform (pose or manual)
    const transform = calculateTattooTransform({
      bodyPart    : settings.bodyPart,
      detectedParts,
      landmarks,
      dimensions  : { width, height },
      settings,
      design
    });

    if (transform.visible) {
      updateMesh(transform);
      renderer.render(scene, renderer.camera);

      compositeWithSegmentation({
        ctx,
        threeCanvas,
        segmentationMask : results.segmentationMask,
        width,
        height,
        blendMode : settings.blendMode,
        opacity   : settings.opacity
      });
    }
    processingRef.current = false;
  }, [mesh, renderer, scene, landmarks, detectedParts, settings, debug]);

  // Main animation loop
  const loop = useCallback(async () => {
    if (!videoRef.current || videoRef.current.readyState < 3) {
      frameIdRef.current = requestAnimationFrame(loop);
      return;
    }
    if (!processingRef.current) {
      processingRef.current = true;
      try {
        await sendFrame(videoRef.current);
      } catch { processingRef.current = false; }
    }
    frameIdRef.current = requestAnimationFrame(loop);
  }, [sendFrame]);

  // AR Boot
  useEffect(() => {
    (async () => {
      try {
        await startCamera();
        setLoadingMsg('Loading AI models…');
        await initModels();
        segRef.current.onResults(processSegmentation);

        const { videoWidth, videoHeight } = videoRef.current;
        initThree(videoWidth, videoHeight);

        setIsLoading(false);
        loop();
      } catch (e) {
        console.error(e);
        setError(e.message || 'Failed to load AI models');
      }
    })();

    return () => {
      stopCamera();
      if (frameIdRef.current) cancelAnimationFrame(frameIdRef.current);
    };
  }, [startCamera, stopCamera, initModels, initThree, loop, processSegmentation, segRef]);

  // Drag handlers
  const handleDragStart = (e) => {
    e.preventDefault();
    setDragging(true);
    setShowControls(true);

    const p = e.touches ? e.touches[0] : e;
    const rect = canvasRef.current.getBoundingClientRect();
    setDragStart({ x: p.clientX - rect.left, y: p.clientY - rect.top });
    setInitOffset({ x: settings.offset.x, y: settings.offset.y });
  };

  const handleDragMove = (e) => {
    if (!dragging) return;
    const p = e.touches ? e.touches[0] : e;
    const rect = canvasRef.current.getBoundingClientRect();
    const dx = (p.clientX - rect.left - dragStart.x) / rect.width;
    const dy = (p.clientY - rect.top  - dragStart.y) / rect.height;

    setSettings((s) => ({
      ...s,
      offset: {
        ...s.offset,
        x: Math.max(-0.5, Math.min(0.5, initOffset.x + dx)),
        y: Math.max(-0.5, Math.min(0.5, initOffset.y - dy))
      }
    }));
  };

  const handleDragEnd = () => setDragging(false);

  // Save PNG of AR preview
  const capturePhoto = () => {
    if (!canvasRef.current) return;
    canvasRef.current.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ar-tattoo-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  };

  if (error) return <ErrorDisplay error={error} onClose={onClose} />;

  return (
    <div
      className="fixed inset-0 bg-black select-none overflow-hidden z-40"
      onTouchMove={(e) => dragging && e.preventDefault()}
    >
      <DebugInfo show={!isLoading} fps={debug.fps} />

      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-50">
          <Loader2 className="w-12 h-12 animate-spin text-white mb-4" />
          <p className="text-white text-lg">{loadingMsg}</p>
        </div>
      )}

      <video ref={videoRef} playsInline autoPlay muted className="hidden" />

      <canvas
        ref={canvasRef}
        className={`absolute inset-0 w-full h-full object-contain ${
          dragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        onMouseDown={handleDragStart}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onTouchStart={handleDragStart}
        onTouchMove={handleDragMove}
        onTouchEnd={handleDragEnd}
        onClick={() => !dragging && setShowControls((v) => !v)}
      />

      <ARControls
        show={showControls}
        settings={settings}
        detectedParts={detectedParts}
        onTogglePose={() =>
          setSettings((s) => ({ ...s, enablePose: !s.enablePose }))
        }
        onSwitchCamera={() =>
          setSettings((s) => ({
            ...s,
            facing: s.facing === 'user' ? 'environment' : 'user'
          }))
        }
        onShowAdvanced={() => setShowAdvanced((v) => !v)}
        onClose={onClose}
        onReset={() =>
          setSettings({
            ...DEFAULTS,
            enablePose: false,
            facing: settings.facing
          })
        }
        onCapture={capturePhoto}
        onScaleChange={(scale) =>
          setSettings((s) => ({ ...s, scaleFactor: scale }))
        }
      />

      {showAdvanced && (
        <AdvancedControls
          show={showControls}
          settings={settings}
          onUpdateSettings={setSettings}
        />
      )}

      {!dragging && showControls && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10">
          <div className="bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-xs sm:text-sm shadow-lg">
            <Move className="w-4 h-4 inline mr-2" />
            Drag to move tattoo
          </div>
        </div>
      )}
    </div>
  );
}
