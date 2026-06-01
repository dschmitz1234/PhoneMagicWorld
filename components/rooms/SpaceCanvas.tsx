'use client';

import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';

function RotatingStars() {
  const groupRef = useRef<THREE.Group>(null);
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.00008;
      groupRef.current.rotation.x += 0.00002;
    }
  });
  return (
    <group ref={groupRef}>
      <Stars radius={200} depth={80} count={4000} factor={4} saturation={0.3} fade />
    </group>
  );
}

function Planet({ position, radius, colour, ringColour }: {
  position: [number, number, number];
  radius: number;
  colour: string;
  ringColour?: string;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (meshRef.current) meshRef.current.rotation.y += 0.001;
  });

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshStandardMaterial color={colour} roughness={0.8} metalness={0.1} />
      </mesh>
      {ringColour && (
        <mesh rotation={[Math.PI / 3, 0, 0]}>
          <torusGeometry args={[radius * 1.7, radius * 0.2, 8, 64]} />
          <meshStandardMaterial color={ringColour} transparent opacity={0.5} roughness={1} />
        </mesh>
      )}
    </group>
  );
}

function FloatingRock({ position, scale }: { position: [number, number, number]; scale: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const rotSpeed = useRef({ x: Math.random() * 0.005, y: Math.random() * 0.007 });

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x += rotSpeed.current.x;
      meshRef.current.rotation.y += rotSpeed.current.y;
    }
  });

  return (
    <mesh ref={meshRef} position={position} scale={scale}>
      <icosahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#2a2a35" roughness={0.9} metalness={0.2} />
    </mesh>
  );
}

function NebulaMesh({ position, colour, opacity }: { position: [number, number, number]; colour: string; opacity: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(Math.random() * 100);

  useFrame((_, delta) => {
    timeRef.current += delta * 0.05;
    if (meshRef.current) {
      meshRef.current.rotation.z += 0.0002;
      (meshRef.current.material as THREE.MeshBasicMaterial).opacity =
        opacity * (0.8 + Math.sin(timeRef.current) * 0.2);
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <planeGeometry args={[120, 80]} />
      <meshBasicMaterial color={colour} transparent opacity={opacity} depthWrite={false} />
    </mesh>
  );
}

export default function SpaceCanvas() {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 75 }}
      style={{ width: '100%', height: '100%' }}
      gl={{ antialias: false, alpha: false }}
    >
      {/* Ambient light only — space is dark */}
      <ambientLight intensity={0.08} />
      <pointLight position={[50, 50, 50]} intensity={0.8} color="#fff8e0" />
      <pointLight position={[-50, -30, -50]} intensity={0.3} color="#8040ff" />

      {/* Rotating star field */}
      <RotatingStars />

      {/* Nebula clouds in background */}
      <NebulaMesh position={[-40, 20, -100]} colour="#2d0a4a" opacity={0.5} />
      <NebulaMesh position={[30, -15, -90]} colour="#0a2040" opacity={0.4} />
      <NebulaMesh position={[0, 5, -80]} colour="#1a0a2d" opacity={0.35} />

      {/* Planets */}
      <Planet position={[40, 20, -80]} radius={8} colour="#c84a1a" ringColour="#c8a030" />
      <Planet position={[-30, -10, -40]} radius={3} colour="#a0c8e0" />

      {/* Floating asteroids */}
      <FloatingRock position={[15, -8, -20]} scale={[1.5, 1.2, 1.0]} />
      <FloatingRock position={[-20, 12, -30]} scale={[0.8, 1.0, 0.9]} />
      <FloatingRock position={[25, 5, -25]} scale={[1.2, 0.8, 1.1]} />
      <FloatingRock position={[-8, -15, -15]} scale={[0.6, 0.7, 0.6]} />
    </Canvas>
  );
}
