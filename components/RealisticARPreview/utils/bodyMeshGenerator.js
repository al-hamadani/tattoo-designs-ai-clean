// components/RealisticARPreview/utils/bodyMeshGenerator.js
import * as THREE from 'three';

// Add a check for browser environment
if (typeof window === 'undefined') {
  global.THREE = THREE;
}
import * as THREE from 'three';

class bodyMeshGenerator {
  constructor() {
    this.meshCache = new Map();
    this.subdivisionLevel = 2; // Dynamic subdivision level
    this.curvatureThreshold = 0.3; // Minimum angle for curve generation
    this.limbMeshes = new Map();
  }

  generateBodyMesh(landmarks, worldLandmarks) {
    if (!landmarks || !worldLandmarks) return null;

    const meshGroup = new THREE.Group();
    
    // Generate curved limb meshes with enhanced detail
    const limbs = this.defineLimbSegments();
    
    limbs.forEach(limb => {
      const curvedMesh = this.generateCurvedLimbMesh(
        limb,
        landmarks,
        worldLandmarks
      );
      if (curvedMesh) {
        meshGroup.add(curvedMesh);
        this.limbMeshes.set(limb.name, curvedMesh);
      }
    });

    // Generate torso with proper curvature
    const torsoMesh = this.generateCurvedTorsoMesh(landmarks, worldLandmarks);
    if (torsoMesh) meshGroup.add(torsoMesh);

    return meshGroup;
  }

  defineLimbSegments() {
    return [
      {
        name: 'leftUpperArm',
        start: 'leftShoulder',
        middle: 'leftElbow',
        end: 'leftWrist',
        width: { start: 0.08, end: 0.06 }
      },
      {
        name: 'rightUpperArm',
        start: 'rightShoulder',
        middle: 'rightElbow',
        end: 'rightWrist',
        width: { start: 0.08, end: 0.06 }
      },
      {
        name: 'leftUpperLeg',
        start: 'leftHip',
        middle: 'leftKnee',
        end: 'leftAnkle',
        width: { start: 0.12, end: 0.08 }
      },
      {
        name: 'rightUpperLeg',
        start: 'rightHip',
        middle: 'rightKnee',
        end: 'rightAnkle',
        width: { start: 0.12, end: 0.08 }
      }
    ];
  }

  generateCurvedLimbMesh(limb, landmarks, worldLandmarks) {
    const start = landmarks[limb.start];
    const middle = landmarks[limb.middle];
    const end = limb.end ? landmarks[limb.end] : null;

    if (!start || !middle) return null;

    // Get world coordinates for depth
    const startWorld = worldLandmarks[limb.start];
    const middleWorld = worldLandmarks[limb.middle];
    const endWorld = limb.end ? worldLandmarks[limb.end] : null;

    // Calculate curvature
    const curvature = this.calculateLimbCurvature(
      startWorld,
      middleWorld,
      endWorld
    );

    // Generate mesh based on curvature
    if (curvature.angle > this.curvatureThreshold) {
      return this.createCurvedCylinderMesh(
        start, middle, end,
        startWorld, middleWorld, endWorld,
        limb.width,
        curvature
      );
    } else {
      return this.createStraightCylinderMesh(
        start, middle, end,
        limb.width
      );
    }
  }

  calculateLimbCurvature(startWorld, middleWorld, endWorld) {
    if (!endWorld) {
      return { angle: 0, axis: new THREE.Vector3(0, 1, 0), direction: 1 };
    }

    const v1 = new THREE.Vector3(
      middleWorld.x - startWorld.x,
      middleWorld.y - startWorld.y,
      middleWorld.z - startWorld.z
    ).normalize();

    const v2 = new THREE.Vector3(
      endWorld.x - middleWorld.x,
      endWorld.y - middleWorld.y,
      endWorld.z - middleWorld.z
    ).normalize();

    const angle = v1.angleTo(v2);
    const axis = new THREE.Vector3().crossVectors(v1, v2).normalize();
    
    // Determine bend direction from cross product
    const direction = axis.y > 0 ? 1 : -1;

    return { angle, axis, direction };
  }

