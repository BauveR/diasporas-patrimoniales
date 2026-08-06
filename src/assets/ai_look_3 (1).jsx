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

  const PARAMS = useMemo(() => ({"scale":110,"speed":1.35,"twist":8,"glow":3.5,"brightness":1.12,"chaos":0.95,"layers":4.2,"pulse":1.75,"gravity":1.65}), []);
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
        const scale = addControl("scale", "Scale", 30, 260, 110);
        const speed = addControl("speed", "Speed", 0, 5, 1.35);
        const twist = addControl("twist", "Twist", 0, 18, 8.0);
        const glow = addControl("glow", "Glow", 0, 6, 3.5);
        const brightness = addControl("brightness", "Brightness", 0.4, 1.4, 1.12);
        const chaos = addControl("chaos", "Chaos", 0, 3, 0.95);
        const layers = addControl("layers", "Layers", 1, 8, 4.2);
        const pulse = addControl("pulse", "Pulse", 0, 5, 1.75);
        const gravity = addControl("gravity", "Gravity", 0, 6, 1.65);
        
        const safeCount = count > 0 ? count : 1;
        const u = i / safeCount;
        const t = time * speed;
        const pi = 3.141592653589793;
        const pi2 = 6.283185307179586;
        const phi = 1.618033988749895;
        const golden = 2.399963229728653;
        
        const id = i + 1;
        const layerId = (id % 7) + 1;
        const ringId = (id % 13) + 1;
        const stackId = (id % 17) + 1;
        
        const v = u * pi2;
        const a = v * twist + t * 0.7 + layerId * 0.37;
        const b = v * (0.5 + 0.15 * layers) - t * 0.45 + ringId * 0.21;
        const c = v * phi * 2.0 + t * 0.9 + stackId * 0.13;
        
        const s1 = Math.sin(a);
        const c1 = Math.cos(a);
        const s2 = Math.sin(b);
        const c2 = Math.cos(b);
        const s3 = Math.sin(c);
        const c3 = Math.cos(c);
        
        const fib = golden * id;
        const hx = Math.cos(fib) * Math.sqrt(1.0 - Math.pow(1.0 - 2.0 * u, 2.0));
        const hy = 1.0 - 2.0 * u;
        const hz = Math.sin(fib) * Math.sqrt(1.0 - Math.pow(1.0 - 2.0 * u, 2.0));
        
        const coreSpin = 0.45 + 0.35 * Math.sin(u * pi2 * 8.0 + t * 1.4);
        const shellSpin = 0.65 + 0.25 * Math.cos(u * pi2 * 5.0 - t * 0.9);
        const wave = Math.sin(u * pi2 * 16.0 + t * pulse) * 0.5 + Math.cos(u * pi2 * 9.0 - t * 1.2) * 0.5;
        const bloomPulse = 1.0 + 0.2 * Math.sin(t * pulse + u * pi2 * 3.0);
        
        const ringRadius = scale * (0.22 + 0.12 * shellSpin + 0.06 * wave);
        const tubeRadius = scale * (0.04 + 0.02 * glow + 0.03 * Math.abs(Math.sin(v * 3.0 + t)));
        
        const torusX = (ringRadius + tubeRadius * c2) * c1;
        const torusY = tubeRadius * s2;
        const torusZ = (ringRadius + tubeRadius * c2) * s1;
        
        const helixAngle = v * twist + t * 1.1;
        const helixRadius = scale * (0.18 + 0.07 * Math.sin(v * 6.0 + t * 0.5));
        const helixX = Math.cos(helixAngle) * helixRadius;
        const helixY = (u - 0.5) * scale * 1.5;
        const helixZ = Math.sin(helixAngle) * helixRadius;
        
        const lattice = scale * 0.18;
        const gx = ((i % 5) - 2) * lattice;
        const gy = (((i / 5) | 0) % 5 - 2) * lattice * 0.8;
        const gz = (((i / 25) | 0) % 5 - 2) * lattice;
        
        const morphA = 0.5 + 0.5 * Math.sin(t * 0.55 + u * pi2 * 2.0);
        const morphB = 0.5 + 0.5 * Math.cos(t * 0.33 + u * pi2 * 3.0);
        const morphC = 0.5 + 0.5 * Math.sin(t * 0.77 + u * pi2 * 5.0);
        
        let x =
        hx * scale * 0.28 +
        torusX * morphA +
        helixX * morphB +
        gx * morphC * 0.35;
        
        let y =
        hy * scale * 0.33 +
        torusY * morphB +
        helixY * morphC * 0.45 +
        gy * morphA * 0.32;
        
        let z =
        hz * scale * 0.28 +
        torusZ * morphC +
        helixZ * morphA +
        gz * morphB * 0.35;
        
        const swirl = 1.0 + chaos * 0.12 * Math.sin(v * 12.0 + t * 2.2);
        const vortex = 1.0 / (0.22 + Math.abs(y) * gravity * 0.08);
        const ripple = Math.sin((x + z) * 0.018 + t * 1.6) + Math.cos((x - z) * 0.02 - t * 1.1);
        const pulseField = Math.sin((x * x + y * y + z * z) * 0.0007 - t * pulse);
        
        x = x * swirl + Math.cos(v * 4.0 + t * 0.8) * glow * 1.2 + ripple * chaos * 0.9;
        y = y * (1.0 + 0.06 * pulseField) + Math.sin(v * 3.0 - t * 1.3) * glow * 0.8;
        z = z * swirl + Math.sin(v * 5.0 + t * 0.6) * glow * 1.1 - ripple * chaos * 0.7;
        
        x += (torusX * 0.18 + helixX * 0.15) * vortex;
        y += (torusY * 0.16 + helixY * 0.12) * vortex;
        z += (torusZ * 0.18 + helixZ * 0.15) * vortex;
        
        x += Math.sin(fib * 0.07 + t) * scale * 0.02;
        y += Math.cos(fib * 0.05 - t * 0.7) * scale * 0.02;
        z += Math.sin(fib * 0.09 + t * 0.5) * scale * 0.02;
        
        target.set(x, y, z);
        
        const energy = 0.5 + 0.5 * Math.sin(v * 4.0 + t * 0.7) + 0.25 * Math.cos((x + y + z) * 0.01 - t);
        const hue = (0.56 + 0.13 * Math.sin(u * pi2 * 2.0 + t * 0.25) + 0.08 * Math.sin(v * 6.0 + pulseField) + 0.05 * energy) % 1;
        const sat = 0.72 + 0.18 * Math.cos(v * 5.0 - t * 0.8) + 0.08 * Math.sin(u * pi2 * 11.0 + t * 1.3);
        const litBase =
        0.62 +
        0.18 * Math.exp(-Math.abs(y) * 0.015) +
        0.10 * Math.sin((x * x + z * z) * 0.00035 + t * 2.0) +
        0.10 * bloomPulse;
        
        const lit = litBase * brightness + glow * 0.035;
        
        color.setHSL(
        hue - Math.floor(hue),
        sat < 0 ? 0 : sat > 1 ? 1 : sat,
        lit < 0 ? 0 : lit > 1 ? 1 : lit
        );
        
        if (i === 0) {
        setInfo(
        "Hyperluminous Swarm",
        "A multi-layered particle organism blending golden-ratio packing, toroidal flow, helix drift, lattice memory, and a brighter radiant bloom."
        );
        annotate("core", new THREE.Vector3(0, 0, 0), "Radiant Core");
        annotate("halo", new THREE.Vector3(scale * 0.7, scale * 0.1, 0), "Bloom Halo");
        annotate("flow", new THREE.Vector3(0, scale * 0.45, scale * 0.15), "Flow Axis");
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