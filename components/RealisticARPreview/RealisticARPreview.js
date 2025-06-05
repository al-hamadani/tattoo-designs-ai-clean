// components/RealisticARPreview/RealisticARPreview.js

import { useState, useRef, useEffect, useCallback } from 'react';
import { useCamera }        from './hooks/useCamera';
import { useMediaPipe }     from './hooks/useMediaPipe';
import { usePoseDetection } from './hooks/usePoseDetection';
import { useThreeScene }    from './hooks/useThreeScene';

import { ARControls }        from './components/ARControls';
import { AdvancedControls }  from './components/AdvancedControls';
import { DebugInfo }         from './components/DebugInfo';
import { ErrorDisplay }      from './components/ErrorDisplay';

import { calculateTattooTransform }  from './utils/bodyPartDetection';
import { compositeWithSegmentation } from './utils/imageProcessing';
import { warpToBody }                from './utils/warpToBody';
import { DEFAULTS }                  from './utils/constants';

import { Move, Loader2, Sliders } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RealisticARPreview({ imageUrl, design, onClose }) {
  if (typeof window === 'undefined') return null;

  const videoRef      = useRef(null);
  const canvasRef     = useRef(null);
  const frameIdRef    = useRef(null);
  const processingRef = useRef(false);
  const frameCountRef = useRef(0);
  const lastCallbackRef = useRef(0);
  const callbackCountRef = useRef(0);
  const processSegmentationRef = useRef();
  const modelsReadyRef = useRef(false);
  const tattooVisibleRef = useRef(true);
  const initializingRef = useRef(false);
  const initializedRef = useRef(false);

  const [isLoading, setIsLoading]   = useState(true);
  const [loadingMsg, setLoadingMsg] = useState('Initializing AR…');
  const [error,     setError]       = useState(null);
  const [debug,     setDebug]       = useState({ fps: 0, last: 0, frames: 0, callbacks: 0 });

  const [settings, setSettings] = useState({
    scaleFactor: DEFAULTS.SCALE_FACTOR,
    offset: { x: 0, y: 0, z: 0.01 },
    rotationDeg: 0,
    opacity: DEFAULTS.OPACITY,
    blendMode: DEFAULTS.BLEND_MODE,
    enablePose: true,
    bodyPart: 'auto',
    facing: 'user'
  });

  const [controlsAlwaysVisible, setControlsAlwaysVisible] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initOffset, setInitOffset] = useState({ x: 0, y: 0 });
  const [pinching, setPinching] = useState(false);
  const pinchRef = useRef(null);
  const [showControls, setShowControls] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const { startCamera, stopCamera } = useCamera(videoRef, settings.facing);
  const { landmarks, detectedParts, processResults } = usePoseDetection();
  const {
    scene, camera, renderer, mesh, threeCanvas,
    initThree, updateMesh, cleanup: cleanupThree
  } = useThreeScene(imageUrl);
  const {
    poseRef, segRef, initModels, sendFrame, modelsReady, setModelsReady
  } = useMediaPipe({
    onPoseResults: processResults,
    onSegmentationResults: (results) => {
      if (processSegmentationRef.current) {
        processSegmentationRef.current(results);
      }
    }
  });

  useEffect(() => {
    modelsReadyRef.current = modelsReady;
  }, [modelsReady]);

  const handleBodyPartChange = useCallback((bodyPart) => {
    setSettings(prev => ({
      ...prev,
      bodyPart,
      ...(bodyPart !== 'manual' && {
        offset: { x: 0, y: 0, z: 0.01 }
      })
    }));
  }, []);

  const processSegmentation = useCallback((results) => {
    frameCountRef.current++;
    lastCallbackRef.current = Date.now();
    callbackCountRef.current++;

    if (!canvasRef.current || !videoRef.current) {
      processingRef.current = false;
      return;
    }

    const ctx = canvasRef.current.getContext('2d');
    const { width, height } = canvasRef.current;

    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(videoRef.current, 0, 0, width, height);

    if (mesh && renderer && camera && scene && threeCanvas) {
      try {
        const transform = calculateTattooTransform({
          bodyPart: settings.bodyPart,
          detectedParts,
          landmarks,
          segmentationMask: results.segmentationMask,
          dimensions: { width, height },
          settings,
          design
        });

        if (settings.bodyPart === 'manual' || transform.visible) {
          if (settings.bodyPart === 'manual') {
            transform.visible = true;
            transform.position = {
              x: settings.offset.x * width,
              y: settings.offset.y * height,
              z: settings.offset.z
            };
            transform.rotation = (settings.rotationDeg * Math.PI) / 180;
            transform.scale = {
              x: width * settings.scaleFactor * 0.5,
              y: width * settings.scaleFactor * 0.5,
              z: 1
            };
          }

          updateMesh(transform);
          warpToBody({ mesh, bodyPart: settings.bodyPart, landmarks });

          if (renderer.setClearColor) renderer.setClearColor(0x000000, 0);
          if (renderer.clear) renderer.clear();

          renderer.render(scene, camera);

          ctx.save();
          ctx.globalAlpha = settings.opacity;
          ctx.globalCompositeOperation = settings.blendMode;
          ctx.drawImage(threeCanvas, 0, 0, width, height);
          ctx.restore();
        }
      } catch (err) {
        console.error('❌ Render error:', err);
      }
    }

    processingRef.current = false;
  }, [mesh, renderer, camera, scene, landmarks, detectedParts, settings, design, updateMesh, threeCanvas]);

  useEffect(() => {
    processSegmentationRef.current = processSegmentation;
  }, [processSegmentation]);

  useEffect(() => {
    let lastFrame = 0;
    let lastTime = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      const frames = frameCountRef.current;
      const fps = Math.round(((frames - lastFrame) * 1000) / (now - lastTime));
      lastFrame = frames;
      lastTime = now;
      setDebug({
        fps,
        last: now,
        frames,
        callbacks: callbackCountRef.current
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const loop = useCallback(async () => {
    if (!videoRef.current) {
      frameIdRef.current = requestAnimationFrame(loop);
      return;
    }

    if (videoRef.current.readyState < 3) {
      frameIdRef.current = requestAnimationFrame(loop);
      return;
    }

    const timeSinceLastCallback = Date.now() - lastCallbackRef.current;
    if (timeSinceLastCallback > 1000 && frameCountRef.current > 10) {
      console.warn('⚠️ No callbacks for', timeSinceLastCallback, 'ms');
    }

    if (!processingRef.current && modelsReadyRef.current) {
      processingRef.current = true;
      try {
        await sendFrame(videoRef.current);
      } catch (err) {
        console.error('sendFrame error:', err);
      } finally {
        processingRef.current = false;
      }
    }

    frameIdRef.current = requestAnimationFrame(loop);
  }, [sendFrame]);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      if (initializingRef.current || initializedRef.current) return;
      initializingRef.current = true;

      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        if (!mounted) return;

        const { width, height } = await startCamera();
        if (!mounted) return;

        setLoadingMsg('Loading AI models…');
        await initModels();
        if (!mounted) return;

        initThree(width, height);

        if (canvasRef.current) {
          canvasRef.current.width = width;
          canvasRef.current.height = height;
        }

        setIsLoading(false);
        initializedRef.current = true;
        loop();
      } catch (e) {
        console.error('Boot error:', e);
        if (mounted) setError(e.message || 'Failed to initialize AR');
      } finally {
        initializingRef.current = false;
      }
    };

    const controlsTimer = !controlsAlwaysVisible
      ? setTimeout(() => setShowControls(false), 10000)
      : null;

    const timer = setTimeout(initialize, 100);

    return () => {
      mounted = false;
      clearTimeout(timer);
      if (controlsTimer) clearTimeout(controlsTimer);
      if (initializedRef.current) {
        stopCamera();
        cleanupThree();
        if (frameIdRef.current) {
          cancelAnimationFrame(frameIdRef.current);
          frameIdRef.current = null;
        }
      }
    };
  }, []);

  useEffect(() => {
    if (!initializedRef.current) return;

    let cancelled = false;
    const restart = async () => {
      try {
        stopCamera();
        const { width, height } = await startCamera();
        if (!cancelled && canvasRef.current) {
          canvasRef.current.width = width;
          canvasRef.current.height = height;
        }
      } catch (e) {
        console.error('Camera switch error:', e);
        if (!cancelled) setError(e.message || 'Failed to switch camera');
      }
    };

    restart();
    return () => {
      cancelled = true;
    };
  }, [settings.facing]);

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
    if (!dragging || !canvasRef.current) return;
    const p = e.touches ? e.touches[0] : e;
    const rect = canvasRef.current.getBoundingClientRect();
    const dx = (p.clientX - rect.left - dragStart.x) / rect.width;
    const dy = (p.clientY - rect.top - dragStart.y) / rect.height;

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

  const handleTouchStart = (e) => {
    if (e.touches && e.touches.length === 2) {
      e.preventDefault();
      setPinching(true);
      const [t1, t2] = e.touches;
      const dx = t2.clientX - t1.clientX;
      const dy = t2.clientY - t1.clientY;
      pinchRef.current = {
        distance: Math.hypot(dx, dy),
        angle: Math.atan2(dy, dx),
        scale: settings.scaleFactor,
        rotation: settings.rotationDeg,
      };
    } else {
      handleDragStart(e);
    }
  };

  const handleTouchMove = (e) => {
    if (pinching && e.touches && e.touches.length === 2) {
      e.preventDefault();
      const [t1, t2] = e.touches;
      const dx = t2.clientX - t1.clientX;
      const dy = t2.clientY - t1.clientY;
      const dist = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);
      const scaleChange = dist / pinchRef.current.distance;
      const newScale = Math.max(0.05, Math.min(0.5, pinchRef.current.scale * scaleChange));
      const rotChange = (angle - pinchRef.current.angle) * (180 / Math.PI);
      setSettings((s) => ({
        ...s,
        scaleFactor: newScale,
        rotationDeg: pinchRef.current.rotation + rotChange,
      }));
    } else {
      handleDragMove(e);
    }
  };

  const handleTouchEnd = (e) => {
    if (pinching && (!e.touches || e.touches.length < 2)) {
      setPinching(false);
      pinchRef.current = null;
    }
    if (!pinching) {
      handleDragEnd();
    }
  };

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
      className="fixed inset-0 bg-black select-none overflow-hidden z-50 safe-area-inset"
      onTouchMove={(e) => (dragging || pinching) && e.preventDefault()}
    >
      <DebugInfo
        show={!isLoading}
        fps={debug.fps}
        additionalInfo={`Frames: ${debug.frames}, Callbacks: ${debug.callbacks}`}
      />

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
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => {
          if (!dragging) {
            setShowControls(true);
            console.log('Canvas clicked, showing controls');
          }
        }}
      />

      {!showControls && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-md text-white px-6 py-3 rounded-full text-sm font-medium shadow-lg z-30"
        >
          <div className="flex items-center gap-2">
            <Move className="w-4 h-4" />
            Tap anywhere to show controls
          </div>
        </motion.div>
      )}

      <button
        onClick={() => setShowControls(!showControls)}
        className={`fixed top-4 right-4 p-3 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-black/80 transition-all z-30 ${
          showControls ? 'opacity-50' : 'opacity-100'
        }`}
        title="Toggle controls"
      >
        <Sliders className="w-6 h-6" />
      </button>

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
        isAdvancedVisible={showAdvanced}
        onClose={onClose}
        onReset={() =>
          setSettings({
            scaleFactor: DEFAULTS.SCALE_FACTOR,
            offset: DEFAULTS.OFFSET,
            rotationDeg: DEFAULTS.ROTATION,
            opacity: DEFAULTS.OPACITY,
            blendMode: DEFAULTS.BLEND_MODE,
            enablePose: true,
            bodyPart: 'auto',
            facing: settings.facing
          })
        }
        onCapture={capturePhoto}
        onScaleChange={(scale) =>
          setSettings((s) => ({ ...s, scaleFactor: scale }))
        }
        onBodyPartChange={handleBodyPartChange}
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
