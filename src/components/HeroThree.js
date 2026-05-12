"use client";
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, PerspectiveCamera, RoundedBox, ContactShadows } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

function createLCDTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 384;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#0a1628';
  ctx.fillRect(0, 0, 512, 384);

  ctx.fillStyle = '#0f2940';
  ctx.fillRect(20, 20, 472, 344);
  ctx.fillStyle = '#0a1628';
  ctx.fillRect(24, 24, 464, 336);

  const drawLCDText = (text, x, y, size, color = '#00e5ff', alpha = 0.9) => {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `${size}px "Courier New", monospace`;
    ctx.fillStyle = color;
    ctx.textBaseline = 'top';
    ctx.fillText(text, x, y);
    ctx.restore();
  };

  const blink = Math.sin(Date.now() * 0.003) > 0;

  // --- Top bar: battery, signal, icons ---
  // Signal bars
  for (let i = 0; i < 4; i++) {
    const h = 8 + i * 6;
    ctx.fillStyle = i < 3 ? '#00e5ff' : '#004466';
    ctx.fillRect(380 + i * 14, 36 + (28 - h), 8, h);
  }
  drawLCDText('RSSI', 380, 60, 11, '#006688');

  // Battery icon
  ctx.strokeStyle = '#00e5ff';
  ctx.lineWidth = 2;
  ctx.strokeRect(440, 34, 28, 18);
  ctx.fillRect(468, 38, 4, 10);
  ctx.fillStyle = '#00e5ff';
  ctx.fillRect(442, 36, 18, 14);

  // Channel display
  drawLCDText('CH-01', 36, 34, 22, '#00e5ff');

  // --- Main frequency display ---
  drawLCDText('145.250', 36, 72, 58, '#00e5ff', 1);
  drawLCDText('MHz', 70, 128, 16, '#006688');

  // CTCSS tone
  drawLCDText('CTCSS  88.5Hz', 36, 160, 14, '#0088aa');

  // --- Right side info ---
  drawLCDText('TX', 380, 90, 14, '#00e5ff');
  drawLCDText('PWR', 380, 112, 14, '#006688');
  drawLCDText('HI', 430, 112, 14, blink ? '#00e5ff' : '#006688');

  // VFO/MR mode indicator
  drawLCDText('VFO', 380, 140, 14, '#00e5ff');
  ctx.fillStyle = '#00e5ff';
  ctx.beginPath();
  ctx.moveTo(422, 140);
  ctx.lineTo(432, 148);
  ctx.lineTo(422, 156);
  ctx.fill();

  // --- Bottom: key labels ---
  drawLCDText('SCAN  STEP  SQL  SAVE', 36, 190, 12, '#006688');

  // Divider line
  ctx.strokeStyle = '#003355';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(36, 216);
  ctx.lineTo(476, 216);
  ctx.stroke();

  // Frequency bar graph
  ctx.fillStyle = '#003355';
  ctx.fillRect(36, 228, 440, 4);
  for (let i = 0; i < 20; i++) {
    const h = 4 + Math.random() * 30;
    ctx.fillStyle = i < 12 ? '#00e5ff' : '#003355';
    ctx.fillRect(40 + i * 22, 232 + (34 - h), 16, h);
  }

  drawLCDText('RX', 36, 276, 11, '#00e5ff');
  const rxBlink = Math.sin(Date.now() * 0.005) > 0;
  if (rxBlink) {
    ctx.fillStyle = '#00e5ff';
    ctx.beginPath();
    ctx.arc(70, 282, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Time
  drawLCDText('12:47', 400, 276, 16, '#006688');

  // Bottom menu bar
  ctx.fillStyle = '#001a2e';
  ctx.fillRect(24, 304, 464, 32);
  drawLCDText('MENU', 40, 310, 13, '#00e5ff');
  drawLCDText('BAND', 140, 310, 13, '#006688');
  drawLCDText('VFO/MR', 240, 310, 13, '#006688');
  drawLCDText('LOCK', 370, 310, 13, blink ? '#00e5ff' : '#006688');

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

const Particles = ({ count = 400 }) => {
  const meshRef = useRef();
  const countRef = useRef(count);

  const particles = useMemo(() => {
    const seeded = (seed) => {
      const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
      return x - Math.floor(x);
    };
    const temp = [];
    for (let i = 0; i < count; i++) {
      const theta = seeded(i * 5) * Math.PI * 2;
      const phi = Math.acos(2 * seeded(i * 5 + 1) - 1);
      const r = 4 + seeded(i * 5 + 2) * 8;
      temp.push({
        x: r * Math.sin(phi) * Math.cos(theta),
        y: r * Math.sin(phi) * Math.sin(theta),
        z: r * Math.cos(phi),
        speed: 0.001 + seeded(i * 7) * 0.003,
        phase: seeded(i * 11) * Math.PI * 2,
        size: 0.01 + seeded(i * 13) * 0.04
      });
    }
    return temp;
  }, [count]);

  const [positions, sizes] = useMemo(() => {
    const p = new Float32Array(count * 3);
    const s = new Float32Array(count);
    particles.forEach((pt, i) => {
      p[i * 3] = pt.x;
      p[i * 3 + 1] = pt.y;
      p[i * 3 + 2] = pt.z;
      s[i] = pt.size;
    });
    return [p, s];
  }, [particles, count]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const pos = meshRef.current.geometry.attributes.position;
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const p = particles[i];
      const drift = Math.sin(time * p.speed + p.phase) * 0.02;
      pos.array[i3] += Math.sin(time * 0.2 + p.phase) * 0.001;
      pos.array[i3 + 1] += Math.cos(time * 0.15 + p.phase * 1.3) * 0.001;
      pos.array[i3 + 2] += Math.sin(time * 0.1 + p.phase * 0.7) * 0.001;
    }
    pos.needsUpdate = true;
    meshRef.current.rotation.y += 0.0003;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.025}
        color="#6366f1"
        transparent
        opacity={0.3}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

const HTModel = () => {
  const groupRef = useRef();
  const screenRef = useRef();
  const lcdTexture = useMemo(() => createLCDTexture(), []);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  useEffect(() => {
    let frame;
    const updateTexture = () => {
      if (screenRef.current) {
        const tex = createLCDTexture();
        screenRef.current.material.map = tex;
        screenRef.current.material.needsUpdate = true;
      }
      frame = requestAnimationFrame(updateTexture);
    };
    frame = requestAnimationFrame(updateTexture);

    const handleMouse = (e) => {
      setMouse({
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2
      });
    };
    window.addEventListener('mousemove', handleMouse);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('mousemove', handleMouse);
    };
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const g = groupRef.current;

    g.position.y = Math.sin(t * 0.6) * 0.15;
    const autoRot = t * 0.08;
    const tx = mouse.y * 0.3;
    const ty = mouse.x * 0.3 + autoRot;
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, tx, 0.05);
    g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, ty, 0.05);
    const s = 1 + Math.sin(t * 1.2) * 0.008;
    g.scale.set(s, s, s);
  });

  const bodyMat = new THREE.MeshStandardMaterial({
    color: '#0f172a',
    metalness: 0.85,
    roughness: 0.2,
    envMapIntensity: 1.5
  });

  const darkMetalMat = new THREE.MeshStandardMaterial({
    color: '#1e293b',
    metalness: 0.9,
    roughness: 0.15
  });

  const rubberMat = new THREE.MeshStandardMaterial({
    color: '#1a1a2e',
    roughness: 0.95,
    metalness: 0
  });

  const orangeMat = new THREE.MeshStandardMaterial({
    color: '#f97316',
    emissive: '#f97316',
    emissiveIntensity: 0.4,
    roughness: 0.3,
    metalness: 0.1
  });

  return (
    <group ref={groupRef}>
      {/* ===== MAIN BODY ===== */}
      {/* Back battery pack */}
      <mesh position={[0, 0, -0.35]}>
        <RoundedBox args={[0.9, 1.7, 0.15]} radius={0.06} smoothness={4}>
          <meshStandardMaterial color="#111827" roughness={0.9} metalness={0.1} />
        </RoundedBox>
      </mesh>
      {/* Battery texture lines */}
      {[-0.5, 0, 0.5].map((y, i) => (
        <mesh key={`bat-${i}`} position={[0, y, -0.42]}>
          <boxGeometry args={[0.7, 0.02, 0.01]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
      ))}

      {/* Belt clip */}
      <mesh position={[-0.35, -0.6, -0.42]}>
        <RoundedBox args={[0.06, 0.5, 0.08]} radius={0.01} smoothness={2}>
          <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
        </RoundedBox>
      </mesh>

      {/* Main chassis - slightly tapered */}
      <mesh position={[0, 0.05, 0]}>
        <RoundedBox args={[1, 1.8, 0.6]} radius={0.1} smoothness={6}>
          <meshStandardMaterial {...bodyMat} />
        </RoundedBox>
      </mesh>

      {/* Top cap */}
      <mesh position={[0, 0.98, 0]}>
        <RoundedBox args={[0.85, 0.06, 0.55]} radius={0.02} smoothness={3}>
          <meshStandardMaterial color="#111827" metalness={0.9} roughness={0.1} />
        </RoundedBox>
      </mesh>

      {/* Bottom cap with charging contacts */}
      <mesh position={[0, -0.92, 0.15]}>
        <RoundedBox args={[0.6, 0.04, 0.12]} radius={0.01} smoothness={2}>
          <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
        </RoundedBox>
      </mesh>
      {/* Charging pins */}
      {[-0.15, 0.15].map((x, i) => (
        <mesh key={`pin-${i}`} position={[x, -0.94, 0.22]}>
          <cylinderGeometry args={[0.015, 0.02, 0.03, 8]} />
          <meshStandardMaterial color="#fbbf24" metalness={1} roughness={0.2} />
        </mesh>
      ))}

      {/* Side grips */}
      {[-1, 1].map((side) => (
        <group key={`grip-${side}`}>
          {Array.from({ length: 8 }).map((_, i) => (
            <mesh key={i} position={[side * 0.505, 0.5 - i * 0.18, 0]}>
              <boxGeometry args={[0.02, 0.1, 0.5]} />
              <meshStandardMaterial color="#111827" roughness={0.9} />
            </mesh>
          ))}
        </group>
      ))}

      {/* ===== ANTENNA ===== */}
      {/* Antenna base */}
      <mesh position={[0.3, 1.02, 0]}>
        <cylinderGeometry args={[0.08, 0.1, 0.12, 16]} />
        <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Antenna shaft - 3 sections */}
      {[0, 1, 2].map((i) => (
        <mesh key={`ant-${i}`} position={[0.3, 1.08 + i * 0.35, 0]}>
          <cylinderGeometry args={[0.055 - i * 0.01, 0.07 - i * 0.01, 0.35, 12]} />
          <meshStandardMaterial
            color={i === 0 ? '#1e293b' : i === 1 ? '#0f172a' : '#111827'}
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
      ))}
      {/* Antenna tip */}
      <mesh position={[0.3, 2.15, 0]}>
        <sphereGeometry args={[0.04, 10, 10]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.5} roughness={0.3} />
      </mesh>

      {/* ===== TOP KNOBS ===== */}
      {/* Volume knob - left */}
      <group position={[-0.25, 0.98, 0]}>
        <mesh>
          <cylinderGeometry args={[0.14, 0.15, 0.22, 24]} />
          <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.2} />
        </mesh>
        {Array.from({ length: 16 }).map((_, i) => (
          <mesh key={`vr-${i}`} rotation={[0, (i / 16) * Math.PI * 2, 0]} position={[0, 0, 0]}>
            <boxGeometry args={[0.015, 0.23, 0.3]} />
            <meshStandardMaterial color="#1e293b" metalness={0.7} />
          </mesh>
        ))}
        {/* Top indicator dot */}
        <mesh position={[0.12, 0.115, 0]}>
          <sphereGeometry args={[0.015, 8, 8]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.5} />
        </mesh>
      </group>

      {/* Channel knob - right */}
      <group position={[0.2, 0.98, 0]}>
        <mesh>
          <cylinderGeometry args={[0.1, 0.11, 0.18, 20]} />
          <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.2} />
        </mesh>
        {Array.from({ length: 12 }).map((_, i) => (
          <mesh key={`cr-${i}`} rotation={[0, (i / 12) * Math.PI * 2, 0]} position={[0, 0, 0]}>
            <boxGeometry args={[0.01, 0.19, 0.22]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
        ))}
      </group>

      {/* Antenna mount ring */}
      <mesh position={[0.3, 0.98, 0]}>
        <torusGeometry args={[0.09, 0.02, 8, 16]} />
        <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* ===== SCREEN / DISPLAY ===== */}
      {/* Screen bezel */}
      <mesh position={[0, 0.3, 0.305]}>
        <RoundedBox args={[0.85, 0.6, 0.02]} radius={0.02} smoothness={3}>
          <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.1} />
        </RoundedBox>
      </mesh>

      {/* LCD panel - emissive backlight */}
      <mesh position={[0, 0.3, 0.315]}>
        <planeGeometry args={[0.78, 0.54]} />
        <meshStandardMaterial
          color="#000000"
          emissive="#00e5ff"
          emissiveIntensity={0.15}
          roughness={0}
          metalness={0.3}
        />
      </mesh>

      {/* LCD content - animated canvas texture */}
      <mesh ref={screenRef} position={[0, 0.3, 0.32]}>
        <planeGeometry args={[0.74, 0.5]} />
        <meshBasicMaterial
          map={lcdTexture}
          transparent
          toneMapped={false}
        />
      </mesh>

      {/* Screen glass reflection */}
      <mesh position={[0, 0.3, 0.322]}>
        <planeGeometry args={[0.76, 0.52]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.03}
          roughness={0}
          metalness={0}
        />
      </mesh>

      {/* ===== LED INDICATORS ===== */}
      {/* Green LED - Power */}
      <mesh position={[0.35, 0.65, 0.31]}>
        <sphereGeometry args={[0.018, 8, 8]} />
        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={3} />
      </mesh>
      <mesh position={[0.35, 0.65, 0.3]}>
        <circleGeometry args={[0.025, 16]} />
        <meshBasicMaterial color="#22c55e" transparent opacity={0.3} />
      </mesh>

      {/* Red LED - TX */}
      <mesh position={[0.35, 0.59, 0.31]}>
        <sphereGeometry args={[0.018, 8, 8]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={2} />
      </mesh>

      {/* ===== SPEAKER GRILLE ===== */}
      <group position={[0, -0.3, 0.31]}>
        {Array.from({ length: 7 }).map((_, row) =>
          Array.from({ length: 5 }).map((_, col) => (
            <mesh key={`spk-${row}-${col}`} position={[-0.4 + col * 0.2, -row * 0.09, 0]}>
              <cylinderGeometry args={[0.025, 0.025, 0.01, 10]} />
              <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
            </mesh>
          ))
        )}
      </group>

      {/* ===== KEYPAD ===== */}
      <group position={[0, -0.7, 0.31]}>
        {[0, 1, 2, 3].map(row =>
          [-0.24, 0, 0.24].map((col, colIdx) => {
            const keyLabels = [
              ['1', '2', '3'],
              ['4', '5', '6'],
              ['7', '8', '9'],
              ['*', '0', '#']
            ];
            return (
              <group key={`key-${row}-${colIdx}`} position={[col, -row * 0.13, 0]}>
                <RoundedBox args={[0.2, 0.09, 0.025]} radius={0.008} smoothness={2}>
                  <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.3} />
                </RoundedBox>
                {/* Key label plane */}
                <mesh position={[0, 0, 0.015]}>
                  <planeGeometry args={[0.15, 0.05]} />
                  <meshBasicMaterial color="#64748b" transparent opacity={0.6} />
                </mesh>
              </group>
            );
          })
        )}
      </group>

      {/* ===== PTT BUTTON (LEFT SIDE) ===== */}
      <mesh position={[-0.515, 0.2, 0]}>
        <RoundedBox args={[0.04, 0.45, 0.22]} radius={0.01} smoothness={2}>
          <meshStandardMaterial {...orangeMat} />
        </RoundedBox>
      </mesh>
      {/* PTT texture grip */}
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={`ptt-${i}`} position={[-0.535, 0.32 - i * 0.07, 0]}>
          <boxGeometry args={[0.01, 0.02, 0.16]} />
          <meshStandardMaterial color="#c2410c" />
        </mesh>
      ))}

      {/* ===== SIDE BUTTONS (RIGHT) ===== */}
      {/* Monitor button */}
      <mesh position={[0.515, 0.5, 0.15]}>
        <RoundedBox args={[0.03, 0.1, 0.08]} radius={0.005} smoothness={2}>
          <meshStandardMaterial color="#334155" metalness={0.5} roughness={0.5} />
        </RoundedBox>
      </mesh>
      {/* Call button */}
      <mesh position={[0.515, -0.1, -0.1]}>
        <RoundedBox args={[0.03, 0.1, 0.08]} radius={0.005} smoothness={2}>
          <meshStandardMaterial color="#334155" metalness={0.5} roughness={0.5} />
        </RoundedBox>
      </mesh>

      {/* ===== MICROPHONE HOLE ===== */}
      <mesh position={[0.05, 0.66, 0.31]}>
        <circleGeometry args={[0.01, 8]} />
        <meshBasicMaterial color="#000000" />
      </mesh>

      {/* ===== BRAND BAR ===== */}
      <mesh position={[0, 0.78, 0.31]}>
        <planeGeometry args={[0.35, 0.05]} />
        <meshBasicMaterial color="#64748b" transparent opacity={0.3} />
      </mesh>
    </group>
  );
};

