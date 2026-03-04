import React, { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Html, Trail } from "@react-three/drei";
import { DuckModel as Duck } from "./Duck";
import * as THREE from "three";

const OBSTACLE_SPAWN_MS = 1100;
const OBSTACLE_SPEED = 12;
const LANE_WIDTH = 8;
const COLLISION_DISTANCE = 1.8;
const NEAR_MISS_DISTANCE = 2.5;
const NEAR_MISS_BONUS = 25;

function IceFloor() {
  const textureRef = useRef();
  
  useFrame((state) => {
    if (textureRef.current) {
      textureRef.current.offset.y = (state.clock.elapsedTime * 0.5) % 1;
    }
  });

  return (
    <group>
      {/* Main ice surface */}
      <mesh position={[0, -0.5, -40]} receiveShadow rotation={[-Math.PI * 0.02, 0, 0]}>
        <planeGeometry args={[85, 220, 40, 80]} />
        <meshStandardMaterial 
          color="#a8daff"
          roughness={0.15}
          metalness={0.3}
          emissive="#4db8ff"
          emissiveIntensity={0.08}
        />
      </mesh>
      
      {/* Ice scratches/tracks pattern */}
      {[...Array(30)].map((_, i) => (
        <mesh 
          key={i} 
          position={[
            THREE.MathUtils.randFloatSpread(70),
            -0.45,
            -120 + i * 8
          ]}
          rotation={[-Math.PI / 2, 0, THREE.MathUtils.randFloat(-0.2, 0.2)]}
        >
          <planeGeometry args={[THREE.MathUtils.randFloat(1, 3), THREE.MathUtils.randFloat(4, 8)]} />
          <meshBasicMaterial color="#cce9ff" transparent opacity={0.3} />
        </mesh>
      ))}
      
      {/* Snow patches on sides */}
      {[...Array(12)].map((_, i) => (
        <group key={`snow-${i}`}>
          <mesh position={[-38, -0.3, -100 + i * 18]} rotation={[0, 0.3, 0]}>
            <dodecahedronGeometry args={[2, 0]} />
            <meshStandardMaterial color="#ffffff" roughness={0.9} />
          </mesh>
          <mesh position={[38, -0.3, -95 + i * 18]} rotation={[0, -0.3, 0]}>
            <dodecahedronGeometry args={[2.2, 0]} />
            <meshStandardMaterial color="#ffffff" roughness={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Skateboard() {
  return (
    <group position={[0, -0.35, 0]}>
      {/* Skateboard deck */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.8, 0.15, 3.1]} />
        <meshStandardMaterial color="#ef4444" roughness={0.6} />
      </mesh>
      {/* Yellow stripes */}
      <mesh position={[0, 0.08, 0.8]} castShadow>
        <boxGeometry args={[1.9, 0.02, 0.3]} />
        <meshStandardMaterial color="#fbbf24" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.08, -0.8]} castShadow>
        <boxGeometry args={[1.9, 0.02, 0.3]} />
        <meshStandardMaterial color="#fbbf24" roughness={0.5} />
      </mesh>
      {/* Wheels */}
      <mesh position={[-0.6, -0.15, 1.2]} castShadow>
        <cylinderGeometry args={[0.15, 0.15, 0.2, 8]} />
        <meshStandardMaterial color="#1e3a8a" roughness={0.3} />
      </mesh>
      <mesh position={[0.6, -0.15, 1.2]} castShadow>
        <cylinderGeometry args={[0.15, 0.15, 0.2, 8]} />
        <meshStandardMaterial color="#1e3a8a" roughness={0.3} />
      </mesh>
      <mesh position={[-0.6, -0.15, -1.2]} castShadow>
        <cylinderGeometry args={[0.15, 0.15, 0.2, 8]} />
        <meshStandardMaterial color="#1e3a8a" roughness={0.3} />
      </mesh>
      <mesh position={[0.6, -0.15, -1.2]} castShadow>
        <cylinderGeometry args={[0.15, 0.15, 0.2, 8]} />
        <meshStandardMaterial color="#1e3a8a" roughness={0.3} />
      </mesh>
    </group>
  );
}

function Player({ duckXRef, gameOver, cameraShakeRef }) {
  const groupRef = useRef();
  const duckGroupRef = useRef();
  const { viewport } = useThree();
  const velocityRef = useRef(0);

  useFrame((state, delta) => {
    if (!groupRef.current || gameOver) return;

    const targetX = state.mouse.x * (viewport.width / 2);
    const laneHalf = Math.min(LANE_WIDTH / 2, Math.max(1.6, viewport.width * 0.35));
    const clampedX = THREE.MathUtils.clamp(targetX, -laneHalf, laneHalf);

    const prevX = groupRef.current.position.x;
    groupRef.current.position.x = THREE.MathUtils.lerp(
      prevX,
      clampedX,
      Math.min(1, 10 * delta)
    );

    // Calculate velocity for tilt effect
    velocityRef.current = (groupRef.current.position.x - prevX) / delta;
    
    // Duck tilting based on movement
    if (duckGroupRef.current) {
      const tiltAmount = THREE.MathUtils.clamp(velocityRef.current * -0.015, -0.3, 0.3);
      duckGroupRef.current.rotation.z = THREE.MathUtils.lerp(
        duckGroupRef.current.rotation.z,
        tiltAmount,
        8 * delta
      );
    }

    duckXRef.current = groupRef.current.position.x;
  });

  return (
    <group ref={groupRef} position={[0, 0.7, 0]}>
      <Skateboard />
      <group ref={duckGroupRef} position={[0, -0.28, 0]} scale={72} rotation={[0, Math.PI, 0]}>
        <Trail
          width={1.2}
          length={6}
          color="#60a5fa"
          attenuation={(t) => t * t}
        >
          <Duck />
        </Trail>
      </group>
      {/* Speed particles */}
      <SpeedParticles gameOver={gameOver} />
    </group>
  );
}

function SpeedParticles({ gameOver }) {
  const particlesRef = useRef();
  const particleCount = 20;
  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = THREE.MathUtils.randFloatSpread(4);
      pos[i * 3 + 1] = THREE.MathUtils.randFloat(-0.5, 1.5);
      pos[i * 3 + 2] = THREE.MathUtils.randFloat(-8, 2);
    }
    return pos;
  }, []);

  useFrame((_, delta) => {
    if (!particlesRef.current || gameOver) return;
    const positions = particlesRef.current.attributes.position.array;
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3 + 2] += 18 * delta;
      if (positions[i * 3 + 2] > 2) {
        positions[i * 3 + 2] = -8;
        positions[i * 3] = THREE.MathUtils.randFloatSpread(4);
        positions[i * 3 + 1] = THREE.MathUtils.randFloat(-0.5, 1.5);
      }
    }
    particlesRef.current.attributes.position.needsUpdate = true;
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          ref={particlesRef}
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.15} color="#bae6fd" transparent opacity={0.6} />
    </points>
  );
}