  createCurvedCylinderMesh(start, middle, end, startWorld, middleWorld, endWorld, width, curvature) {
    const segments = Math.max(8, Math.floor(curvature.angle * 20)); // More segments for sharper bends
    const radialSegments = 16;
    
    // Create curved path
    const curve = this.createBezierCurve(
      startWorld, middleWorld, endWorld,
      curvature
    );

    // Generate geometry along curve
    const geometry = new THREE.TubeGeometry(
      curve,
      segments,
      width.start,
      radialSegments,
      false
    );

    // Apply proper UV mapping for texture wrapping
    this.applyTubeUVMapping(geometry);

    // Create material with proper shading
    const material = new THREE.MeshPhongMaterial({
      color: 0xffdbac,
      transparent: true,
      opacity: 0.0, // Invisible by default, tattoo overlay will show
      side: THREE.DoubleSide,
      depthWrite: false
    });

    const mesh = new THREE.Mesh(geometry, material);
    
    // Store metadata for click detection
    mesh.userData = {
      limbType: 'curved',
      startLandmark: start,
      middleLandmark: middle,
      endLandmark: end,
      curvature: curvature.angle
    };

    return mesh;
  }

  createBezierCurve(startWorld, middleWorld, endWorld, curvature) {
    const start = new THREE.Vector3(startWorld.x, -startWorld.y, startWorld.z);
    const middle = new THREE.Vector3(middleWorld.x, -middleWorld.y, middleWorld.z);
    const end = new THREE.Vector3(endWorld.x, -endWorld.y, endWorld.z);

    // Calculate control points for natural curve
    const bendFactor = curvature.angle * 0.3 * curvature.direction;
    
    // Create perpendicular vector for bend
    const tangent = new THREE.Vector3().subVectors(end, start).normalize();
    const normal = new THREE.Vector3(tangent.y, -tangent.x, 0).normalize();
    
    // Offset middle point to create curve
    const controlPoint = middle.clone().add(
      normal.multiplyScalar(bendFactor * 0.1)
    );

    // Use quadratic bezier for smooth curves
    return new THREE.QuadraticBezierCurve3(start, controlPoint, end);
  }

  applyTubeUVMapping(geometry) {
    const positions = geometry.attributes.position;
    const uvs = [];
    
    // Generate cylindrical UV coordinates
    for (let i = 0; i < positions.count; i++) {
      const vertex = new THREE.Vector3(
        positions.getX(i),
        positions.getY(i),
        positions.getZ(i)
      );
      
      // U coordinate wraps around cylinder
      const angle = Math.atan2(vertex.z, vertex.x);
      const u = (angle + Math.PI) / (2 * Math.PI);
      
      // V coordinate along length
      const v = (vertex.y + 1) / 2;
      
      uvs.push(u, v);
    }

    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  }

  createStraightCylinderMesh(start, middle, end, width) {
    const from = new THREE.Vector3(start.x, -start.y, start.z || 0);
    const to = end ? 
      new THREE.Vector3(end.x, -end.y, end.z || 0) :
      new THREE.Vector3(middle.x, -middle.y, middle.z || 0);

    const distance = from.distanceTo(to);
    const geometry = new THREE.CylinderGeometry(
      width.start, width.end, distance, 16, 1
    );

    const material = new THREE.MeshPhongMaterial({
      color: 0xffdbac,
      transparent: true,
      opacity: 0.0
    });

    const mesh = new THREE.Mesh(geometry, material);
    
    // Position and orient cylinder
    mesh.position.copy(from.clone().add(to).multiplyScalar(0.5));
    mesh.lookAt(to);
    mesh.rotateX(Math.PI / 2);

    return mesh;
  }

