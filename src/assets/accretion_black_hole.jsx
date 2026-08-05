import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import { OrbitControls, Effects } from '@react-three/drei';
import { UnrealBloomPass } from 'three-stdlib';
import * as THREE from 'three';

extend({ UnrealBloomPass });

const ParticleSwarm = () => {
  const meshRef = useRef();
  const count = 20000;
  const speedMult = 1;
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const target = useMemo(() => new THREE.Vector3(), []);
  const pColor = useMemo(() => new THREE.Color(), []);
  const color = pColor; // Alias for user code compatibility
  
  const positions = useMemo(() => {
     const pos = [];
     for(let i=0; i<count; i++) pos.push(new THREE.Vector3((Math.random()-0.5)*100, (Math.random()-0.5)*100, (Math.random()-0.5)*100));
     return pos;
  }, []);

  // Material & Geom
  const material = useMemo(() => new THREE.MeshBasicMaterial({ color: 0xffffff }), []);
  const geometry = useMemo(() => new THREE.TetrahedronGeometry(0.25), []);

  const PARAMS = useMemo(() => ({"radius":120,"spin":2.5,"warp":1.2,"thickness":10}), []);
  const addControl = (id, l, min, max, val) => {
      return PARAMS[id] !== undefined ? PARAMS[id] : val;
  };
  const setInfo = () => {};
  const annotate = () => {};

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime() * speedMult;
    const THREE_LIB = THREE;

    if(material.uniforms && material.uniforms.uTime) {
         material.uniforms.uTime.value = time;
    }

    for (let i = 0; i < count; i++) {
        // USER CODE START
        const radius = addControl("radius", "Disk Radius", 40, 220, 120);
        const spin = addControl("spin", "Spin", 0.2, 8, 2.5);
        const warp = addControl("warp", "Warp", 0, 3, 1.2);
        const thickness = addControl("thickness", "Disk Thickness", 0, 40, 10);
        
        const g = 2.399963229728653;
        const u = (i + 0.5) / count;
        
        const r = radius * (0.08 + 0.92 * Math.sqrt(u));
        const a = g * i + time * spin;
        
        const pull = 1.0 / (1.0 + 0.025 * r);
        const bend = warp * pull * 2.0;
        
        const ca = Math.cos(a + bend);
        const sa = Math.sin(a + bend);
        
        const x = r * ca;
        const y = thickness * pull * Math.sin(a * 4.0 + time * 1.5);
        const z = r * sa;
        
        target.set(x, y, z);
        
        const glow = 1.0 - pull;
        const hue = 0.08 + 0.12 * glow;
        const sat = 0.9 - 0.5 * pull;
        const light = 0.02 + 0.72 * glow * glow;
        
        color.setHSL(hue, sat, light);
        
        if (i === 0) {
        setInfo(
        "Accretion Black Hole",
        "A relativistic accretion disk with gravitational lensing distortion surrounding a dark singularity."
        );
        annotate("singularity", new THREE.Vector3(0, 0, 0), "Event Horizon");
        }
        
        // USER CODE END

        positions[i].lerp(target, 0.1);
        dummy.position.copy(positions[i]);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
        meshRef.current.setColorAt(i, pColor);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[geometry, material, count]} />
  );
};

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000' }}>
      <Canvas camera={{ position: [0, 0, 100], fov: 60 }}>
        <fog attach="fog" args={['#000000', 0.01]} />
        <ParticleSwarm />
        <OrbitControls autoRotate={true} />
        <Effects disableGamma>
            <unrealBloomPass threshold={0} strength={1.8} radius={0.4} />
        </Effects>
      </Canvas>
    </div>
  );
}