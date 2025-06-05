// components/RealisticARPreview/hooks/useThreeScene.js
import { useRef, useCallback, useEffect, useState } from 'react';
import * as THREE from 'three';
import { webglContextManager } from '../utils/webglContextManager';

export const useThreeScene = (imageUrl) => {
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const meshRef = useRef(null);
  const textureRef = useRef(null);
  const threeCanvasRef = useRef(null);

  const [tattooImage, setTattooImage] = useState(null);
  const [isMeshReady, setIsMeshReady] = useState(false); // Track mesh initialization

  // Effect 1: Load the tattoo image when imageUrl changes
  useEffect(() => {
    setTattooImage(null);

    if (!imageUrl) {
      console.log('ℹ️ No image URL provided, clearing tattoo image.');
      return;
    }

    console.log('🖼️ Loading tattoo image:', imageUrl);
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      console.log('✅ Tattoo image loaded:', {
        naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight,
        width: img.width, height: img.height, src: img.src
      });
      setTattooImage(img);
    };
    img.onerror = (err) => {
      console.error("❌ Failed to load tattoo image:", imageUrl, err);
      setTattooImage(null);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // --- CHANGED: updateTexture uses THREE.TextureLoader ---
  const updateTexture = useCallback((loadedImg) => {
    if (!meshRef.current || !meshRef.current.material) {
      console.error('🎨 updateTexture: Mesh or material not ready.');
      return;
    }
    if (
      !loadedImg ||
      !loadedImg.complete ||
      typeof loadedImg.naturalWidth === 'undefined' ||
      loadedImg.naturalWidth === 0
    ) {
      console.error('🎨 updateTexture: Image not ready or invalid for texture creation:', loadedImg);
      if (meshRef.current.material.map) meshRef.current.material.map.dispose();
      meshRef.current.material.map = null;
      meshRef.current.material.needsUpdate = true;
      return;
    }

    console.log('🎨 Attempting to update texture with image:', loadedImg.src);

    if (textureRef.current) {
      textureRef.current.dispose();
    }

    // Use TextureLoader for async and reliable texture creation
    const loader = new THREE.TextureLoader();
    loader.load(
      loadedImg.src,
      // onLoad callback
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;

        meshRef.current.material.map = texture;
        meshRef.current.material.color.set(0xffffff);
        meshRef.current.material.opacity = 1.0;
        meshRef.current.material.needsUpdate = true;
        meshRef.current.visible = true;

        textureRef.current = texture;

        // --- ADDED: Debug info after setting texture ---
        console.log('✅ Texture loaded and applied via TextureLoader');
        console.log('🎨 Material updated. Map set:', !!meshRef.current.material.map, 'Color:', meshRef.current.material.color.getHexString());
        console.log('🔍 Texture debug:', {
          image: texture.image,
          width: texture.image.width,
          height: texture.image.height,
          loaded: texture.image.complete
        });
      },
      // onProgress (optional)
      undefined,
      // onError
      (error) => {
        console.error('❌ TextureLoader failed:', error);
      }
    );
  }, []);

  // Effect 2: Apply or clear texture based on tattooImage and isMeshReady
  useEffect(() => {
    console.log(`🎨 Effect [tattooImage, isMeshReady] triggered. tattooImage: ${!!tattooImage}, isMeshReady: ${isMeshReady}, meshRef: ${!!meshRef.current}`);
    if (isMeshReady && meshRef.current) {
      if (tattooImage) {
        console.log("🎨 Applying texture: tattooImage is set and mesh is ready.");
        updateTexture(tattooImage);
      } else {
        console.log("🎨 No tattooImage, but mesh is ready. Reverting material to fallback.");
        if (meshRef.current.material) {
          if (meshRef.current.material.map) {
            meshRef.current.material.map.dispose();
          }
          meshRef.current.material.map = null;
          meshRef.current.material.color.set(0xffffff);
          meshRef.current.material.opacity = 0.0;
          meshRef.current.material.needsUpdate = true;
          meshRef.current.visible = false;
        }
      }
    } else {
      if (tattooImage && !isMeshReady) {
        console.log("🎨 Condition: tattooImage loaded, but mesh not ready yet.");
      } else if (!tattooImage && isMeshReady) {
        console.log("🎨 Condition: Mesh ready, but no tattooImage yet.");
      }
    }
  }, [tattooImage, isMeshReady, updateTexture]);

  // initThree: Called externally to set up the scene
  const initThree = useCallback((width, height) => {
    console.log('🎮 Initializing Three.js scene with dimensions:', width, height);
    setIsMeshReady(false);

    if (!webglContextManager.canCreateContext()) { /* ... error handling ... */ }
    if (!threeCanvasRef.current) { threeCanvasRef.current = document.createElement('canvas'); }
    threeCanvasRef.current.width = width; threeCanvasRef.current.height = height;

    sceneRef.current = new THREE.Scene();
    
    cameraRef.current = new THREE.OrthographicCamera(-width / 2, width / 2, height / 2, -height / 2, 0.1, 1000);
    cameraRef.current.position.z = 500;
    rendererRef.current = new THREE.WebGLRenderer({ 
      canvas: threeCanvasRef.current, 
      alpha: true, 
      antialias: true,
      preserveDrawingBuffer: true, // CRITICAL for canvas copying
      premultipliedAlpha: false    // Add this for proper transparency
    });
    rendererRef.current.setSize(width, height);
    rendererRef.current.setClearColor(0x000000, 0);
    webglContextManager.registerContext();

    sceneRef.current.add(new THREE.AmbientLight(0xffffff, 0.8));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
    dirLight.position.set(0, 1, 1);
    sceneRef.current.add(dirLight);

    const geometry = new THREE.PlaneGeometry(1, 1);
    const material = new THREE.MeshStandardMaterial({
      transparent: true,
      side: THREE.DoubleSide,
      color: 0xffffff,
      opacity: 0,
    });
    console.log('🎨 Initial material created transparent. Material ID:', material.uuid);

    meshRef.current = new THREE.Mesh(geometry, material);
    sceneRef.current.add(meshRef.current);

    console.log('✅ Three.js initialized. Mesh ID:', meshRef.current.uuid);
    setIsMeshReady(true);
  }, []);

  const updateMesh = useCallback((transform) => {
    if (!meshRef.current || !transform) return;
    
    if (transform.visible) {
      // Update position
      meshRef.current.position.x = transform.position.x;
      meshRef.current.position.y = transform.position.y;
      meshRef.current.position.z = transform.position.z || 0;
      
      // Update rotation
      meshRef.current.rotation.z = transform.rotation || 0;
      
      // Update scale
      meshRef.current.scale.x = transform.scale.x;
      meshRef.current.scale.y = transform.scale.y;
      meshRef.current.scale.z = transform.scale.z || 1;
      
      // Make visible
      meshRef.current.visible = true;
      
      console.log('📐 Mesh updated:', {
        position: meshRef.current.position,
        rotation: meshRef.current.rotation.z,
        scale: meshRef.current.scale,
        visible: meshRef.current.visible
      });
    } else {
      meshRef.current.visible = false;
    }
  }, []);

 // In useThreeScene hook, update the cleanup function:
const cleanup = useCallback(() => {
  console.log('🧹 Cleaning up Three.js scene...');
  setIsMeshReady(false);
  
  if (rendererRef.current) {
    rendererRef.current.forceContextLoss();
    rendererRef.current.dispose();
    rendererRef.current = null;
  }
  
  if (textureRef.current) {
    textureRef.current.dispose();
    textureRef.current = null;
  }
  
  if (meshRef.current) {
    meshRef.current.geometry.dispose();
    meshRef.current.material.dispose();
    meshRef.current = null;
  }
  
  if (sceneRef.current) {
    sceneRef.current.clear();
    sceneRef.current = null;
  }
  
  cameraRef.current = null;
  threeCanvasRef.current = null;
  
  webglContextManager.unregisterContext();
  console.log('🧹 Three.js scene cleanup complete.');
}, []);

  useEffect(() => {
    return () => { cleanup(); };
  }, [cleanup]);

  // ---- COPY/PASTE THIS BLOCK WHERE YOU RENDER TO THE 2D CANVAS ----
  // (This is a usage example! This block is not inside the hook; put this wherever you do your drawing)
  /*
  // Render Three.js scene
  // Force synchronous WebGL rendering
  renderer.render(scene, camera);

  // Ensure WebGL operations are flushed
  const gl = renderer.getContext();
  if (gl && gl.finish) {
    gl.finish(); // Force GPU to complete rendering
  }

  // Draw Three.js canvas to main canvas
  ctx.save();
  ctx.globalAlpha = settings.opacity;
  ctx.globalCompositeOperation = settings.blendMode;

  if (frameCountRef.current % 60 === 0) {
    console.log('🖼️ Three.js canvas:', {
      width: threeCanvas.width,
      height: threeCanvas.height,
      meshVisible: mesh.visible,
      meshScale: mesh.scale,
      meshPosition: mesh.position,
      rendererSize: renderer.getSize(new THREE.Vector2())
    });
  }

  // Try drawing with error handling
  try {
    ctx.drawImage(threeCanvas, 0, 0, width, height);
  } catch (e) {
    console.error('Failed to draw Three.js canvas:', e);
  }
  ctx.restore();
  */
  // ------------------------------------------------------------------

  return {
    scene: sceneRef.current, camera: cameraRef.current, renderer: rendererRef.current,
    mesh: meshRef.current, threeCanvas: threeCanvasRef.current,
    initThree, updateMesh, cleanup
  };
};
