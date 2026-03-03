import React, { Suspense, useRef, useState, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { 
  PerspectiveCamera, 
  OrbitControls, 
  Environment, 
  Float, 
  Text,
  MeshDistortMaterial,
  GradientTexture
} from "@react-three/drei";
import * as THREE from "three";

// --- Constants ---
const ROAD_WIDTH = 12;
const GAME_SPEED_START = 15;
const SPAWN_INTERVAL = 1.2; // seconds

// --- Components ---

function Duck({ targetX, isGameOver }) {
  const meshRef = useRef();
  const skateRef = useRef();
  
  useFrame((state, delta) => {
    if (isGameOver) return;
    
    // Smooth movement
    meshRef.current.position.x = THREE.MathUtils.lerp(
      meshRef.current.position.x,
      targetX,
      0.1
    );
    
    // Tilt based on movement
    const tilt = (targetX - meshRef.current.position.x) * 0.3;
    meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, -tilt, 0.1);
    meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, tilt * 0.5, 0.1);

    // Skateboard wobble
    if (skateRef.current) {
      skateRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 10) * 0.05;
    }
  });

  return (
    <group ref={meshRef} position={[0, 0.6, 0]}>
      {/* Skateboard */}
      <mesh ref={skateRef} position={[0, -0.4, 0]}>
        <boxGeometry args={[1.2, 0.15, 2.2]} />
        <meshStandardMaterial color="#e74c3c" />
        {/* Wheels */}
        <mesh position={[-0.4, -0.15, 0.7]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 0.2, 16]} />
          <meshStandardMaterial color="#333" />
        </mesh>
        <mesh position={[0.4, -0.15, 0.7]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 0.2, 16]} />
          <meshStandardMaterial color="#333" />
        </mesh>
        <mesh position={[-0.4, -0.15, -0.7]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 0.2, 16]} />
          <meshStandardMaterial color="#333" />
        </mesh>
        <mesh position={[0.4, -0.15, -0.7]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 0.2, 16]} />
          <meshStandardMaterial color="#333" />
        </mesh>
      </mesh>

      {/* Duck Body */}
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <mesh position={[0, 0.4, 0]}>
          <sphereGeometry args={[0.6, 32, 32]} />
          <meshStandardMaterial color="#f1c40f" />
        </mesh>
        {/* Head */}
        <mesh position={[0, 1.1, 0.2]}>
          <sphereGeometry args={[0.45, 32, 32]} />
          <meshStandardMaterial color="#f1c40f" />
        </mesh>
        {/* Beak */}
        <mesh position={[0, 1.0, 0.65]}>
          <boxGeometry args={[0.3, 0.15, 0.4]} />
          <meshStandardMaterial color="#e67e22" />
        </mesh>
        {/* Helmet */}
        <mesh position={[0, 1.3, 0.2]} rotation={[-0.2, 0, 0]}>
          <sphereGeometry args={[0.48, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#3498db" />
        </mesh>
        {/* Eyes */}
        <mesh position={[-0.15, 1.15, 0.58]}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshStandardMaterial color="#000" />
        </mesh>
        <mesh position={[0.15, 1.15, 0.58]}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshStandardMaterial color="#000" />
        </mesh>
      </Float>
    </group>
  );
}

function Obstacle({ type, position, onHit }) {
  const ref = useRef();
  
  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.position.z += 15 * delta; // Speed
      if (ref.current.position.z > 5) {
        // Recycle logic handled by parent
      }
    }
  });

  return (
    <group ref={ref} position={position}>
      {type === "cone" && (
        <mesh rotation={[0, 0, 0]}>
          <coneGeometry args={[0.5, 1.2, 16]} />
          <meshStandardMaterial color="#e67e22" />
          <mesh position={[0, -0.55, 0]}>
            <boxGeometry args={[1, 0.1, 1]} />
            <meshStandardMaterial color="#e67e22" />
          </mesh>
        </mesh>
      )}
      {type === "ice" && (
        <mesh rotation={[Math.random(), Math.random(), Math.random()]}>
          <icosahedronGeometry args={[0.6, 0]} />
          <meshStandardMaterial color="#7ed6df" transparent opacity={0.8} />
        </mesh>
      )}
      {type === "penguin" && (
        <group scale={1.2}>
          <mesh position={[0, 0.3, 0]}>
            <sphereGeometry args={[0.4, 16, 16]} />
            <meshStandardMaterial color="#2c3e50" />
          </mesh>
          <mesh position={[0, 0.4, 0.1]}>
            <sphereGeometry args={[0.25, 16, 16]} />
            <meshStandardMaterial color="white" />
          </mesh>
          <mesh position={[0, 0.75, 0]}>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshStandardMaterial color="#2c3e50" />
          </mesh>
          {/* Beak */}
          <mesh position={[0, 0.75, 0.3]}>
            <coneGeometry args={[0.05, 0.2, 4]} rotation={[Math.PI / 2, 0, 0]} />
            <meshStandardMaterial color="#f39c12" />
          </mesh>
        </group>
      )}
    </group>
  );
}

