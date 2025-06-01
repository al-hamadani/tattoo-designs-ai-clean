import { useState, useRef, useEffect, useCallback } from "react";
import {
  Camera,
  Download,
  RotateCcw,
  X,
  Move,
  ZoomIn,
  ZoomOut,
  SwitchCamera,
  Sliders,
  Loader2,
  User,
} from "lucide-react";
import { SelfieSegmentation } from "@mediapipe/selfie_segmentation";
import { Pose, POSE_LANDMARKS } from "@mediapipe/pose";
import * as THREE from "three";

// MediaPipe helper - locates files from public/mediapipe/
const locateFile = (file) => `/mediapipe/${file}`;

// Persistent shared instances (survive React Strict Mode)
let globalPoseInstance = null;
let globalSegmentationInstance = null;

// Smoothing helper
const vec3Smooth = (current, previous, alpha) => {
  if (!previous) return current.clone();
  return previous.clone().lerp(current, alpha);
};

export default function RealisticARPreview({ imageUrl, design, onClose }) {
  // Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const threeCanvasRef = useRef(null);
  
  const streamRef = useRef(null);
  const frameIdRef = useRef(null);
  
  const poseRef = useRef(null);
  const segRef = useRef(null);
  
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const meshRef = useRef(null);
  const textureRef = useRef(null);

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMsg, setLoadingMsg] = useState("Initializing AR…");
  const [error, setError] = useState(null);
  
  // Tattoo transform
  const [scaleFactor, setScaleFactor] = useState(0.15);
  const [offset, setOffset] = useState({ x: 0, y: 0, z: 0.01 });
  const [rotationDeg, setRotationDeg] = useState(0);
  
  // Rendering
  const [opacity, setOpacity] = useState(0.85);
  const [blendMode, setBlendMode] = useState("multiply");
  const [tattooImg, setTattooImg] = useState(null);
  
  // UI & interaction
  const [dragging, setDragging] = useState(false);
  const [start, setStart] = useState({ x: 0, y: 0 });
  const [initOffset, setInitOffset] = useState({ x: 0, y: 0 });
  const [showControls, setShowControls] = useState(true);
  const [showAdv, setShowAdv] = useState(false);
  const [facing, setFacing] = useState("user");
  const [enablePose, setEnablePose] = useState(true);
  
  const [landmarks, setLandmarks] = useState({ shoulder: null, elbow: null, wrist: null });
  const ALPHA = 0.4;

  // Stop camera
  const stopCamera = useCallback(() => {
    if (frameIdRef.current) {
      cancelAnimationFrame(frameIdRef.current);
      frameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Main frame loop
  const loop = useCallback(async () => {
    if (!videoRef.current || videoRef.current.readyState < 3) {
      frameIdRef.current = requestAnimationFrame(loop);
      return;
    }
    
    try {
      if (segRef.current) await segRef.current.send({ image: videoRef.current });
      if (enablePose && poseRef.current) await poseRef.current.send({ image: videoRef.current });
    } catch (err) {
      console.error("Error sending frame to MediaPipe:", err);
      frameIdRef.current = requestAnimationFrame(loop);
    }
  }, [enablePose]);

  // Pose callback
  const onPose = useCallback((res) => {
    if (!res.poseLandmarks) {
      setLandmarks({ shoulder: null, elbow: null, wrist: null });
      return;
    }

    const lms = res.poseLandmarks;
    const next = { ...landmarks };

    const smooth = (key, idx) => {
      const p = lms[idx];
      if (p && p.visibility > 0.5) {
        const v = new THREE.Vector3(p.x, 1 - p.y, p.z);
        return vec3Smooth(v, next[key], ALPHA);
      }
      return null;
    };

    let s = POSE_LANDMARKS.LEFT_SHOULDER,
        e = POSE_LANDMARKS.LEFT_ELBOW,
        w = POSE_LANDMARKS.LEFT_WRIST;
        
    if (!lms[s] || lms[s].visibility < 0.4) {
      s = POSE_LANDMARKS.RIGHT_SHOULDER;
      e = POSE_LANDMARKS.RIGHT_ELBOW;
      w = POSE_LANDMARKS.RIGHT_WRIST;
    }

    next.shoulder = smooth("shoulder", s);
    next.elbow = smooth("elbow", e);
    next.wrist = smooth("wrist", w);
    setLandmarks(next);
  }, [landmarks]);

  // Segmentation callback
  const onSeg = useCallback((res) => {
    if (!canvasRef.current || !videoRef.current || !tattooImg || 
        !meshRef.current || !rendererRef.current || !res.segmentationMask) {
      frameIdRef.current = requestAnimationFrame(loop);
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;

    // Draw base video frame
    ctx.save();
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(videoRef.current, 0, 0, width, height);

    // Update & render tattoo mesh
    if (enablePose && landmarks.elbow && landmarks.wrist) {
      const sx = width, sy = height;
      const elbow = new THREE.Vector3(
        landmarks.elbow.x * sx - width / 2,
        landmarks.elbow.y * sy - height / 2,
        0
      );
      const wrist = new THREE.Vector3(
        landmarks.wrist.x * sx - width / 2,
        landmarks.wrist.y * sy - height / 2,
        0
      );
      const mid = elbow.clone().add(wrist).multiplyScalar(0.5);
      const dir = wrist.clone().sub(elbow);

      meshRef.current.position.set(
        mid.x + offset.x * width,
        mid.y + offset.y * height,
        offset.z
      );
      meshRef.current.rotation.z = Math.atan2(dir.y, dir.x) + (rotationDeg * Math.PI) / 180;

      const planeW = dir.length() * (scaleFactor / 0.15);
      const planeH = (planeW * tattooImg.height) / tattooImg.width;
      meshRef.current.scale.set(planeW, planeH, 1);
      meshRef.current.visible = true;
    } else if (!enablePose) {
      // Manual mode
      meshRef.current.position.set(offset.x * width, offset.y * height, offset.z);
      const w = width * scaleFactor;
      const h = (w * tattooImg.height) / tattooImg.width;
      meshRef.current.scale.set(w, h, 1);
      meshRef.current.rotation.z = (rotationDeg * Math.PI) / 180;
      meshRef.current.visible = true;
    } else {
      meshRef.current.visible = false;
    }

    // Render Three.js scene
    rendererRef.current.render(sceneRef.current, cameraRef.current);

    // Composite tattoo through segmentation mask
    const tmp = document.createElement('canvas');
    tmp.width = width;
    tmp.height = height;
    const tctx = tmp.getContext('2d');
    
    tctx.drawImage(threeCanvasRef.current, 0, 0);
    tctx.globalCompositeOperation = 'destination-in';
    tctx.drawImage(res.segmentationMask, 0, 0, width, height);

    ctx.globalCompositeOperation = blendMode;
    ctx.globalAlpha = opacity;
    ctx.drawImage(tmp, 0, 0);

    ctx.restore();

    // Schedule next frame
    frameIdRef.current = requestAnimationFrame(loop);
  }, [
    tattooImg,
    blendMode,
    opacity,
    enablePose,
    landmarks,
    offset,
    rotationDeg,
    scaleFactor,
    loop
  ]);

  // Initialize models
  const initModels = useCallback(async () => {
    setLoadingMsg("Loading AI models...");
    
    if (globalPoseInstance && globalSegmentationInstance) {
      poseRef.current = globalPoseInstance;
      segRef.current = globalSegmentationInstance;
      segRef.current.onResults(onSeg);
      poseRef.current.onResults(onPose);
      console.log('🔄 Re-using existing MediaPipe instances');
      return;
    }

    try {
      console.log('📦 Loading Selfie Segmentation...');
      const seg = new SelfieSegmentation({ locateFile });
      seg.setOptions({ modelSelection: 1 });
      seg.onResults(onSeg);
      await seg.initialize();
      segRef.current = seg;
      globalSegmentationInstance = seg;
      console.log('✅ Selfie Segmentation loaded');

      console.log('📦 Loading Pose Detection...');
      const pose = new Pose({ locateFile });
      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      pose.onResults(onPose);
      await pose.initialize();
      poseRef.current = pose;
      globalPoseInstance = pose;
      console.log('✅ Pose Detection loaded');
    } catch (err) {
      console.error('❌ Failed to init MediaPipe models:', err);
      setError('Failed to load AI models. Please try again.');
    }
  }, [onSeg, onPose]);

  // Load tattoo image
  useEffect(() => {
    if (!imageUrl) {
      setError("Tattoo image URL is missing.");
      return;
    }
    
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setTattooImg(img);
      if (meshRef.current && img) {
        if (textureRef.current) textureRef.current.dispose();
        const tex = new THREE.Texture(img);
        tex.needsUpdate = true;
        meshRef.current.material.map = tex;
        meshRef.current.material.needsUpdate = true;
        textureRef.current = tex;
      }
    };
    img.onerror = () => setError("Failed to load tattoo image");
    img.src = imageUrl;
  }, [imageUrl]);

  // Initialize Three.js
  const initThree = useCallback((w, h) => {
    console.log('🎮 initThree called with', w, h);
    
    // Create off-screen canvas
    if (!threeCanvasRef.current) {
      threeCanvasRef.current = document.createElement('canvas');
    }
    threeCanvasRef.current.width = w;
    threeCanvasRef.current.height = h;

    // Setup main canvas dimensions
    if (canvasRef.current) {
      canvasRef.current.width = w;
      canvasRef.current.height = h;
    }

    // Scene
    sceneRef.current = new THREE.Scene();
    
    // Camera
    cameraRef.current = new THREE.OrthographicCamera(
      -w / 2, w / 2, 
      h / 2, -h / 2, 
      0.1, 1000
    );
    cameraRef.current.position.z = 500;

    // Renderer
    rendererRef.current = new THREE.WebGLRenderer({ 
      canvas: threeCanvasRef.current, 
      alpha: true, 
      antialias: true,
      preserveDrawingBuffer: true
    });
    rendererRef.current.setSize(w, h);
    rendererRef.current.setPixelRatio(1); // Use 1 for performance
    rendererRef.current.setClearColor(0x000000, 0);

    // Lighting
    sceneRef.current.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dir = new THREE.DirectionalLight(0xffffff, 0.5);
    dir.position.set(0, 1, 1);
    sceneRef.current.add(dir);

    // Mesh
    const geom = new THREE.PlaneGeometry(1, 1);
    const mat = new THREE.MeshStandardMaterial({ 
      transparent: true, 
      side: THREE.DoubleSide, 
      roughness: 0.8, 
      metalness: 0.1 
    });
    meshRef.current = new THREE.Mesh(geom, mat);
    sceneRef.current.add(meshRef.current);

    // Apply texture if available
    if (tattooImg) {
      const tex = new THREE.Texture(tattooImg);
      tex.needsUpdate = true;
      mat.map = tex;
      mat.needsUpdate = true;
      textureRef.current = tex;
    }
    
    console.log('✅ Three.js initialized');
  }, [tattooImg]);

  // Start camera
  const startCamera = useCallback(() => {
    stopCamera();
    setLoadingMsg("Accessing camera…");

    navigator.mediaDevices
      .getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: facing,
        },
      })
      .then(async (stream) => {
        streamRef.current = stream;
        if (!videoRef.current) return;

        videoRef.current.srcObject = stream;

        const handleMeta = async () => {
          console.log("📹 Video metadata loaded");
          const { videoWidth: w, videoHeight: h } = videoRef.current;
          console.log("📐 Video dimensions:", w, "×", h);

          try {
            initThree(w, h);
            setIsLoading(false);
            setLoadingMsg("Processing video…");
            await videoRef.current.play();
            loop();
          } catch (err) {
            console.error("❌ Error:", err);
            setError(`Failed to start AR: ${err.message}`);
          }
        };

        videoRef.current.addEventListener("loadedmetadata", handleMeta, { once: true });
        
        if (videoRef.current.readyState >= 3) {
          handleMeta();
        }
      })
      .catch((err) => {
        console.error("❌ Camera error:", err);
        setError(`Camera error: ${err.message}`);
      });
  }, [facing, initThree, loop, stopCamera]);

  // Initialize on mount
  useEffect(() => {
    initModels();
    const controlsTimer = setTimeout(() => setShowControls(false), 5000);

    return () => {
      clearTimeout(controlsTimer);
      stopCamera();
      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current = null;
      }
      if (textureRef.current) {
        textureRef.current.dispose();
        textureRef.current = null;
      }
    };
  }, [initModels, stopCamera]);

  // Start camera when ready
  useEffect(() => {
    if (tattooImg && globalSegmentationInstance && globalPoseInstance) {
      console.log('✅ All resources ready, starting camera');
      startCamera();
    }
  }, [tattooImg, startCamera]);

  // UI handlers
  const switchCam = () => {
    setIsLoading(true);
    setLoadingMsg("Switching camera...");
    setFacing((p) => (p === "user" ? "environment" : "user"));
  };

  const beginDrag = (e) => {
    e.preventDefault();
    setDragging(true);
    setShowControls(true);
    const src = e.touches ? e.touches[0] : e;
    const rect = canvasRef.current.getBoundingClientRect();
    setStart({ x: src.clientX - rect.left, y: src.clientY - rect.top });
    setInitOffset({ x: offset.x, y: offset.y });
  };

  const moveDrag = (e) => {
    if (!dragging || !canvasRef.current) return;
    const src = e.touches ? e.touches[0] : e;
    const rect = canvasRef.current.getBoundingClientRect();
    const dx = (src.clientX - rect.left - start.x) / rect.width;
    const dy = (src.clientY - rect.top - start.y) / rect.height;
    setOffset({
      ...offset,
      x: Math.max(-0.5, Math.min(0.5, initOffset.x + dx)),
      y: Math.max(-0.5, Math.min(0.5, initOffset.y - dy))
    });
  };

  const endDrag = () => setDragging(false);

  const resetPosition = () => {
    setScaleFactor(0.15);
    setOffset({ x: 0, y: 0, z: 0.01 });
    setRotationDeg(0);
    setOpacity(0.85);
    setBlendMode("multiply");
    setEnablePose(true);
  };

  const captureARPhoto = () => {
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

  // Error screen
  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black z-50 p-4">
        <div className="bg-gray-800 text-white rounded-xl p-6 max-w-md w-full text-center space-y-4">
          <Camera className="w-12 h-12 mx-auto text-red-400" />
          <p className="text-lg font-semibold">AR Preview Error</p>
          <p className="text-sm text-gray-300">{error}</p>
          <button onClick={onClose} className="bg-blue-600 rounded-lg px-4 py-2 text-white hover:bg-blue-700 w-full">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black select-none overflow-hidden z-40" 
         onTouchMove={(e) => dragging && e.preventDefault()}>
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
        onMouseDown={beginDrag}
        onMouseMove={moveDrag}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
        onTouchStart={beginDrag}
        onTouchMove={moveDrag}
        onTouchEnd={endDrag}
        onClick={() => !dragging && setShowControls((p) => !p)}
      />

      {/* Header controls */}
      <div className={`fixed top-0 left-0 right-0 bg-gradient-to-b from-black/60 to-transparent p-3 sm:p-4 transition-all duration-300 z-20 ${
        showControls ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none'
      }`}>
        <div className="flex items-center justify-between max-w-screen-lg mx-auto">
          <h3 className="text-white font-semibold text-base sm:text-lg truncate pr-2">3D AR Tattoo</h3>
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setEnablePose(prev => !prev)}
              className={`p-2 rounded-full text-white transition-colors backdrop-blur-md ${
                enablePose ? 'bg-green-500/30 hover:bg-green-500/40' : 'bg-white/10 hover:bg-white/20'
              }`}
              title={enablePose ? "Disable Arm Tracking" : "Enable Arm Tracking"}
            >
              <User className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <button
              onClick={switchCam}
              className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20"
              title="Switch camera"
            >
              <SwitchCamera className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <button
              onClick={() => setShowAdv(prev => !prev)}
              className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20"
              title="Advanced settings"
            >
              <Sliders className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-red-500/20 backdrop-blur-md rounded-full text-white hover:bg-red-500/40"
              title="Close AR"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Advanced controls panel */}
      {showAdv && showControls && (
        <div className="fixed top-16 sm:top-20 right-3 sm:right-4 bg-black/70 backdrop-blur-lg rounded-lg p-3 sm:p-4 text-white w-[260px] sm:w-[280px] z-30 shadow-xl">
          <h4 className="font-semibold mb-3 text-sm sm:text-base">Advanced Settings</h4>
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="text-xs sm:text-sm mb-1 block">Opacity: {Math.round(opacity * 100)}%</label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.01"
                value={opacity}
                onChange={(e) => setOpacity(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-xs sm:text-sm mb-1 block">Rotation: {rotationDeg}°</label>
              <input
                type="range"
                min="-180"
                max="180"
                value={rotationDeg}
                onChange={(e) => setRotationDeg(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-xs sm:text-sm mb-1 block">Blend Mode:</label>
              <select
                value={blendMode}
                onChange={(e) => setBlendMode(e.target.value)}
                className="w-full p-2 bg-white/10 rounded text-xs sm:text-sm"
              >
                <option value="multiply">Multiply</option>
                <option value="screen">Screen</option>
                <option value="overlay">Overlay</option>
                <option value="normal">Normal</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Bottom controls */}
      <div className={`fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/50 to-transparent transition-all duration-300 z-20 ${
        showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full pointer-events-none'
      }`}>
        <div className="px-4 sm:px-6 pt-3 sm:pt-4 pb-6">
          <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
            <ZoomOut className="w-5 h-5 sm:w-6 sm:h-6 text-white opacity-80" />
            <input
              type="range"
              min="0.05"
              max="0.5"
              step="0.01"
              value={scaleFactor}
              onChange={(e) => setScaleFactor(parseFloat(e.target.value))}
              className="flex-1"
            />
            <ZoomIn className="w-5 h-5 sm:w-6 sm:h-6 text-white opacity-80" />
          </div>
          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={resetPosition}
              className="flex-1 bg-white/10 backdrop-blur-md text-white py-2.5 sm:py-3 rounded-xl font-medium hover:bg-white/20"
            >
              <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 inline mr-1.5" /> Reset
            </button>
            <button
              onClick={captureARPhoto}
              className="flex-1 bg-blue-500 text-white py-2.5 sm:py-3 rounded-xl font-medium hover:bg-blue-600"
            >
              <Download className="w-4 h-4 sm:w-5 sm:h-5 inline mr-1.5" /> Save
            </button>
          </div>
        </div>
      </div>

      {/* Instructions */}
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