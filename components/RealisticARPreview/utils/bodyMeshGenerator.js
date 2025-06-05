// components/RealisticARPreview/utils/bodyMeshGenerator.js
import * as THREE from 'three';

// Add a check for browser environment
if (typeof window === 'undefined') {
  global.THREE = THREE;
}

// Parametric mesh generators for different body parts
export class BodyMeshGenerator {
  constructor() {
    this.meshCache = new Map();
  }

  // Generate curved mesh for arms/legs (cylindrical)
  generateLimbMesh(startPoint, endPoint, radius, curvature = 0.15) {
    const direction = new THREE.Vector3().subVectors(endPoint, startPoint);
    const length = direction.length();
    const midPoint = new THREE.Vector3().addVectors(startPoint, endPoint).multiplyScalar(0.5);
    
    // Create a curved path for the limb
    const curve = new THREE.QuadraticBezierCurve3(
      startPoint,
      new THREE.Vector3(
        midPoint.x + direction.y * curvature,
        midPoint.y - direction.x * curvature,
        midPoint.z + radius * 0.5
      ),
      endPoint
    );
    
    // Create tube geometry along the curve
    const geometry = new THREE.TubeGeometry(curve, 32, radius, 16, false);
    
    // Add UV mapping for texture projection
    this.generateLimbUVs(geometry, length, radius);
    
    return geometry;
  }