function Obstacle({ type, position }) {
  const meshRef = useRef();

  // Bobbing animation
  useFrame((state) => {
    if (meshRef.current && type !== "barrel") {
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.12;
    }
  });

  if (type === "barrel") {
    return (
      <group position={position}>
        {/* Wooden barrel with snow */}
        <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.7, 0.8, 1.6, 12]} />
          <meshStandardMaterial color="#92400e" roughness={0.8} />
        </mesh>
        {/* Metal bands */}
        <mesh position={[0, 1.2, 0]} castShadow>
          <cylinderGeometry args={[0.72, 0.72, 0.1, 12]} />
          <meshStandardMaterial color="#d97706" roughness={0.4} metalness={0.6} />
        </mesh>
        <mesh position={[0, 0.4, 0]} castShadow>
          <cylinderGeometry args={[0.82, 0.82, 0.1, 12]} />
          <meshStandardMaterial color="#d97706" roughness={0.4} metalness={0.6} />
        </mesh>
        {/* Snow cap */}
        <mesh position={[0, 1.65, 0]} castShadow receiveShadow rotation={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.75, 0.6, 0.3, 8]} />
          <meshStandardMaterial color="#ffffff" roughness={0.95} />
        </mesh>
      </group>
    );
  }

  if (type === "cone") {
    return (
      <group ref={meshRef} position={position}>
        {/* Traffic cone base */}
        <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.1, 0.15, 1.1]} />
          <meshStandardMaterial color="#fb923c" roughness={0.6} />
        </mesh>
        {/* Cone body */}
        <mesh position={[0, 1.0, 0]} castShadow receiveShadow>
          <coneGeometry args={[0.5, 1.6, 8]} />
          <meshStandardMaterial color="#f97316" roughness={0.5} />
        </mesh>
        {/* White stripes */}
        <mesh position={[0, 0.6, 0]} castShadow>
          <cylinderGeometry args={[0.52, 0.46, 0.25, 8]} />
          <meshStandardMaterial color="#ffffff" roughness={0.6} />
        </mesh>
        <mesh position={[0, 1.3, 0]} castShadow>
          <cylinderGeometry args={[0.32, 0.36, 0.22, 8]} />
          <meshStandardMaterial color="#ffffff" roughness={0.6} />
        </mesh>
      </group>
    );
  }

  if (type === "iceberg") {
    return (
      <group ref={meshRef} position={position}>
        {/* Multi-layered iceberg */}
        <mesh position={[0, 0.6, 0]} castShadow receiveShadow rotation={[0, 0.7, 0]}>
          <coneGeometry args={[1.0, 1.2, 4]} />
          <meshStandardMaterial color="#bfdbfe" roughness={0.2} metalness={0.3} />
        </mesh>
        <mesh position={[0.2, 1.2, -0.1]} castShadow receiveShadow rotation={[0, -0.5, 0]}>
          <coneGeometry args={[0.6, 0.9, 4]} />
          <meshStandardMaterial color="#dbeafe" roughness={0.2} metalness={0.3} />
        </mesh>
        <mesh position={[-0.1, 1.7, 0.1]} castShadow receiveShadow rotation={[0, 1.2, 0]}>
          <coneGeometry args={[0.35, 0.6, 4]} />
          <meshStandardMaterial color="#eff6ff" roughness={0.15} metalness={0.4} />
        </mesh>
        {/* Sparkle effect */}
        <mesh position={[0.3, 1.8, 0]} rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[0.1, 0.4, 0.1]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
        </mesh>
      </group>
    );
  }

  // Penguin - improved cartoon style
  return (
    <group ref={meshRef} position={position}>
      {/* Body */}
      <mesh position={[0, 1, 0]} castShadow receiveShadow>
        <capsuleGeometry args={[0.6, 1.2, 8, 16]} />
        <meshStandardMaterial color="#0f172a" roughness={0.6} />
      </mesh>
      {/* White belly */}
      <mesh position={[0, 1, 0.55]} castShadow receiveShadow>
        <capsuleGeometry args={[0.45, 0.9, 8, 16]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.7} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 2.05, 0]} castShadow receiveShadow>
        <sphereGeometry args={[0.55, 16, 16]} />
        <meshStandardMaterial color="#0f172a" roughness={0.6} />
      </mesh>
      {/* White face */}
      <mesh position={[0, 2.0, 0.48]} castShadow receiveShadow>
        <sphereGeometry args={[0.38, 12, 12]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.7} />
      </mesh>
      {/* Orange beak */}
      <mesh position={[0, 1.95, 0.72]} castShadow receiveShadow rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.12, 0.4, 8]} />
        <meshStandardMaterial color="#fb923c" roughness={0.6} />
      </mesh>
      {/* Eyes */}
      <mesh position={[-0.15, 2.15, 0.5]} castShadow>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      <mesh position={[0.15, 2.15, 0.5]} castShadow>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      {/* Red/Green scarf (alternate) */}
      <mesh position={[0, 1.7, 0]} castShadow receiveShadow rotation={[0, 0, 0]}>
        <torusGeometry args={[0.62, 0.15, 8, 12]} />
        <meshStandardMaterial color={Math.random() > 0.5 ? "#ef4444" : "#22c55e"} roughness={0.8} />
      </mesh>
      {/* Feet */}
      <mesh position={[-0.25, 0.1, 0.35]} castShadow receiveShadow rotation={[-0.3, -0.3, 0]}>
        <boxGeometry args={[0.25, 0.1, 0.4]} />
        <meshStandardMaterial color="#fb923c" roughness={0.7} />
      </mesh>
      <mesh position={[0.25, 0.1, 0.35]} castShadow receiveShadow rotation={[-0.3, 0.3, 0]}>
        <boxGeometry args={[0.25, 0.1, 0.4]} />
        <meshStandardMaterial color="#fb923c" roughness={0.7} />
      </mesh>
    </group>
  );
}

