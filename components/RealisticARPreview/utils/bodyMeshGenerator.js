// components/RealisticARPreview/utils/bodyMeshGenerator.js
import * as THREE from 'three';

// Add a check for browser environment
if (typeof window === 'undefined') {
  global.THREE = THREE;
}

export class BodyMeshGenerator {
  constructor() {
    this.meshCache = new Map();
    this.subdivisionLevel = 32; // Increased for smoother curves
  }

  // Enhanced limb mesh with dynamic curvature based on pose
  generateLimbMesh(startPoint, endPoint, radius, curvature = 0.15, landmarks = null, limbType = null) {
    const direction = new THREE.Vector3().subVectors(endPoint, startPoint);
    const length = direction.length();
    const midPoint = new THREE.Vector3().addVectors(startPoint, endPoint).multiplyScalar(0.5);
    
    // Calculate dynamic curvature based on actual limb bend
    let dynamicCurvature = curvature;
    let twistAngle = 0;
    
    if (landmarks && limbType) {
      const bendData = this.calculateLimbBend(landmarks, limbType);
      dynamicCurvature = bendData.curvature;
      twistAngle = bendData.twist;
    }
    
    // Create multiple control points for smoother curves
    const controlPoints = this.generateLimbControlPoints(
      startPoint, 
      endPoint, 
      midPoint, 
      direction, 
      radius, 
      dynamicCurvature,
      twistAngle
    );
    
    // Create a CatmullRom curve for natural limb shape
    const curve = new THREE.CatmullRomCurve3(controlPoints, false, 'catmullrom', 0.5);
    
    // Variable radius along the limb (thicker at joints)
    const radiusFunction = (t) => {
      // Natural tapering - thicker near shoulder/hip, thinner at wrist/ankle
      const taperStart = limbType?.includes('upper') ? 1.2 : 1.0;
      const taperEnd = limbType?.includes('lower') ? 0.8 : 0.9;
      return radius * THREE.MathUtils.lerp(taperStart, taperEnd, t);
    };
    
    // Generate tube with variable radius
    const geometry = this.createVariableRadiusTube(curve, radiusFunction);
    
    // Enhanced UV mapping for better texture application
    this.generateAdaptiveLimbUVs(geometry, curve, length, radius);
    
    return geometry;
  }

  // Calculate actual limb bend from pose landmarks
  calculateLimbBend(landmarks, limbType) {
    let curvature = 0.15; // Default
    let twist = 0;
    
    if (limbType.includes('arm')) {
      const side = limbType.includes('left') ? 'left' : 'right';
      const shoulder = landmarks[`${side}Shoulder`];
      const elbow = landmarks[`${side}Elbow`];
      const wrist = landmarks[`${side}Wrist`];
      
      if (shoulder && elbow && wrist) {
        // Calculate bend angle at elbow
        const upperArm = new THREE.Vector3(
          elbow.x - shoulder.x,
          elbow.y - shoulder.y,
          (elbow.z || 0) - (shoulder.z || 0)
        );
        const forearm = new THREE.Vector3(
          wrist.x - elbow.x,
          wrist.y - elbow.y,
          (wrist.z || 0) - (elbow.z || 0)
        );
        
        const bendAngle = upperArm.angleTo(forearm);
        // Map angle to curvature (0-π radians to 0-0.5 curvature)
        curvature = (bendAngle / Math.PI) * 0.5;
        
        // Calculate twist based on wrist rotation
        const wristPinky = landmarks[`${side}Pinky`];
        const wristIndex = landmarks[`${side}Index`];
        if (wristPinky && wristIndex) {
          const handDirection = new THREE.Vector3(
            wristIndex.x - wristPinky.x,
            wristIndex.y - wristPinky.y,
            0
          );
          twist = Math.atan2(handDirection.y, handDirection.x);
        }
      }
    }
    // Similar calculations for legs...
    
    return { curvature, twist };
  }

  // Generate control points for smooth limb curves
  generateLimbControlPoints(start, end, mid, direction, radius, curvature, twist) {
    const points = [];
    const segments = 5; // More control points for smoother curves
    
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      
      // Base position along the limb
      const basePos = new THREE.Vector3().lerpVectors(start, end, t);
      
      // Add curvature perpendicular to direction
      const perpVector = new THREE.Vector3(-direction.y, direction.x, 0).normalize();
      
      // Sine-based curve for natural bend
      const curveOffset = Math.sin(t * Math.PI) * curvature * direction.length();
      
      // Add twist along the length
      const twistOffset = new THREE.Vector3(
        Math.cos(twist * t) * radius * 0.1,
        Math.sin(twist * t) * radius * 0.1,
        0
      );
      
      const point = basePos.clone()
        .add(perpVector.multiplyScalar(curveOffset))
        .add(twistOffset);
      
      points.push(point);
    }
    
