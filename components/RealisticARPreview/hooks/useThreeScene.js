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
  const [isMeshReady, setIsMeshReady] = useState(false); // New state to track mesh initialization

  // Effect 1: Load the tattoo image when imageUrl changes
  useEffect(() => {
    // Reset states when imageUrl changes or is cleared
    setTattooImage(null);
    // setIsMeshReady(false); // Don't reset mesh ready here, initThree controls it.
                             // Or, if an imageUrl change means a full reset, then yes.
                             // For now, let's assume mesh can persist if imageUrl changes rapidly.

    if (!imageUrl) {
      console.log('ℹ️ No image URL provided, clearing tattoo image.');
      return;
    }
    
    console.log('🖼️ Loading tattoo image:', imageUrl);
    const img = new Image();
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
      setTattooImage(null); // Ensure tattooImage is null on error
    };
    img.src = imageUrl;
    //img.src ="https://upload.wikimedia.org/wikipedia/commons/1/10/Red_Color.jpg"
  }, [imageUrl]);

  // Callback to update the texture on the mesh material
  const updateTexture = useCallback((loadedImg) => {
    if (!meshRef.current || !meshRef.current.material) {
      console.error('🎨 updateTexture: Mesh or material not ready.');
      return;
    }
    if (!loadedImg || !loadedImg.complete || typeof loadedImg.naturalWidth === 'undefined' || loadedImg.naturalWidth === 0) {
      console.error('🎨 updateTexture: Image not ready or invalid for texture creation:', loadedImg);
      // Optionally clear the texture if the image is invalid
      if (meshRef.current.material.map) meshRef.current.material.map.dispose();
      meshRef.current.material.map = null;
      meshRef.current.material.needsUpdate = true;
      return;
    }

    console.log('🎨 Attempting to update texture with image:', loadedImg.src);
    
    if (textureRef.current) {
      textureRef.current.dispose();
    }
    
    const texture = new THREE.Texture(loadedImg);
    texture.colorSpace = THREE.SRGBColorSpace; 
    texture.needsUpdate = true;
    
    meshRef.current.material.map = texture; 
    meshRef.current.material.color.set(0xffffff); 
    meshRef.current.material.opacity = 1.0; 
    meshRef.current.material.needsUpdate = true; 
    console.log('🎨 Material updated. Map set:', !!meshRef.current.material.map, 'Color:', meshRef.current.material.color.getHexString());
    
    textureRef.current = texture;
  }, []); // updateTexture is stable

  // Effect 2: Apply or clear texture based on tattooImage and isMeshReady states
  useEffect(() => {
    console.log(`🎨 Effect [tattooImage, isMeshReady] triggered. tattooImage: ${!!tattooImage}, isMeshReady: ${isMeshReady}, meshRef: ${!!meshRef.current}`);
    if (isMeshReady && meshRef.current) { // Ensure meshRef.current is also checked
      if (tattooImage) {
        console.log("🎨 Applying texture: tattooImage is set and mesh is ready.");
        updateTexture(tattooImage);
      } else {
        // No tattooImage, but mesh is ready. Revert to fallback or clear texture.
        console.log("🎨 No tattooImage, but mesh is ready. Reverting material to fallback.");
        if (meshRef.current.material) {
          if (meshRef.current.material.map) {
            meshRef.current.material.map.dispose();
          }
          meshRef.current.material.map = null;
          meshRef.current.material.color.set(0xff00ff); // Magenta
          meshRef.current.material.opacity = 0.5;
          meshRef.current.material.needsUpdate = true;
        }
      }
    } else {
        // Conditions not met for texture update yet.
        if (tattooImage && !isMeshReady) {
            console.log("🎨 Condition: tattooImage loaded, but mesh not ready yet.");
        } else if (!tattooImage && isMeshReady) {
             console.log("🎨 Condition: Mesh ready, but no tattooImage yet.");
        }
    }
  }, [tattooImage, isMeshReady, updateTexture]); // Depend on these states

  // initThree: Called externally to set up the scene
  const initThree = useCallback((width, height) => {
    console.log('🎮 Initializing Three.js scene with dimensions:', width, height);
    setIsMeshReady(false); // Reset mesh readiness on re-initialization

    if (!webglContextManager.canCreateContext()) { /* ... error handling ... */ }
    if (!threeCanvasRef.current) { threeCanvasRef.current = document.createElement('canvas'); }
    threeCanvasRef.current.width = width; threeCanvasRef.current.height = height;

    sceneRef.current = new THREE.Scene();
    cameraRef.current = new THREE.OrthographicCamera(-width / 2, width / 2, height / 2, -height / 2, 0.1, 1000);
    cameraRef.current.position.z = 500;
    rendererRef.current = new THREE.WebGLRenderer({ /* ... */ });
    rendererRef.current.setSize(width, height);
    rendererRef.current.setClearColor(0x000000, 0);
    webglContextManager.registerContext();

    sceneRef.current.add(new THREE.AmbientLight(0xffffff, 0.8));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
    dirLight.position.set(0, 1, 1);
    sceneRef.current.add(dirLight);

    const geometry = new THREE.PlaneGeometry(1, 1);
    const material = new THREE.MeshStandardMaterial({
      transparent: true, side: THREE.DoubleSide, 
      //alphaTest: 0.05,
      color: 0xff00ff, opacity: 0.5,
    });
    console.log('🎨 Initial material created with magenta. Material ID:', material.uuid);
    
    meshRef.current = new THREE.Mesh(geometry, material);
    sceneRef.current.add(meshRef.current);
    
    console.log('✅ Three.js initialized. Mesh ID:', meshRef.current.uuid);
    setIsMeshReady(true); // Signal that mesh initialization is complete
  }, []); // initThree is stable and doesn't depend on tattooImage directly for its setup

  // updateMesh and cleanup callbacks remain the same
  const updateMesh = useCallback((transform) => { /* ... */ }, []);
  const cleanup = useCallback(() => {
    console.log('🧹 Cleaning up Three.js scene...');
    setIsMeshReady(false); // Reset mesh readiness on cleanup
    // ... rest of cleanup logic ...
    if (rendererRef.current) { /* ... */ }
    if (textureRef.current) { /* ... */ }
    if (meshRef.current) { /* ... */ }
    if (sceneRef.current) { /* ... */ }
    cameraRef.current = null;
    threeCanvasRef.current = null;
    console.log('🧹 Three.js scene cleanup complete.');
  }, []);

  useEffect(() => {
    return () => { cleanup(); };
  }, [cleanup]);

  return {
    scene: sceneRef.current, camera: cameraRef.current, renderer: rendererRef.current,
    mesh: meshRef.current, threeCanvas: threeCanvasRef.current,
    initThree, updateMesh, cleanup
  };
};