export default function HeroThree() {
  return (
    <div className="three-js-container" style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        gl={{ alpha: true, antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
        dpr={[1, 2]}
        shadows
      >
        <PerspectiveCamera makeDefault position={[0, 0.3, 5.5]} fov={32} />

        <ambientLight intensity={0.3} color="#b4c6e0" />

        {/* Key light - warm from top-right */}
        <directionalLight
          position={[4, 5, 4]}
          intensity={3}
          color="#ffeedd"
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />

        {/* Fill light - cool from left */}
        <directionalLight position={[-3, 2, 3]} intensity={1.5} color="#aaccff" />

        {/* Rim light - from behind right */}
        <directionalLight position={[3, 1, -4]} intensity={2} color="#00e5ff" />

        {/* Rim light - from behind left */}
        <directionalLight position={[-2, 0, -4]} intensity={1.5} color="#6366f1" />

        {/* Top accent light */}
        <directionalLight position={[0, 6, -1]} intensity={1} color="#ffffff" />

        {/* Bottom fill */}
        <directionalLight position={[0, -3, 2]} intensity={0.5} color="#8899bb" />

        <React.Suspense fallback={null}>
          <HTModel />
          <Particles count={400} />
          <ContactShadows
            position={[0, -1.2, 0]}
            opacity={0.4}
            scale={8}
            blur={3}
            far={3}
          />
          <Environment preset="studio" />
          <EffectComposer>
            <Bloom
              luminanceThreshold={0.6}
              luminanceSmoothing={0.1}
              intensity={0.8}
              mipmapBlur
            />
          </EffectComposer>
        </React.Suspense>
      </Canvas>
    </div>
  );
}