function BackgroundElements() {
  return (
    <group>
      {/* Pine trees on left side */}
      {[...Array(8)].map((_, i) => (
        <group key={`tree-left-${i}`} position={[-42, 0, -110 + i * 25]}>
          <mesh position={[0, 2, 0]} castShadow>
            <coneGeometry args={[2, 3, 6]} />
            <meshStandardMaterial color="#065f46" roughness={0.8} />
          </mesh>
          <mesh position={[0, 3.5, 0]} castShadow>
            <coneGeometry args={[1.6, 2.5, 6]} />
            <meshStandardMaterial color="#047857" roughness={0.8} />
          </mesh>
          <mesh position={[0, 4.8, 0]} castShadow>
            <coneGeometry args={[1.2, 2, 6]} />
            <meshStandardMaterial color="#059669" roughness={0.8} />
          </mesh>
          {/* Snow on tree */}
          <mesh position={[0, 5.5, 0]}>
            <sphereGeometry args={[0.6, 8, 8]} />
            <meshStandardMaterial color="#ffffff" roughness={0.9} />
          </mesh>
          {/* Tree trunk */}
          <mesh position={[0, 0.5, 0]} castShadow>
            <cylinderGeometry args={[0.4, 0.5, 1, 8]} />
            <meshStandardMaterial color="#78350f" roughness={0.9} />
          </mesh>
        </group>
      ))}
      
      {/* Igloos on right side */}
      {[...Array(4)].map((_, i) => (
        <group key={`igloo-${i}`} position={[43, 0, -105 + i * 35]}>
          <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
            <sphereGeometry args={[2, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#e0f2fe" roughness={0.6} />
          </mesh>
          {/* Igloo entrance */}
          <mesh position={[0, 0.6, 1.8]} castShadow>
            <boxGeometry args={[1, 1.2, 0.3]} />
            <meshStandardMaterial color="#0c4a6e" roughness={0.3} />
          </mesh>
          {/* Ice blocks detail */}
          {[...Array(6)].map((_, j) => (
            <mesh 
              key={j} 
              position={[
                Math.cos(j * Math.PI / 3) * 1.9,
                0.6,
                Math.sin(j * Math.PI / 3) * 1.9
              ]}
            >
              <boxGeometry args={[0.4, 0.3, 0.3]} />
              <meshStandardMaterial color="#bae6fd" roughness={0.5} transparent opacity={0.7} />
            </mesh>
          ))}
        </group>
      ))}
      
      {/* Warning signs */}
      {[...Array(6)].map((_, i) => (
        <group key={`sign-${i}`} position={[
          i % 2 === 0 ? 35 : -35,
          0,
          -100 + i * 30
        ]}>
          <mesh position={[0, 1.5, 0]} castShadow>
            <boxGeometry args={[0.15, 2.5, 0.15]} />
            <meshStandardMaterial color="#78716c" roughness={0.7} />
          </mesh>
          <mesh position={[0, 2.8, 0]} castShadow rotation={[0, Math.PI / 4, 0]}>
            <boxGeometry args={[1, 1, 0.1]} />
            <meshStandardMaterial color="#fbbf24" roughness={0.4} />
          </mesh>
          <mesh position={[0, 2.8, 0.06]} castShadow rotation={[0, Math.PI / 4, 0]}>
            <coneGeometry args={[0.15, 0.6, 3]} />
            <meshStandardMaterial color="#000000" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function CameraRig({ shakeRef }) {
  const { camera } = useThree();
  const originalPos = useRef([0, 5.5, 12]);

  useFrame((_, delta) => {
    if (shakeRef.current > 0) {
      camera.position.x = originalPos.current[0] + (Math.random() - 0.5) * shakeRef.current;
      camera.position.y = originalPos.current[1] + (Math.random() - 0.5) * shakeRef.current;
      shakeRef.current = Math.max(0, shakeRef.current - delta * 3);
    } else {
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, originalPos.current[0], 5 * delta);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, originalPos.current[1], 5 * delta);
    }
  });

  return null;
}

function GameWorld() {
  const [obstacles, setObstacles] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [combo, setCombo] = useState(0);
  const duckXRef = useRef(0);
  const spawnTimerRef = useRef(null);
  const cameraShakeRef = useRef(0);
  const nearMissTrackedRef = useRef(new Set());

  const resetGame = () => {
    setObstacles([]);
    setScore(0);
    setSpeed(1);
    setCombo(0);
    setGameOver(false);
    duckXRef.current = 0;
    cameraShakeRef.current = 0;
    nearMissTrackedRef.current.clear();
  };

  const spawnObstacle = () => {
    // Match reference image obstacle types
    const types = ["barrel", "penguin", "cone", "iceberg"];
    const weights = [0.25, 0.35, 0.25, 0.15];
    const random = Math.random();
    let sum = 0;
    let selectedType = types[0];
    
    for (let i = 0; i < types.length; i++) {
      sum += weights[i];
      if (random < sum) {
        selectedType = types[i];
        break;
      }
    }

    setObstacles((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).slice(2),
        type: selectedType,
        x: THREE.MathUtils.randFloatSpread(LANE_WIDTH),
        z: -95,
      },
    ]);
  };

  useEffect(() => {
    if (gameOver) return;

    spawnTimerRef.current = setInterval(spawnObstacle, OBSTACLE_SPAWN_MS);
    return () => clearInterval(spawnTimerRef.current);
  }, [gameOver]);

  useFrame((_, delta) => {
    if (gameOver) return;

    // Improved difficulty curve - exponential growth
    setSpeed((prev) => Math.min(3.2, prev + delta * 0.06));
    setScore((prev) => prev + delta * 10 * speed);

    setObstacles((prev) => {
      const moved = prev
        .map((obstacle) => ({ ...obstacle, z: obstacle.z + OBSTACLE_SPEED * speed * delta }))
        .filter((obstacle) => obstacle.z < 12);

      let hasCollision = false;
      let nearMissCount = 0;

      moved.forEach((obstacle) => {
        const dx = obstacle.x - duckXRef.current;
        const dz = obstacle.z;
        const distance = Math.sqrt(dx * dx + dz * dz);

        // Collision detection
        if (distance < COLLISION_DISTANCE) {
          hasCollision = true;
        }
        // Near miss bonus
        else if (
          distance < NEAR_MISS_DISTANCE &&
          obstacle.z > -1 &&
          obstacle.z < 3 &&
          !nearMissTrackedRef.current.has(obstacle.id)
        ) {
          nearMissTrackedRef.current.add(obstacle.id);
          nearMissCount++;
        }
      });

      if (hasCollision) {
        cameraShakeRef.current = 0.8;
        setGameOver(true);
      }

      if (nearMissCount > 0) {
        setScore((s) => s + NEAR_MISS_BONUS * nearMissCount);
        setCombo((c) => c + nearMissCount);
        cameraShakeRef.current = 0.15;
      }

      return moved;
    });
  });

  const scoreLabel = useMemo(() => Math.floor(score), [score]);

  return (
    <>
      <CameraRig shakeRef={cameraShakeRef} />
      
      {/* Bright cartoon lighting */}
      <ambientLight intensity={0.7} />
      <directionalLight
        position={[10, 15, 8]}
        intensity={1.8}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
      />
      
      {/* Rim light for depth */}
      <directionalLight position={[-8, 10, -5]} intensity={0.4} color="#93c5fd" />
      
      {/* Fill light */}
      <hemisphereLight intensity={0.3} color="#dbeafe" groundColor="#7dd3fc" />

      <BackgroundElements />
      <IceFloor />
      <Player duckXRef={duckXRef} gameOver={gameOver} cameraShakeRef={cameraShakeRef} />

      {obstacles.map((obstacle) => (
        <Obstacle key={obstacle.id} type={obstacle.type} position={[obstacle.x, 0, obstacle.z]} />
      ))}

      <HtmlScore score={scoreLabel} speed={speed} combo={combo} gameOver={gameOver} onRestart={resetGame} />
    </>
  );
}

function HtmlScore({ score, speed, combo, gameOver, onRestart }) {
  return (
    <Html fullscreen>
      <>
        <div
          style={{
            position: "fixed",
            top: "max(10px, env(safe-area-inset-top))",
            left: "clamp(12px, 4vw, 28px)",
            right: "clamp(12px, 4vw, 28px)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            color: "#facc15",
            fontWeight: 800,
            fontSize: "clamp(20px, 5vw, 46px)",
            fontFamily: "system-ui, sans-serif",
            textShadow: "0 2px 4px rgba(0,0,0,0.35)",
            pointerEvents: "none",
          }}
        >
          <div>
            <div>SCORE: {score}</div>
            {combo > 0 && (
              <div
                style={{
                  fontSize: "clamp(14px, 3vw, 24px)",
                  color: "#22c55e",
                  marginTop: "clamp(2px, 0.5vw, 6px)",
                  animation: "pulse 0.5s ease-in-out",
                }}
              >
                +{combo} NEAR MISS!
              </div>
            )}
          </div>
          <span style={{ color: "#7dd3fc" }}>SPEED: {speed.toFixed(1)}x</span>
        </div>

        <style>{`
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.1); opacity: 0.8; }
          }
        `}</style>

        {gameOver && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(15, 23, 42, 0.35)",
              pointerEvents: "auto",
              padding: "clamp(12px, 4vw, 24px)",
            }}
          >
            <div
              style={{
                width: "min(520px, 92vw)",
                borderRadius: 14,
                padding: "clamp(14px, 3vw, 20px) clamp(14px, 4vw, 24px)",
                background: "#eff6ff",
                border: "2px solid #7dd3fc",
                textAlign: "center",
                fontFamily: "system-ui, sans-serif",
                boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
              }}
            >
              <div style={{ fontSize: "clamp(30px, 9vw, 56px)", fontWeight: 900, color: "#1e3a8a", lineHeight: 1 }}>CRASHED!</div>
              <div style={{ marginTop: 8, fontSize: "clamp(22px, 6.5vw, 42px)", fontWeight: 800, color: "#1e40af" }}>Final Score: {score}</div>
              <button
                onClick={onRestart}
                style={{
                  marginTop: 14,
                  border: "none",
                  borderRadius: 10,
                  background: "#3b82f6",
                  color: "white",
                  fontWeight: 800,
                  fontSize: "clamp(14px, 3.5vw, 18px)",
                  padding: "clamp(8px, 2.4vw, 12px) clamp(14px, 4vw, 22px)",
                  cursor: "pointer",
                }}
              >
                RESTART
              </button>
            </div>
          </div>
        )}
      </>
    </Html>
  );
}

export default function GameScene() {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{ 
        antialias: true, 
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.2
      }}
      camera={{ fov: 62, position: [0, 5.5, 12] }}
      style={{ width: "100vw", height: "100vh" }}
    >
      {/* Sky gradient - bright cartoon style */}
      <color attach="background" args={["#60a5fa"]} />
      <fog attach="fog" args={["#93c5fd", 30, 160]} />
      <GameWorld />
    </Canvas>
  );
}
