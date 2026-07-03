import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import { useThemeStore } from '../../store/useThemeStore';

const NeuralNetwork = ({ pointsColor = "#60a5fa", linesColor = "#3b82f6" }) => {
  const groupRef = useRef();
  const particleCount = 250;
  const maxDistance = 2.5;
  const spread = 20;
  
  const { positions, lines } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i++) {
        pos[i] = (Math.random() - 0.5) * spread;
    }
    
    const linePositions = [];
    for (let i = 0; i < particleCount; i++) {
      for (let j = i + 1; j < particleCount; j++) {
        const dx = pos[i * 3] - pos[j * 3];
        const dy = pos[i * 3 + 1] - pos[j * 3 + 1];
        const dz = pos[i * 3 + 2] - pos[j * 3 + 2];
        const distSq = dx*dx + dy*dy + dz*dz;
        
        if (distSq < maxDistance * maxDistance) {
            linePositions.push(
               pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2],
               pos[j * 3], pos[j * 3 + 1], pos[j * 3 + 2]
            );
        }
      }
    }
    
    return {
        positions: pos,
        lines: new Float32Array(linePositions)
    };
  }, []);

  useFrame((state) => {
    if (groupRef.current) {
        groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.03;
        groupRef.current.rotation.x = state.clock.getElapsedTime() * 0.015;
    }
  });

  return (
    <group ref={groupRef}>
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={positions.length / 3}
            array={positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial size={0.06} color={pointsColor} transparent opacity={0.6} sizeAttenuation={true} />
      </points>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={lines.length / 3}
            array={lines}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color={linesColor} transparent opacity={0.2} />
      </lineSegments>
    </group>
  );
};

export default function Background3D() {
  const { resolvedTheme } = useThemeStore();
  const fogColor = resolvedTheme === 'dark' ? '#020617' : '#f8fafc';
  const pointsColor = resolvedTheme === 'dark' ? '#60a5fa' : '#2563eb';
  const linesColor = resolvedTheme === 'dark' ? '#3b82f6' : '#93c5fd';

  return (
    <div className="absolute inset-0 z-0 bg-background overflow-hidden pointer-events-none">
      <Canvas camera={{ position: [0, 0, 10], fov: 60 }}>
        <fog attach="fog" args={[fogColor, 5, 20]} />
        {resolvedTheme === 'dark' && <Stars radius={50} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />}
        <NeuralNetwork pointsColor={pointsColor} linesColor={linesColor} />
      </Canvas>
    </div>
  );
}
