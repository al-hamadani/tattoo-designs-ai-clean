import * as THREE from 'three';

/**
 * Bend the plane mesh so the tattoo follows the curvature of the body.
 * This is a lightweight approximation that adjusts vertex Z positions
 * based on the angle between adjacent body landmarks.
 */
export const warpToBody = ({ mesh, bodyPart, landmarks }) => {
  if (!mesh || !mesh.geometry) return;

  const geom = mesh.geometry;

  // Ensure geometry has enough segments to bend
  if (geom.parameters.widthSegments < 4 || geom.parameters.heightSegments < 4) {
    const { width = 1, height = 1 } = geom.parameters;
    mesh.geometry.dispose();
    mesh.geometry = new THREE.PlaneGeometry(width, height, 20, 20);
  }

  const positions = mesh.geometry.attributes.position;
  const count = positions.count;

  // Determine bend amount based on landmark angles
  let curvature = 0;
  const get = (k) => landmarks?.[k];

  if (bodyPart?.includes('arm')) {
    const side = bodyPart.startsWith('left') ? 'left' : 'right';
    const shoulder = get(`${side}Shoulder`);
    const elbow = get(`${side}Elbow`);
    const wrist = get(`${side}Wrist`);
    if (shoulder && elbow && wrist) {
      const v1 = new THREE.Vector3(shoulder.x - elbow.x, shoulder.y - elbow.y, (shoulder.z || 0) - (elbow.z || 0));
      const v2 = new THREE.Vector3(wrist.x - elbow.x, wrist.y - elbow.y, (wrist.z || 0) - (elbow.z || 0));
      curvature = v1.angleTo(v2) / Math.PI; // fraction of 180deg
    }
  } else if (bodyPart?.includes('leg')) {
    const side = bodyPart.startsWith('left') ? 'left' : 'right';
    const hip = get(`${side}Hip`);
    const knee = get(`${side}Knee`);
    const ankle = get(`${side}Ankle`);
    if (hip && knee && ankle) {
      const v1 = new THREE.Vector3(hip.x - knee.x, hip.y - knee.y, (hip.z || 0) - (knee.z || 0));
      const v2 = new THREE.Vector3(ankle.x - knee.x, ankle.y - knee.y, (ankle.z || 0) - (knee.z || 0));
      curvature = v1.angleTo(v2) / Math.PI;
    }
  } else {
    curvature = 0.2; // small default bend
  }

  for (let i = 0; i < count; i++) {
    const x = positions.getX(i);
    const y = positions.getY(i);
    const z = Math.sin((y + 0.5) * Math.PI) * curvature * mesh.scale.y * 0.3;
    positions.setZ(i, z);
  }

  positions.needsUpdate = true;
  mesh.geometry.computeVertexNormals();
};