    return points;
  }

  // Create tube geometry with variable radius
  createVariableRadiusTube(curve, radiusFunction) {
    const tubularSegments = 64;
    const radialSegments = 16;
    const points = curve.getPoints(tubularSegments);
    
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const normals = [];
    const uvs = [];
    const indices = [];
    
    // Generate vertices
    for (let i = 0; i <= tubularSegments; i++) {
      const t = i / tubularSegments;
      const point = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t);
      const normal = new THREE.Vector3(0, 1, 0);
      const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();
      normal.crossVectors(binormal, tangent).normalize();
      
      const radius = radiusFunction(t);
      
      for (let j = 0; j <= radialSegments; j++) {
        const v = j / radialSegments;
        const angle = v * Math.PI * 2;
        
        // Calculate vertex position
        const sin = Math.sin(angle);
        const cos = Math.cos(angle);
        
        const vertex = new THREE.Vector3(
          point.x + (cos * binormal.x + sin * normal.x) * radius,
          point.y + (cos * binormal.y + sin * normal.y) * radius,
          point.z + (cos * binormal.z + sin * normal.z) * radius
        );
        
        vertices.push(vertex.x, vertex.y, vertex.z);
        
        // Calculate normal
        const vertexNormal = new THREE.Vector3(
          cos * binormal.x + sin * normal.x,
          cos * binormal.y + sin * normal.y,
          cos * binormal.z + sin * normal.z
        ).normalize();
        
        normals.push(vertexNormal.x, vertexNormal.y, vertexNormal.z);
        
        // UV coordinates
        uvs.push(t, v);
      }
    }
    
    // Generate indices
    for (let i = 0; i < tubularSegments; i++) {
      for (let j = 0; j < radialSegments; j++) {
        const a = (radialSegments + 1) * i + j;
        const b = (radialSegments + 1) * (i + 1) + j;
        const c = (radialSegments + 1) * (i + 1) + (j + 1);
        const d = (radialSegments + 1) * i + (j + 1);
        
        indices.push(a, b, d);
        indices.push(b, c, d);
      }
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    
    return geometry;
  }

  // Adaptive UV mapping for better texture stretching
  generateAdaptiveLimbUVs(geometry, curve, length, radius) {
    const positions = geometry.attributes.position;
    const uvs = geometry.attributes.uv;
    const count = positions.count;
    
    // Calculate stretch factors based on curvature
    const stretchMap = this.calculateStretchMap(curve, length);
    
    for (let i = 0; i < count; i++) {
      const u = uvs.getX(i);
      const v = uvs.getY(i);
      
      // Apply stretch compensation
      const stretchFactor = stretchMap.get(Math.floor(u * stretchMap.size));
      const adjustedU = this.compensateUVStretch(u, stretchFactor);
      
      uvs.setX(i, adjustedU);
      // V (around circumference) remains unchanged
    }
    
    uvs.needsUpdate = true;
  }

  // Calculate stretch factors along the curve
  calculateStretchMap(curve, totalLength) {
    const samples = 32;
    const stretchMap = new Map();
    let accumulatedLength = 0;
    
    for (let i = 0; i < samples; i++) {
      const t1 = i / samples;
      const t2 = (i + 1) / samples;
      
      const p1 = curve.getPointAt(t1);
      const p2 = curve.getPointAt(t2);
      
      const segmentLength = p1.distanceTo(p2);
      const expectedLength = totalLength / samples;
      
      const stretchFactor = segmentLength / expectedLength;
      stretchMap.set(i, stretchFactor);
      
      accumulatedLength += segmentLength;
    }
    
    return stretchMap;
  }

  // Compensate UV coordinates for stretching
  compensateUVStretch(u, stretchFactor) {
    // Inverse stretch compensation
    return u / Math.max(0.5, Math.min(2.0, stretchFactor));
  }

  // Enhanced torso mesh with anatomical accuracy
  generateTorsoMesh(topWidth, bottomWidth, height, depth, curvature = 0.2, landmarks = null) {
    const geometry = new THREE.BufferGeometry();
    const segments = 32;
    const heightSegments = 24;
    
    const positions = [];
    const normals = [];
    const uvs = [];
    const indices = [];
    
    // Calculate spine curve from landmarks if available
    let spineCurve = null;
    if (landmarks && landmarks.leftShoulder && landmarks.rightShoulder && 
        landmarks.leftHip && landmarks.rightHip) {
      spineCurve = this.calculateSpineCurve(landmarks);
    }
    
    // Generate vertices with anatomical curves
    for (let y = 0; y <= heightSegments; y++) {
      const v = y / heightSegments;
      const currentY = (v - 0.5) * height;
      
      // Variable width based on anatomy
      const anatomicalWidth = this.getAnatomicalWidth(v, topWidth, bottomWidth);
      
      for (let x = 0; x <= segments; x++) {
        const u = x / segments;
        const angle = u * Math.PI * 2;
        
        // Apply spine curve if available
        let spineOffset = { x: 0, z: 0 };
        if (spineCurve) {
          spineOffset = this.getSpineOffset(v, spineCurve);
        }
        
        // Anatomical shape variations
        const shapeModifier = this.getTorsoShapeModifier(u, v);
        
        const radiusX = anatomicalWidth.x * 0.5 * shapeModifier.x;
        const radiusZ = anatomicalWidth.z * 0.5 * shapeModifier.z;
        
        const px = Math.cos(angle) * radiusX + spineOffset.x;
        const py = currentY;
        const pz = Math.sin(angle) * radiusZ + spineOffset.z;
        
        positions.push(px, py, pz);
        
        // Calculate smooth normals
        const normal = this.calculateSmoothNormal(angle, v, shapeModifier);
        normals.push(normal.x, normal.y, normal.z);
        
        uvs.push(u, v);
      }
    }
    
    // Generate indices with proper winding
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
    
    // Optimize for rendering
    geometry.computeBoundingSphere();
    geometry.computeBoundingBox();
    
    return geometry;
  }

  // Calculate spine curve from pose landmarks
  calculateSpineCurve(landmarks) {
    const shoulderMid = new THREE.Vector3(
      (landmarks.leftShoulder.x + landmarks.rightShoulder.x) / 2,
      (landmarks.leftShoulder.y + landmarks.rightShoulder.y) / 2,
      ((landmarks.leftShoulder.z || 0) + (landmarks.rightShoulder.z || 0)) / 2
    );
    
    const hipMid = new THREE.Vector3(
      (landmarks.leftHip.x + landmarks.rightHip.x) / 2,
      (landmarks.leftHip.y + landmarks.rightHip.y) / 2,
      ((landmarks.leftHip.z || 0) + (landmarks.rightHip.z || 0)) / 2
    );
    
    // Natural spine curve
    const controlPoint = shoulderMid.clone().lerp(hipMid, 0.5);
    controlPoint.z += 0.05; // Slight forward curve
    
    return new THREE.QuadraticBezierCurve3(shoulderMid, controlPoint, hipMid);
  }

  // Get anatomical width variations
  getAnatomicalWidth(v, topWidth, bottomWidth) {
    // Chest expands, waist narrows, hips expand
    const chestExpansion = Math.sin(v * Math.PI * 2) * 0.1 + 1;
    const waistNarrowing = v > 0.4 && v < 0.6 ? 0.9 : 1;
    
    const baseWidth = THREE.MathUtils.lerp(topWidth, bottomWidth, v);
    
    return {
      x: baseWidth * chestExpansion * waistNarrowing,
      z: baseWidth * 0.4 * chestExpansion // Depth is ~40% of width
    };
  }

  // Get spine offset at given height
  getSpineOffset(v, spineCurve) {
    const point = spineCurve.getPointAt(v);
    const start = spineCurve.getPointAt(0);
    
    return {
      x: point.x - start.x,
      z: point.z - start.z
    };
  }

  // Shape modifiers for anatomical accuracy
  getTorsoShapeModifier(u, v) {
    // Pectoral/breast area
    const pectoralBulge = (v < 0.3 && (u < 0.3 || u > 0.7)) ? 1.1 : 1;
    
    // Latissimus dorsi (back muscles)
    const latsBulge = (v < 0.4 && v > 0.2 && u > 0.4 && u < 0.6) ? 1.05 : 1;
    
    // Abdominal definition
    const absDefinition = (v > 0.4 && v < 0.7 && Math.abs(u - 0.5) < 0.2) ? 0.98 : 1;
    
    return {
      x: pectoralBulge * latsBulge * absDefinition,
      z: pectoralBulge * 0.9 // Less depth variation
    };
  }

  // Calculate smooth normals for better shading
  calculateSmoothNormal(angle, v, shapeModifier) {
    const baseNormal = new THREE.Vector3(
      Math.cos(angle),
      0,
      Math.sin(angle)
    );
    
    // Add vertical component based on position
    const verticalComponent = (v - 0.5) * 0.2;
    baseNormal.y = verticalComponent;
    
    // Apply shape-based normal adjustments
    baseNormal.x *= shapeModifier.x;
    baseNormal.z *= shapeModifier.z;
    
    return baseNormal.normalize();
  }

  // Get or create mesh with caching
  getMeshForBodyPart(bodyPart, landmarks, dimensions) {
    // Include landmark data in cache key for dynamic meshes
    const landmarkKey = this.generateLandmarkKey(landmarks, bodyPart);
    const cacheKey = `${bodyPart}_${dimensions.width}_${dimensions.height}_${landmarkKey}`;
    
    // Only cache if landmarks haven't changed significantly
    if (this.meshCache.has(cacheKey) && !this.hasSignificantMovement(landmarks, bodyPart)) {
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
        
      case 'left-hand':
      case 'right-hand':
        geometry = this.generateHandMesh(bodyPart, landmarks, dimensions);
        break;
        
      case 'neck':
        geometry = this.generateNeckMesh(landmarks, dimensions);
        break;
        
      case 'face':
        geometry = this.generateFaceMesh(landmarks, dimensions);
        break;
        
      default:
        geometry = this.generatePlanarMesh(100, 100, 0.1, 0.05);
    }
    
    // Cache management - keep only recent meshes
    if (this.meshCache.size > 10) {
      const firstKey = this.meshCache.keys().next().value;
      const firstMesh = this.meshCache.get(firstKey);
      if (firstMesh) firstMesh.dispose();
      this.meshCache.delete(firstKey);
    }
    
    this.meshCache.set(cacheKey, geometry);
    return geometry;
  }

  // Generate unique key from landmarks for caching
  generateLandmarkKey(landmarks, bodyPart) {
    if (!landmarks) return 'default';
    
    // Use relevant landmarks for the body part
    const relevantLandmarks = this.getRelevantLandmarks(bodyPart, landmarks);
    let key = '';
    
    for (const landmark of relevantLandmarks) {
      if (landmark) {
        // Round to reduce noise
        key += `${Math.round(landmark.x * 100)}_${Math.round(landmark.y * 100)}_`;
      }
    }
    
    return key;
  }

  // Get landmarks relevant to specific body part
  getRelevantLandmarks(bodyPart, landmarks) {
    const side = bodyPart.includes('left') ? 'left' : 'right';
    
    switch (bodyPart) {
      case 'left-arm':
      case 'right-arm':
        return [
          landmarks[`${side}Shoulder`],
          landmarks[`${side}Elbow`],
          landmarks[`${side}Wrist`]
        ];
      case 'chest':
      case 'back':
        return [
          landmarks.leftShoulder,
          landmarks.rightShoulder,
          landmarks.leftHip,
          landmarks.rightHip
        ];
      // ... other body parts
      default:
        return [];
    }
  }

  // Check if movement is significant enough to regenerate mesh
  hasSignificantMovement(landmarks, bodyPart) {
    // Implement movement threshold checking
    // This prevents constant regeneration for small movements
    return false; // Simplified for now
  }

  // Generate hand mesh with finger details
  generateHandMesh(part, landmarks, dimensions) {
    const side = part.includes('left') ? 'left' : 'right';
    const wrist = landmarks[`${side}Wrist`];
    const thumb = landmarks[`${side}Thumb`];
    const index = landmarks[`${side}Index`];
    const pinky = landmarks[`${side}Pinky`];
    
    if (!wrist) return this.generatePlanarMesh(50, 60, 0.05, 0.02);
    
    // Create a more complex hand mesh if we have finger data
    if (thumb && index && pinky) {
      return this.generateDetailedHandMesh(wrist, thumb, index, pinky, dimensions);
    }
    
    // Simple hand mesh
    return this.generatePlanarMesh(50, 60, 0.05, 0.02);
  }

  // Generate detailed hand mesh with fingers
  generateDetailedHandMesh(wrist, thumb, index, pinky, dimensions) {
    // This would create a mesh that follows the hand's actual shape
    // For now, returning a simple curved plane
    const { width } = dimensions;
    const handWidth = Math.abs(index.x - pinky.x) * width;
    const handLength = Math.abs(wrist.y - index.y) * dimensions.height;
    
    return this.generatePlanarMesh(handWidth, handLength, 0.03, 0.01);
  }

  // Generate neck mesh
  generateNeckMesh(landmarks, dimensions) {
    const nose = landmarks.nose;
    const leftShoulder = landmarks.leftShoulder;
    const rightShoulder = landmarks.rightShoulder;
    
    if (!nose || (!leftShoulder && !rightShoulder)) {
      return this.generatePlanarMesh(80, 100, 0.15, 0.1);
    }
    
    // Create cylindrical neck mesh
    const { width, height } = dimensions;
    const neckTop = new THREE.Vector3(
      nose.x * width - width / 2,
      nose.y * height - height / 2 + 50, // Offset below nose
      0
    );
    
    const shoulderCenter = leftShoulder && rightShoulder
      ? new THREE.Vector3(
          ((leftShoulder.x + rightShoulder.x) / 2) * width - width / 2,
          ((leftShoulder.y + rightShoulder.y) / 2) * height - height / 2,
          0
        )
      : new THREE.Vector3(
          (leftShoulder || rightShoulder).x * width - width / 2,
          (leftShoulder || rightShoulder).y * height - height / 2,
          0
        );
    
    const neckRadius = width * 0.06;
    return this.generateLimbMesh(shoulderCenter, neckTop, neckRadius, 0.1);
  }

  // Generate face mesh
  generateFaceMesh(landmarks, dimensions) {
    const nose = landmarks.nose;
    const leftEye = landmarks.leftEye;
    const rightEye = landmarks.rightEye;
    const leftEar = landmarks.leftEar;
    const rightEar = landmarks.rightEar;
    
    if (!nose) return this.generatePlanarMesh(100, 120, 0.1, 0.08);
    
    // Determine face orientation
    const faceWidth = leftEye && rightEye 
      ? Math.abs(rightEye.x - leftEye.x) * dimensions.width * 3
      : 100;
    
    // Create curved face mesh
    let curvatureX = 0.15;
    let curvatureY = 0.1;
    
    // Adjust curvature for profile views
    if (leftEar && !rightEar) {
      curvatureX = 0.25; // More curve for left profile
    } else if (!leftEar && rightEar) {
      curvatureX = 0.25; // More curve for right profile
    }
    
    return this.generatePlanarMesh(faceWidth, faceWidth * 1.2, curvatureX, curvatureY);
  }

  // Specific mesh generators for body parts (keeping existing but enhanced)
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
        shoulder.z || 0
      );
      endPoint = new THREE.Vector3(
        wrist.x * width - width / 2,
        wrist.y * height - height / 2,
        wrist.z || 0
      );
    } else if (part.includes('forearm') && wrist) {
      startPoint = new THREE.Vector3(
        elbow.x * width - width / 2,
        elbow.y * height - height / 2,
        elbow.z || 0
      );
      endPoint = new THREE.Vector3(
        wrist.x * width - width / 2,
        wrist.y * height - height / 2,
        wrist.z || 0
      );
    } else {
      startPoint = new THREE.Vector3(
        shoulder.x * width - width / 2,
        shoulder.y * height - height / 2,
        shoulder.z || 0
      );
      endPoint = new THREE.Vector3(
        elbow.x * width - width / 2,
        elbow.y * height - height / 2,
        elbow.z || 0
      );
    }
    
    const radius = width * 0.06;
    return this.generateLimbMesh(startPoint, endPoint, radius, 0.15, landmarks, part);
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
    
    const depth = topWidth * 0.4;
    
    return this.generateTorsoMesh(topWidth, bottomWidth, torsoHeight, depth, 0.2, landmarks);
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
        knee.z || 0
      );
      endPoint = new THREE.Vector3(
        ankle.x * width - width / 2,
        ankle.y * height - height / 2,
        ankle.z || 0
      );
    } else if (ankle) {
      startPoint = new THREE.Vector3(
        hip.x * width - width / 2,
        hip.y * height - height / 2,
        hip.z || 0
      );
      endPoint = new THREE.Vector3(
        ankle.x * width - width / 2,ankle.y * height - height / 2,
        ankle.z || 0
      );
    } else {
      startPoint = new THREE.Vector3(
        hip.x * width - width / 2,
        hip.y * height - height / 2,
        hip.z || 0
      );
      endPoint = new THREE.Vector3(
        knee.x * width - width / 2,
        knee.y * height - height / 2,
        knee.z || 0
      );
    }
    
    const radius = width * 0.08;
    return this.generateLimbMesh(startPoint, endPoint, radius, 0.1, landmarks, part);
  }
 
  // Clear cache when needed
  clearCache() {
    this.meshCache.forEach((geometry, key) => {
      if (geometry && geometry.dispose) {
        geometry.dispose();
      }
    });
    this.meshCache.clear();
  }
 }