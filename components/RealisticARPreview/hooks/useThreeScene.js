// components/RealisticARPreview/hooks/useThreeScene.js
import { useRef, useCallback, useEffect, useState } from 'react';
import * as THREE from 'three';

export const useThreeScene = (imageUrl) => {
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const meshRef = useRef(null);
  const textureRef = useRef(null);
  const threeCanvasRef = useRef(null);
  
  const [tattooImage, setTattooImage] = useState(null);

  // Load tattoo image
  useEffect(() => {
    if (!imageUrl) return;
    
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setTattooImage(img);
      if (meshRef.current) {
        updateTexture(img);
      }
    };
    img.onerror = () => console.error("Failed to load tattoo image");
    img.src = imageUrl;
  }, [imageUrl]);

  const updateTexture = useCallback((img) => {
    if (textureRef.current) textureRef.current.dispose();
    
    const texture = new THREE.Texture(img);
    texture.needsUpdate = true;
    
    if (meshRef.current) {
      meshRef.current.material.map = texture;
      meshRef.current.material.needsUpdate = true;
    }
    
    textureRef.current = texture;
  }, []);

  const initThree = useCallback((width, height) => {
    console.log('🎮 Initializing Three.js:', width, height);
    
    // Create off-screen canvas
    if (!threeCanvasRef.current) {
      threeCanvasRef.current = document.createElement('canvas');
    }
    threeCanvasRef.current.width = width;
    threeCanvasRef.current.height = height;

    // Scene
    sceneRef.current = new THREE.Scene();
    
    // Camera
    cameraRef.current = new THREE.OrthographicCamera(
      -width / 2, width / 2,
      height / 2, -height / 2,
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
    rendererRef.current.setSize(width, height);
    rendererRef.current.setClearColor(0x000000, 0);

    // Lighting
    sceneRef.current.add(new THREE.AmbientLight(0xffffff, 0.8));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
    dirLight.position.set(0, 1, 1);
    sceneRef.current.add(dirLight);

    // Mesh
    const geometry = new THREE.PlaneGeometry(1, 1);
    const material = new THREE.MeshStandardMaterial({
      transparent: true,
      side: THREE.DoubleSide,
      alphaTest: 0.1
    });
    
    meshRef.current = new THREE.Mesh(geometry, material);
    sceneRef.current.add(meshRef.current);

    // Apply texture if available
    if (tattooImage) {
      updateTexture(tattooImage);
    }

    console.log('✅ Three.js initialized');
  }, [tattooImage, updateTexture]);

  const updateMesh = useCallback((transform) => {
    if (!meshRef.current) return;
    
    meshRef.current.position.set(transform.position.x, transform.position.y, transform.position.z);
    meshRef.current.rotation.z = transform.rotation;
    meshRef.current.scale.set(transform.scale.x, transform.scale.y, transform.scale.z);
    meshRef.current.visible = true;
  }, []);

  const cleanup = useCallback(() => {
    if (rendererRef.current) {
      rendererRef.current.dispose();
      rendererRef.current = null;
    }
    if (textureRef.current) {
      textureRef.current.dispose();
      textureRef.current = null;
    }
  }, []);

  useEffect(() => cleanup, [cleanup]);

  return {
    scene: sceneRef.current,
    camera: cameraRef.current,
    renderer: rendererRef.current,
    mesh: meshRef.current,
    threeCanvas: threeCanvasRef.current,
    initThree,
    updateMesh
  };
};