  generateCurvedTorsoMesh(landmarks, worldLandmarks) {
    // Define torso vertices with proper topology
    const torsoPoints = [
      'leftShoulder', 'rightShoulder',
      'leftHip', 'rightHip'
    ];

    const vertices = [];
    const indices = [];
    
    // Create curved surface for torso
    const divisions = 8; // Subdivision for smooth curves
    
    for (let v = 0; v <= divisions; v++) {
      for (let u = 0; u <= divisions; u++) {
        const s = u / divisions;
        const t = v / divisions;
        
        // Bilinear interpolation with curve
        const pos = this.bilinearInterpolate(
          landmarks.leftShoulder,
          landmarks.rightShoulder,
          landmarks.leftHip,
          landmarks.rightHip,
          s, t
        );
        
        // Add depth from world coordinates
        const depth = this.interpolateDepth(
          worldLandmarks.leftShoulder,
          worldLandmarks.rightShoulder,
          worldLandmarks.leftHip,
          worldLandmarks.rightHip,
          s, t
        );
        
        // Apply curvature based on body shape
        const curveOffset = Math.sin(s * Math.PI) * Math.sin(t * Math.PI) * 0.02;
        
        vertices.push(
          pos.x,
          pos.y,
          (depth + curveOffset) * 0.5
        );
      }
    }

    // Generate indices for triangles
    for (let v = 0; v < divisions; v++) {
      for (let u = 0; u < divisions; u++) {
        const i0 = v * (divisions + 1) + u;
        const i1 = i0 + 1;
        const i2 = i0 + (divisions + 1);
        const i3 = i2 + 1;
        
        indices.push(i0, i1, i2);
        indices.push(i1, i3, i2);
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    
    // Generate proper UV coordinates
    this.generateTorsoUVs(geometry, divisions);

    const material = new THREE.MeshPhongMaterial({
      color: 0xffdbac,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide
    });

    return new THREE.Mesh(geometry, material);
  }

  bilinearInterpolate(p00, p10, p01, p11, s, t) {
    return {
      x: (1-s)*(1-t)*p00.x + s*(1-t)*p10.x + (1-s)*t*p01.x + s*t*p11.x,
      y: (1-s)*(1-t)*p00.y + s*(1-t)*p10.y + (1-s)*t*p01.y + s*t*p11.y,
      z: 0
    };
  }

  interpolateDepth(w00, w10, w01, w11, s, t) {
    return (1-s)*(1-t)*w00.z + s*(1-t)*w10.z + (1-s)*t*w01.z + s*t*w11.z;
  }

  generateTorsoUVs(geometry, divisions) {
    const uvs = [];
    
    for (let v = 0; v <= divisions; v++) {
      for (let u = 0; u <= divisions; u++) {
        uvs.push(u / divisions, v / divisions);
      }
    }
    
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  }

  // Dynamic subdivision based on pose
  updateSubdivisionLevel(landmarks) {
    // Calculate overall body pose complexity
    const complexity = this.calculatePoseComplexity(landmarks);
    
    // Adjust subdivision level based on complexity
    this.subdivisionLevel = Math.floor(1 + complexity * 3);
  }

  calculatePoseComplexity(landmarks) {
    let totalAngle = 0;
    const limbs = this.defineLimbSegments();
    
    limbs.forEach(limb => {
      if (landmarks[limb.start] && landmarks[limb.middle] && landmarks[limb.end]) {
        const angle = this.calculateJointAngle(
          landmarks[limb.start],
          landmarks[limb.middle],
          landmarks[limb.end]
        );
        totalAngle += Math.abs(Math.PI - angle);
      }
    });
    
    return Math.min(totalAngle / (Math.PI * limbs.length), 1);
  }

  calculateJointAngle(p1, p2, p3) {
    const v1 = { x: p1.x - p2.x, y: p1.y - p2.y };
    const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };
    
    const dot = v1.x * v2.x + v1.y * v2.y;
    const det = v1.x * v2.y - v1.y * v2.x;
    
    return Math.atan2(det, dot);
  }
}

export default boyMeshGenerator;