import { useRef, useCallback, useEffect, useState } from 'react';
import * as THREE from 'three';
import { webglContextManager } from '../utils/webglContextManager';
import { BodyMeshGenerator } from '../utils/bodyMeshGenerator';

export const useThreeScene = (imageUrl) => {
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const meshRef = useRef(null);
  const textureRef = useRef(null);
  const threeCanvasRef = useRef(null);
  const meshGeneratorRef = useRef(null);
  const currentBodyPartRef = useRef(null);

  const [tattooImage, setTattooImage] = useState(null);
  const [isMeshReady, setIsMeshReady] = useState(false);

  // Initialize mesh generator
  useEffect(() => {
    meshGeneratorRef.current = new BodyMeshGenerator();
    return () => {
      if (meshGeneratorRef.current) {
        meshGeneratorRef.current.clearCache();
      }
    };
  }, []);

  // Load tattoo image
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
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        width: img.width,
        height: img.height,
        src: img.src
      });
      setTattooImage(img);
    };
    img.onerror = (err) => {
      console.error("❌ Failed to load tattoo image:", imageUrl, err);
      setTattooImage(null);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Update texture
  // Find the updateTexture function and remove the incorrect lines
const updateTexture = useCallback((loadedImg) => {
  if (!meshRef.current || !meshRef.current.material) {
    console.error('🎨 updateTexture: Mesh or material not ready.');
    return;
  }
  
  if (!loadedImg || !loadedImg.complete || loadedImg.naturalWidth === 0) {
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

  const loader = new THREE.TextureLoader();
  loader.load(
    loadedImg.src,
    (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      
      // Update material with proper settings for curved surfaces
      meshRef.current.material.map = texture;
      meshRef.current.material.color.set(0xffffff);
      meshRef.current.material.opacity = 1.0;
      meshRef.current.material.transparent = true;
      meshRef.current.material.side = THREE.DoubleSide;
      meshRef.current.material.depthWrite = false;
      meshRef.current.material.needsUpdate = true;

      textureRef.current = texture;

      console.log('✅ Texture loaded and applied via TextureLoader');
    },
    undefined,
    (error) => {
      console.error('❌ TextureLoader failed:', error);
    }
  );
}, []);



  // Initialize Three.js scene
  const initThree = useCallback((width, height) => {
    console.log('🎮 Initializing Three.js scene with dimensions:', width, height);
    setIsMeshReady(false);

    if (!webglContextManager.canCreateContext()) {
      console.error('❌ Cannot create more WebGL contexts');
      return;
    }

    if (!threeCanvasRef.current) {
      threeCanvasRef.current = document.createElement('canvas');
    }
    
    threeCanvasRef.current.width = width;
    threeCanvasRef.current.height = height;

    // Scene setup
    sceneRef.current = new THREE.Scene();
    
    // Camera setup
    cameraRef.current = new THREE.OrthographicCamera(
      -width / 2, width / 2, 
      height / 2, -height / 2, 
      0.1, 1000
    );
    cameraRef.current.position.z = 500;

    // Renderer setup
    rendererRef.current = new THREE.WebGLRenderer({ 
      canvas: threeCanvasRef.current, 
      alpha: true, 
      antialias: true,
      preserveDrawingBuffer: true,
      premultipliedAlpha: false
    });
    rendererRef.current.setSize(width, height);
    rendererRef.current.setClearColor(0x000000, 0);
    rendererRef.current.shadowMap.enabled = true;
    rendererRef.current.shadowMap.type = THREE.PCFSoftShadowMap;

    webglContextManager.registerContext();

    // Enhanced lighting for 3D effect
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    sceneRef.current.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.4);
    dirLight1.position.set(1, 1, 1);
    dirLight1.castShadow = true;
    sceneRef.current.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.2);
    dirLight2.position.set(-1, -0.5, 1);
    sceneRef.current.add(dirLight2);

    // Create initial mesh with enhanced material
    const geometry = new THREE.PlaneGeometry(1, 1);
    const material = new THREE.MeshStandardMaterial({
      transparent: true,
      side: THREE.DoubleSide,
      color: 0xffffff,
      opacity: 1.0,
      roughness: 0.7,
      metalness: 0.1,
      normalScale: new THREE.Vector2(1, 1),
      displacementScale: 0,
      envMapIntensity: 0.5
    });

    meshRef.current = new THREE.Mesh(geometry, material);
    meshRef.current.receiveShadow = true;
    meshRef.current.castShadow = true;
    sceneRef.current.add(meshRef.current);

    console.log('✅ Three.js initialized with enhanced lighting');
    setIsMeshReady(true);
  }, []);

  // Update mesh geometry for body part
  const updateMeshForBodyPart = useCallback((bodyPart, landmarks, dimensions) => {
    if (!meshRef.current || !meshGeneratorRef.current) return;
    
    if (currentBodyPartRef.current === bodyPart) {
      return; // Skip if same body part
    }

    console.log('🔄 Updating mesh for body part:', bodyPart);

    const newGeometry = meshGeneratorRef.current.getMeshForBodyPart(
      bodyPart,
      landmarks,
      dimensions
    );

    if (newGeometry) {
      if (meshRef.current.geometry) {
        meshRef.current.geometry.dispose();
      }

      meshRef.current.geometry = newGeometry;
      meshRef.current.geometry.computeBoundingSphere();
      
      currentBodyPartRef.current = bodyPart;
      
      console.log('✅ Mesh updated for body part:', bodyPart);
    }
  }, []);

 // Find the updateMesh function and add the console.log there
const updateMesh = useCallback((transform, bodyPart, landmarks, dimensions) => {
  if (!meshRef.current || !transform) return;
  
  console.log('📐 Updating mesh for body part:', bodyPart, 'with hints:', transform.meshHints);
  
  // Update geometry if body part changed
  if (bodyPart && bodyPart !== 'manual' && landmarks && dimensions) {
    updateMeshForBodyPart(bodyPart, landmarks, dimensions);
  }
  
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
    
    // Apply mesh hints if available
    if (transform.meshHints && meshRef.current.material) {
      // Update material properties based on surface normal
      if (transform.meshHints.surfaceNormal) {
        // Adjust material normal map or shading
        meshRef.current.material.normalScale = new THREE.Vector2(
          transform.meshHints.surfaceNormal.x,
          transform.meshHints.surfaceNormal.y
        );
      }
      
      // Add subtle displacement based on curvature
      if (transform.meshHints.curvature > 0.2) {
        meshRef.current.material.displacementScale = transform.meshHints.curvature * 0.1;
      }
    }
    
    // Make visible
    meshRef.current.visible = true;
  } else {
    meshRef.current.visible = false;
  }
}, [updateMeshForBodyPart]);

  // Cleanup
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
    
    if (meshGeneratorRef.current) {
      meshGeneratorRef.current.clearCache();
    }
    
    cameraRef.current = null;
    threeCanvasRef.current = null;
    currentBodyPartRef.current = null;
    
    webglContextManager.unregisterContext();
    console.log('🧹 Three.js scene cleanup complete.');
  }, []);

  useEffect(() => {
    return () => { cleanup(); };
  }, [cleanup]);

  return {
    scene: sceneRef.current,
    camera: cameraRef.current,
    renderer: rendererRef.current,
    mesh: meshRef.current,
    threeCanvas: threeCanvasRef.current,
    initThree,
    updateMesh,
    cleanup
  };
};
