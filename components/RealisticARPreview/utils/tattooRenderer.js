import * as THREE from 'three';
import bodyMeshGenerator from './bodyMeshGenerator';

class EnhancedTattooRenderer {
  constructor(videoElement) {
    this.video = videoElement;
    this.scene = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true,
      preserveDrawingBuffer: true 
    });
    
    // Enhanced lighting for better curve visualization
    this.setupEnhancedLighting();
    
    // Body mesh generator
    this.bodyMeshGenerator = new bodyMeshGenerator();
    
    // Shader materials for curved surface rendering
    this.shaderMaterials = new Map();
    
    // Initialize camera
    this.camera = new THREE.OrthographicCamera();
    this.updateCameraAspect();
  }

  setupEnhancedLighting() {
    // Key light
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.8);
    keyLight.position.set(1, 1, 1);
    this.scene.add(keyLight);
    
    // Fill light
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
    fillLight.position.set(-1, 0, 0.5);
    this.scene.add(fillLight);
    
    // Rim light for edge definition
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.3);
    rimLight.position.set(0, -1, -1);
    this.scene.add(rimLight);
    
    // Ambient for overall brightness
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    this.scene.add(ambientLight);
  }

  createCurvedTattooShader(texture) {
    const vertexShader = `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      
      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = -mvPosition.xyz;
        
        gl_Position = projectionMatrix * mvPosition;
      }
    `;

    const fragmentShader = `
      uniform sampler2D tattooTexture;
      uniform float opacity;
      uniform vec3 skinTone;
      uniform float curvatureIntensity;
      
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      
      void main() {
        vec4 tattooColor = texture2D(tattooTexture, vUv);
        
        // Calculate curvature-based shading
        vec3 viewDir = normalize(vViewPosition);
        float NdotV = max(dot(vNormal, viewDir), 0.0);
        
        // Fresnel effect for edge darkening
        float fresnel = pow(1.0 - NdotV, 2.0) * curvatureIntensity;
        
        // Apply subtle darkening at curves
        vec3 finalColor = mix(tattooColor.rgb, tattooColor.rgb * 0.7, fresnel);
        
        // Blend with skin tone for realism
        finalColor = mix(skinTone, finalColor, tattooColor.a);
        
        gl_FragColor = vec4(finalColor, tattooColor.a * opacity);
      }
    `;

    return new THREE.ShaderMaterial({
      uniforms: {
        tattooTexture: { value: texture },
        opacity: { value: 0.9 },
        skinTone: { value: new THREE.Color(0xffdbac) },
        curvatureIntensity: { value: 0.3 }
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false
    });
  }

  applyTattooToMesh(mesh, tattooTexture, placement) {
    if (!mesh || !tattooTexture) return;

    // Create curved shader material
    const shaderMaterial = this.createCurvedTattooShader(tattooTexture);
    
    // Apply UV transformation based on placement
    const uvTransform = this.calculateUVTransform(mesh, placement);
    this.applyUVTransform(mesh.geometry, uvTransform);
    
    // Replace material
    mesh.material = shaderMaterial;
    mesh.material.needsUpdate = true;
    
    // Store for updates
    this.shaderMaterials.set(mesh.uuid, shaderMaterial);
  }

  calculateUVTransform(mesh, placement) {
    const { position, scale, rotation } = placement;
    
    // Calculate UV bounds based on mesh type
    const bounds = this.getMeshUVBounds(mesh);
    
    return {
      offset: new THREE.Vector2(position.x, position.y),
      scale: new THREE.Vector2(scale.x, scale.y),
      rotation: rotation || 0,
      bounds
    };
  }

  getMeshUVBounds(mesh) {
    const uvAttribute = mesh.geometry.attributes.uv;
    if (!uvAttribute) return { min: new THREE.Vector2(0, 0), max: new THREE.Vector2(1, 1) };
    
    const min = new THREE.Vector2(Infinity, Infinity);
    const max = new THREE.Vector2(-Infinity, -Infinity);
    
    for (let i = 0; i < uvAttribute.count; i++) {
      const u = uvAttribute.getX(i);
      const v = uvAttribute.getY(i);
      min.x = Math.min(min.x, u);
      min.y = Math.min(min.y, v);
      max.x = Math.max(max.x, u);
      max.y = Math.max(max.y, v);
    }
    
    return { min, max };
  }

  applyUVTransform(geometry, transform) {
    const uvAttribute = geometry.attributes.uv;
    if (!uvAttribute) return;
    
    const { offset, scale, rotation, bounds } = transform;
    const center = new THREE.Vector2(0.5, 0.5);
    
    for (let i = 0; i < uvAttribute.count; i++) {
      let u = uvAttribute.getX(i);
      let v = uvAttribute.getY(i);
      
      // Normalize to 0-1 range
      u = (u - bounds.min.x) / (bounds.max.x - bounds.min.x);
      v = (v - bounds.min.y) / (bounds.max.y - bounds.min.y);
      
      // Apply transformations
      // 1. Scale
      u = (u - center.x) * scale.x + center.x;
      v = (v - center.y) * scale.y + center.y;
      
      // 2. Rotation
      if (rotation !== 0) {
        const cos = Math.cos(rotation);
        const sin = Math.sin(rotation);
        const tu = u - center.x;
        const tv = v - center.y;
        u = tu * cos - tv * sin + center.x;
        v = tu * sin + tv * cos + center.y;
      }
      
      // 3. Offset
      u += offset.x;
      v += offset.y;
      
      uvAttribute.setXY(i, u, v);
    }
    
    uvAttribute.needsUpdate = true;
  }

  updateBodyMesh(landmarks, worldLandmarks) {
    // Clear previous meshes
    this.clearBodyMeshes();
    
    // Update subdivision level based on pose
    this.bodyMeshGenerator.updateSubdivisionLevel(landmarks);
    
    // Generate new body mesh with curves
    const bodyMesh = this.bodyMeshGenerator.generateBodyMesh(landmarks, worldLandmarks);
    
    if (bodyMesh) {
      this.scene.add(bodyMesh);
      this.currentBodyMesh = bodyMesh;
      
      // Apply tattoos to each limb mesh
      if (this.currentTattoo) {
        bodyMesh.children.forEach(limbMesh => {
          this.applyTattooToMesh(
            limbMesh, 
            this.currentTattoo.texture,
            this.currentTattoo.placement
          );
        });
      }
    }
  }

  clearBodyMeshes() {
    if (this.currentBodyMesh) {
      this.scene.remove(this.currentBodyMesh);
      this.currentBodyMesh.traverse(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      });
    }
  }

  updateShaderUniforms(time) {
    // Animate shader parameters for dynamic effects
    this.shaderMaterials.forEach(material => {
      if (material.uniforms.curvatureIntensity) {
        // Subtle pulsing effect on curves
        material.uniforms.curvatureIntensity.value = 
          0.3 + Math.sin(time * 0.001) * 0.05;
      }
    });
  }

  render(landmarks, worldLandmarks) {
    if (!landmarks || !worldLandmarks) return;
    
    // Update body mesh with enhanced curves
    this.updateBodyMesh(landmarks, worldLandmarks);
    
    // Update shader uniforms
    this.updateShaderUniforms(performance.now());
    
    // Render scene
    this.renderer.render(this.scene, this.camera);
  }
  
  updateCameraAspect() {
    const aspect = this.video.videoWidth / this.video.videoHeight;
    const frustumSize = 1;
    
    this.camera.left = -frustumSize * aspect / 2;
    this.camera.right = frustumSize * aspect / 2;
    this.camera.top = frustumSize / 2;
    this.camera.bottom = -frustumSize / 2;
    this.camera.near = -1;
    this.camera.far = 1;
    this.camera.updateProjectionMatrix();
  }
}

export default tattooRenderer;