  // Generate curved mesh for torso (modified cylinder)
  generateTorsoMesh(topWidth, bottomWidth, height, depth, curvature = 0.2) {
    const geometry = new THREE.BufferGeometry();
    const segments = 32;
    const heightSegments = 16;
    
    const positions = [];
    const normals = [];
    const uvs = [];
    const indices = [];
    
    // Generate vertices with curvature
    for (let y = 0; y <= heightSegments; y++) {
      const v = y / heightSegments;
      const currentY = (v - 0.5) * height;
      const widthFactor = THREE.MathUtils.lerp(topWidth, bottomWidth, v);
      
      for (let x = 0; x <= segments; x++) {
        const u = x / segments;
        const angle = u * Math.PI * 2;
        
        // Add curvature based on position
        const curveOffset = Math.sin(v * Math.PI) * curvature;
        const radiusX = widthFactor * 0.5 * (1 + curveOffset);
        const radiusZ = depth * 0.5 * (1 + curveOffset * 0.5);
        
        const px = Math.cos(angle) * radiusX;
        const py = currentY;
        const pz = Math.sin(angle) * radiusZ;
        
        positions.push(px, py, pz);
        
        // Calculate normals
        const normal = new THREE.Vector3(px, 0, pz).normalize();
        normals.push(normal.x, normal.y, normal.z);
        
        // UV mapping
        uvs.push(u, v);
      }
    }
    
    // Generate indices
    for (let y = 0; y < heightSegments; y++) {
      for (let x = 0; x < segments; x++) {
        const a = (segments + 1) * y + x;
        const b = (segments + 1) * (y + 1) + x;
        const c = (segments + 1) * (y + 1) + (x + 1);
        const d = (segments + 1) * y + (x + 1);
        
        indices.push(a, b, d);
        indices.push(b, c, d);
      }
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    
    return geometry;
  }

  // Generate mesh for flat-ish areas (chest, back) with subtle curvature
  generatePlanarMesh(width, height, curvatureX = 0.1, curvatureY = 0.05) {
    const geometry = new THREE.BufferGeometry();
    const segmentsX = 32;
    const segmentsY = 32;
    
    const positions = [];
    const normals = [];
    const uvs = [];
    const indices = [];
    
    // Generate vertices with subtle curvature
    for (let y = 0; y <= segmentsY; y++) {
      const v = y / segmentsY;
      const py = (v - 0.5) * height;
      
      for (let x = 0; x <= segmentsX; x++) {
        const u = x / segmentsX;
        const px = (u - 0.5) * width;
        
        // Add curvature
        const curveX = Math.sin(u * Math.PI) * curvatureX * width;
        const curveY = Math.sin(v * Math.PI) * curvatureY * height;
        const pz = curveX * curveY;
        
        positions.push(px, py, pz);
        
        // Calculate normals (simplified)
        const normal = new THREE.Vector3(
          -Math.cos(u * Math.PI) * curvatureX,
          -Math.cos(v * Math.PI) * curvatureY,
          1
        ).normalize();
        
        normals.push(normal.x, normal.y, normal.z);
        uvs.push(u, v);
      }
    }
    
    // Generate indices
    for (let y = 0; y < segmentsY; y++) {
      for (let x = 0; x < segmentsX; x++) {
        const a = (segmentsX + 1) * y + x;
        const b = (segmentsX + 1) * (y + 1) + x;
        const c = (segmentsX + 1) * (y + 1) + (x + 1);
        const d = (segmentsX + 1) * y + (x + 1);
        
        indices.push(a, b, d);
        indices.push(b, c, d);
      }
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    
    return geometry;
  }

  // Generate UV coordinates for limb meshes
  generateLimbUVs(geometry, length, radius) {
    const positions = geometry.attributes.position;
    const uvs = [];
    
    for (let i = 0; i < positions.count; i++) {
      const vertex = new THREE.Vector3(
        positions.getX(i),
        positions.getY(i),
        positions.getZ(i)
      );
      
      // Calculate UV based on position along the limb
      const u = Math.atan2(vertex.z, vertex.x) / (2 * Math.PI) + 0.5;
      const v = vertex.y / length + 0.5;
      
      uvs.push(u, v);
    }
    
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  }

  // Get or create mesh for specific body part
  getMeshForBodyPart(bodyPart, landmarks, dimensions) {
    const cacheKey = `${bodyPart}_${dimensions.width}_${dimensions.height}`;
    
    if (this.meshCache.has(cacheKey)) {
      return this.meshCache.get(cacheKey);
    }
    
    let geometry;
    
    switch (bodyPart) {
      case 'left-arm':
      case 'right-arm':
      case 'left-forearm':
      case 'right-forearm':
        geometry = this.generateArmMesh(bodyPart, landmarks, dimensions);
        break;
        
      case 'chest':
      case 'back':
        geometry = this.generateTorsoPartMesh(bodyPart, landmarks, dimensions);
        break;
        
      case 'left-leg':
      case 'right-leg':
      case 'left-calf':
      case 'right-calf':
        geometry = this.generateLegMesh(bodyPart, landmarks, dimensions);
        break;
        
      default:
        // Fallback to planar mesh
        geometry = this.generatePlanarMesh(100, 100, 0.1, 0.05);
    }
    
    this.meshCache.set(cacheKey, geometry);
    return geometry;
  }

  // Specific mesh generators for body parts
  generateArmMesh(part, landmarks, dimensions) {
    const side = part.includes('left') ? 'left' : 'right';
    const isFullArm = part.includes('arm') && !part.includes('forearm');
    
    const shoulder = landmarks[`${side}Shoulder`];
    const elbow = landmarks[`${side}Elbow`];
    const wrist = landmarks[`${side}Wrist`];
    
    if (!shoulder || !elbow) return this.generatePlanarMesh(80, 200);
    
    const { width, height } = dimensions;
    let startPoint, endPoint;
    
    if (isFullArm && wrist) {
      startPoint = new THREE.Vector3(
        shoulder.x * width - width / 2,
        shoulder.y * height - height / 2,
        0
      );
      endPoint = new THREE.Vector3(
        wrist.x * width - width / 2,
        wrist.y * height - height / 2,
        0
      );
    } else if (part.includes('forearm') && wrist) {
      startPoint = new THREE.Vector3(
        elbow.x * width - width / 2,
        elbow.y * height - height / 2,
        0
      );
      endPoint = new THREE.Vector3(
        wrist.x * width - width / 2,
        wrist.y * height - height / 2,
        0
      );
    } else {
      // Upper arm only
      startPoint = new THREE.Vector3(
        shoulder.x * width - width / 2,
        shoulder.y * height - height / 2,
        0
      );
      endPoint = new THREE.Vector3(
        elbow.x * width - width / 2,
        elbow.y * height - height / 2,
        0
      );
    }
    
    const radius = width * 0.06; // Adjust based on body proportions
    return this.generateLimbMesh(startPoint, endPoint, radius);
  }

  generateTorsoPartMesh(part, landmarks, dimensions) {
    const leftShoulder = landmarks.leftShoulder;
    const rightShoulder = landmarks.rightShoulder;
    const leftHip = landmarks.leftHip;
    const rightHip = landmarks.rightHip;
    
    if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) {
      return this.generatePlanarMesh(200, 300, 0.15, 0.1);
    }
    
    const { width, height } = dimensions;
    
    const topWidth = Math.abs(rightShoulder.x - leftShoulder.x) * width;
    const bottomWidth = Math.abs(rightHip.x - leftHip.x) * width;
    const torsoHeight = Math.abs(
      ((leftShoulder.y + rightShoulder.y) / 2 - (leftHip.y + rightHip.y) / 2)
    ) * height;
    
    const depth = topWidth * 0.4; // Estimate depth as 40% of width
    
    return this.generateTorsoMesh(topWidth, bottomWidth, torsoHeight, depth);
  }

  generateLegMesh(part, landmarks, dimensions) {
    const side = part.includes('left') ? 'left' : 'right';
    const hip = landmarks[`${side}Hip`];
    const knee = landmarks[`${side}Knee`];
    const ankle = landmarks[`${side}Ankle`];
    
    if (!hip || !knee) return this.generatePlanarMesh(80, 300);
    
    const { width, height } = dimensions;
    let startPoint, endPoint;
    
    if (part.includes('calf') && ankle) {
      startPoint = new THREE.Vector3(
        knee.x * width - width / 2,
        knee.y * height - height / 2,
        0
      );
      endPoint = new THREE.Vector3(
        ankle.x * width - width / 2,
        ankle.y * height - height / 2,
        0
      );
    } else if (ankle) {
      // Full leg
      startPoint = new THREE.Vector3(
        hip.x * width - width / 2,
        hip.y * height - height / 2,
        0
      );
      endPoint = new THREE.Vector3(
        ankle.x * width - width / 2,
        ankle.y * height - height / 2,
        0
      );
    } else {
      // Upper leg only
      startPoint = new THREE.Vector3(
        hip.x * width - width / 2,
        hip.y * height - height / 2,
        0
      );
      endPoint = new THREE.Vector3(
        knee.x * width - width / 2,
        knee.y * height - height / 2,
        0
      );
    }
    
    const radius = width * 0.08; // Legs are typically larger than arms
    return this.generateLimbMesh(startPoint, endPoint, radius, 0.1);
  }

  // Clear cache when needed
  clearCache() {
    this.meshCache.clear();
  }
}