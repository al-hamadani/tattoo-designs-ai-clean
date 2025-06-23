import * as THREE from 'three';

export const warpToBody = ({ mesh, bodyPart, landmarks, meshHints }) => {
  if (!mesh || !mesh.geometry) return;

  const geom = mesh.geometry;
  
  // Check if this is a standard PlaneGeometry with parameters
  const isPlaneGeometry = geom.parameters && 
                         typeof geom.parameters.widthSegments !== 'undefined' && 
                         typeof geom.parameters.heightSegments !== 'undefined';
  
  // For custom geometries created by BodyMeshGenerator, warping is already built-in
  if (!isPlaneGeometry) {
    // console.log('🔄 Custom geometry detected, warping already applied');
    
    // Only handle UV adjustments for twist if needed
    if (meshHints && meshHints.twist && Math.abs(meshHints.twist) > 0.1) {
      const uvs = geom.attributes.uv;
      if (uvs) {
        const count = uvs.count;
        
        for (let i = 0; i < count; i++) {
          const u = uvs.getX(i);
          const v = uvs.getY(i);
          
          // Apply twist compensation to texture
          const angle = meshHints.twist * (v - 0.5);
          const newU = (u - 0.5) * Math.cos(angle) - (v - 0.5) * Math.sin(angle) + 0.5;
          const newV = (u - 0.5) * Math.sin(angle) + (v - 0.5) * Math.cos(angle) + 0.5;
          
          uvs.setX(i, newU);
          uvs.setY(i, newV);
        }
        
        uvs.needsUpdate = true;
      }
    }
    
    // Update geometry bounds
    geom.computeBoundingSphere();
    geom.computeBoundingBox();
    return;
  }

  // Original warp code for standard PlaneGeometry
  // Only run this for the initial plane mesh
  if (geom.parameters.widthSegments < 4 || geom.parameters.heightSegments < 4) {
    const { width = 1, height = 1 } = geom.parameters;
    mesh.geometry.dispose();
    mesh.geometry = new THREE.PlaneGeometry(width, height, 20, 20);
  }

  // Rest of original warping code for standard planes...
  const positions = mesh.geometry.attributes.position;
  const count = positions.count;
  const curvature = meshHints?.curvature || 0.2;

  for (let i = 0; i < count; i++) {
    const x = positions.getX(i);
    const y = positions.getY(i);
    const z = Math.sin((y + 0.5) * Math.PI) * curvature * mesh.scale.y * 0.3;
    positions.setZ(i, z);
  }

  positions.needsUpdate = true;
  mesh.geometry.computeVertexNormals();
};