function IceFloor() {
  const ref = useRef();
  useFrame((state, delta) => {
    ref.current.offset.y -= 0.5 * delta;
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[100, 100]} />
      <meshStandardMaterial>
        <GradientTexture
          ref={ref}
          stops={[0, 0.5, 1]}
          colors={["#a5d6f7", "#ffffff", "#a5d6f7"]}
          size={1024}
        />
      </meshStandardMaterial>
    </mesh>
  );
}

function EnvironmentDecorations() {
  return (
    <>
      <mesh position={[-15, 0, -50]}>
        <coneGeometry args={[4, 12, 8]} />
        <meshStandardMaterial color="#2d3436" />
      </mesh>
      <mesh position={[18, 0, -80]}>
        <coneGeometry args={[5, 15, 8]} />
        <meshStandardMaterial color="#2d3436" />
      </mesh>
      {/* Igloo-like decoration */}
      <mesh position={[25, 0, -30]}>
        <sphereGeometry args={[6, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#f0f0f0" />
      </mesh>
    </>
  );
}

export default function DuckSkateGame() {
  const [targetX, setTargetX] = useState(0);
  const [score, setScore] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [isGameOver, setIsGameOver] = useState(false);
  const [obstacles, setObstacles] = useState([]);
  const lastSpawn = useRef(0);
  const duckPos = useRef(0);

  const handleMouseMove = (e) => {
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    setTargetX(x * (ROAD_WIDTH / 2));
    duckPos.current = x * (ROAD_WIDTH / 2);
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useFrame((state, delta) => {
    if (isGameOver) return;

    setScore(s => s + delta * 10);
    setSpeed(1 + state.clock.elapsedTime * 0.01);

    // Spawn obstacles
    if (state.clock.elapsedTime - lastSpawn.current > SPAWN_INTERVAL / speed) {
      lastSpawn.current = state.clock.elapsedTime;
      const type = ["cone", "ice", "penguin"][Math.floor(Math.random() * 3)];
      setObstacles(prev => [
        ...prev,
        {
          id: Math.random(),
          type,
          position: [(Math.random() - 0.5) * ROAD_WIDTH, 0.5, -60]
        }
      ]);
    }

    // Move and filter obstacles
    setObstacles(prev => {
      const moved = prev.map(o => ({
        ...o,
        position: [o.position[0], o.position[1], o.position[2] + GAME_SPEED_START * delta * speed]
      }));

      // Collision detection (simple distance based)
      moved.forEach(o => {
        const dx = o.position[0] - duckPos.current;
        const dz = o.position[2] - 0; // Duck is at Z=0
        const distance = Math.sqrt(dx * dx + dz * dz);
        if (distance < 1.0) {
          setIsGameOver(true);
        }
      });

      return moved.filter(o => o.position[2] < 10);
    });
  });

  return (
    <div className="game-shell" style={{ width: "100vw", height: "100vh", background: "#d8f3ff" }}>
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 5, 8]} fov={50} />
        <ambientLight intensity={0.7} />
        <pointLight position={[10, 10, 10]} intensity={1} castShadow />
        <Suspense fallback={null}>
          <Duck targetX={targetX} isGameOver={isGameOver} />
          {obstacles.map(o => (
            <Obstacle key={o.id} type={o.type} position={o.position} />
          ))}
          <IceFloor />
          <EnvironmentDecorations />
          <Environment preset="city" />
        </Suspense>
        {/* Sky background */}
        <color attach="background" args={["#b9e7ff"]} />
        <fog attach="fog" args={["#b9e7ff", 20, 100]} />
      </Canvas>

      <div className="hud">
        <div className="stat">SCORE: {Math.floor(score)}</div>
        <div className="stat">SPEED: {speed.toFixed(1)}</div>
      </div>

      {isGameOver && (
        <div className="overlay">
          <div className="panel">
            <h1>CRASHED!</h1>
            <p>Final Score: {Math.floor(score)}</p>
            <button onClick={() => window.location.reload()}>RESTART</button>
          </div>
        </div>
      )}
    </div>
  );
}
