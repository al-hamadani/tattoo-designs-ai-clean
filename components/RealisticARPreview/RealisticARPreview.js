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
import { DEFAULTS }                  from './utils/constants';

import { Move, Loader2 } from 'lucide-react';

export default function RealisticARPreview({ imageUrl, design, onClose }) {
  if (typeof window === 'undefined') {
    return null;
  }

  const videoRef      = useRef(null);
  const canvasRef     = useRef(null);
  const frameIdRef    = useRef(null);
  const processingRef = useRef(false);
  const frameCountRef = useRef(0);
  const lastCallbackRef = useRef(0);
  const processSegmentationRef = useRef();
  const modelsReadyRef = useRef(false);

  const [isLoading, setIsLoading]   = useState(true);
  const [loadingMsg, setLoadingMsg] = useState('Initializing AR…');
  const [error,     setError]       = useState(null);
  const [debug,     setDebug]       = useState({ fps: 0, last: 0, frames: 0, callbacks: 0 });

  const [settings, setSettings] = useState({
    scaleFactor : DEFAULTS.SCALE_FACTOR,
    offset      : { x: 0, y: 0, z: 0.01 },
    rotationDeg : 0,
    opacity     : DEFAULTS.OPACITY,
    blendMode   : DEFAULTS.BLEND_MODE,
    enablePose  : false,
    bodyPart    : 'manual',
    facing      : 'user'
  });

  const [dragging,      setDragging]      = useState(false);
  const [dragStart,     setDragStart]     = useState({ x: 0, y: 0 });
  const [initOffset,    setInitOffset]    = useState({ x: 0, y: 0 });
  const [showControls,  setShowControls]  = useState(true);
  const [showAdvanced,  setShowAdvanced]  = useState(false);

  const { startCamera, stopCamera } = useCamera(videoRef, settings.facing);
  const { landmarks, detectedParts, processResults } = usePoseDetection();

  // HOOK: useThreeScene
  const {
    scene, camera, renderer, mesh, threeCanvas,
    initThree, updateMesh, cleanup: cleanupThree
  } = useThreeScene(imageUrl);

  // Three.js debug effect
  useEffect(() => {
    console.log('🔍 Three.js objects status:', {
      scene: !!scene,
      camera: !!camera,
      renderer: !!renderer,
      mesh: !!mesh,
      threeCanvas: !!threeCanvas
    });
  }, [scene, camera, renderer, mesh, threeCanvas]);

  // MediaPipe (with setModelsReady included in destructuring)
  const {
    poseRef, segRef, initModels, sendFrame, modelsReady, setModelsReady
  } = useMediaPipe({
    onPoseResults: processResults,
    onSegmentationResults: (results) => {
      if (processSegmentationRef.current) {
        processSegmentationRef.current(results);
      } else {
        console.warn('processSegmentation not yet defined');
      }
    }
  });

  // Keep modelsReadyRef in sync
  useEffect(() => {
    modelsReadyRef.current = modelsReady;
  }, [modelsReady]);

  // Add the body part change handler
  const handleBodyPartChange = useCallback((bodyPart) => {
    setSettings(prev => ({ ...prev, bodyPart }));
    // Reset offset when changing body parts for better initial placement
    if (bodyPart !== 'manual') {
      setSettings(prev => ({
        ...prev,
        bodyPart,
        offset: { x: 0, y: 0, z: 0.01 }
      }));
    }
  }, []);

  // SAFER, DEBUGGING processSegmentation
  const processSegmentation = useCallback((results) => {
    frameCountRef.current++;
    lastCallbackRef.current = Date.now();

    if (!canvasRef.current || !videoRef.current) {
      console.log('⚠️ Missing canvas or video');
      processingRef.current = false;
      return;
    }

    const ctx = canvasRef.current.getContext('2d');
    const { width, height } = canvasRef.current;

    // Draw base video frame
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(videoRef.current, 0, 0, width, height);

    // Debug info on canvas
    ctx.fillStyle = 'red';
    ctx.fillRect(10, 10, 50, 50);
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.fillText(`Frame: ${frameCountRef.current}`, 10, 80);

    // Only try Three.js rendering if all components are ready
    if (mesh && renderer && camera && scene && threeCanvas) {
      try {
        const transform = calculateTattooTransform({
          bodyPart: settings.bodyPart,
          detectedParts,
          landmarks,
          dimensions: { width, height },
          settings,
          design
        });

        // Log transform details every 60 frames
        if (frameCountRef.current % 60 === 0) {
          console.log('🎯 Transform:', {
            visible: transform.visible,
            position: transform.position,
            scale: transform.scale,
            rotation: transform.rotation
          });
        }

        if (transform.visible) {
          updateMesh(transform);

          // Clear Three.js canvas (for transparent BG)
          if (renderer.setClearColor) renderer.setClearColor(0x000000, 0);
          if (renderer.clear) renderer.clear();

          // Render Three.js scene
          renderer.render(scene, camera);

          // Draw Three.js canvas to main canvas
          ctx.save();
          ctx.globalAlpha = settings.opacity;
          ctx.globalCompositeOperation = settings.blendMode;

          // Check if Three.js canvas has content
          let hasContent = false;
          try {
            const threeCtx = threeCanvas.getContext && threeCanvas.getContext('2d');
            if (threeCtx && threeCtx.getImageData) {
              const imageData = threeCtx.getImageData(0, 0, 1, 1);
              hasContent = imageData.data.some(pixel => pixel > 0);
            }
          } catch (e) {
            // In case threeCanvas is a WebGL canvas and getContext('2d') fails, just skip this debug
          }

          if (frameCountRef.current % 60 === 0) {
            console.log('🖼️ Three.js canvas:', {
              width: threeCanvas.width,
              height: threeCanvas.height,
              hasContent,
              meshVisible: mesh.visible,
              meshScale: mesh.scale,
              meshPosition: mesh.position
            });
          }

          ctx.drawImage(threeCanvas, 0, 0, width, height);
          ctx.restore();

          // Debug: Draw tattoo position indicator
          ctx.strokeStyle = 'lime';
          ctx.lineWidth = 2;
          ctx.strokeRect(
            transform.position.x + width / 2 - transform.scale.x / 2,
            transform.position.y + height / 2 - transform.scale.y / 2,
            transform.scale.x,
            transform.scale.y
          );
        }
      } catch (err) {
        console.error('❌ Render error:', err);
      }
    } else {
      if (frameCountRef.current === 1) {
        console.log('⏳ Three.js not ready:', {
          mesh: !!mesh,
          renderer: !!renderer,
          camera: !!camera,
          scene: !!scene,
          threeCanvas: !!threeCanvas
        });
      }
    }

    // Update FPS
    const now = performance.now();
    const fps = Math.round(1000 / (now - (debug.last || now)));
    setDebug({
      fps,
      last: now,
      frames: frameCountRef.current,
      callbacks: frameCountRef.current
    });

    processingRef.current = false;
  }, [mesh, renderer, camera, scene, landmarks, detectedParts, settings, debug.last, design, updateMesh, threeCanvas]);

  // Always update ref
  useEffect(() => {
    processSegmentationRef.current = processSegmentation;
  }, [processSegmentation]);

  // Animation loop
  const loop = useCallback(async () => {
    if (!videoRef.current) {
      console.warn('⚠️ No video element in loop');
      frameIdRef.current = requestAnimationFrame(loop);
      return;
    }

    if (videoRef.current.readyState < 3) {
      console.log('⏳ Video not ready, state:', videoRef.current.readyState);
      frameIdRef.current = requestAnimationFrame(loop);
      return;
    }

    // Check if callbacks are stale
    const timeSinceLastCallback = Date.now() - lastCallbackRef.current;
    if (timeSinceLastCallback > 1000 && frameCountRef.current > 10) {
      console.warn('⚠️ No callbacks for', timeSinceLastCallback, 'ms');
    }

    if (!processingRef.current && modelsReadyRef.current) {
      processingRef.current = true;
      try {
       // console.log('🔄 Frame', frameCountRef.current, 'sending...');
        await sendFrame(videoRef.current);
      } catch (err) {
       // console.error('sendFrame error:', err);
      } finally {
        processingRef.current = false;
      }
    } else if (!modelsReadyRef.current) {
     // console.log('⏳ Waiting for models...', { ready: modelsReadyRef.current });
    }

    frameIdRef.current = requestAnimationFrame(loop);
  }, [sendFrame]);

  // AR Boot
  useEffect(() => {
    let mounted = true;
    let initialized = false;

    const initialize = async () => {
      if (initialized) return;
      initialized = true;

      try {
        console.log('🚀 Starting AR initialization...');
        const { width, height } = await startCamera();
        if (!mounted) return;

        setLoadingMsg('Loading AI models…');
        await initModels();
        if (!mounted) return;

        // Verify models are initialized
        console.log('Model check:', {
          hasPose: !!poseRef.current,
          hasSegmentation: !!segRef.current,
          modelsReady
        });

        initThree(width, height);

        if (canvasRef.current) {
          canvasRef.current.width = width;
          canvasRef.current.height = height;
        }

        setIsLoading(false);
        console.log('🚀 Starting animation loop');
        loop();
      } catch (e) {
        console.error('Boot error:', e);
        if (mounted) {
          setError(e.message || 'Failed to initialize AR');
        }
      }
    };

    const timer = setTimeout(initialize, 100);

    return () => {
      mounted = false;
      clearTimeout(timer);
      stopCamera();
      cleanupThree();
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
        frameIdRef.current = null;
      }
    };
  }, []);

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
    if (!dragging || !canvasRef.current) return;
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
            offset: DEFAULTS.OFFSET,
            rotationDeg: DEFAULTS.ROTATION,
            enablePose: false,
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
