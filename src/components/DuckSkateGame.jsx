import React, { Suspense, useRef, useState, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  PerspectiveCamera,
  OrbitControls,
  Environment,
  Float,
  Text,
  MeshDistortMaterial,
  GradientTexture,
  useGLTF
} from "@react-three/drei";
import * as THREE from "three";
import { DuckModel } from "./Duck";

// --- Constants ---
const ROAD_WIDTH = 12;
const GAME_SPEED_START = 15;
const SPAWN_INTERVAL = 1.2; // seconds

// --- Components ---

function ProceduralSkateboard() {
  return (
    <group>
      {/* Skateboard deck - red with texture */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.2, 0.15, 2.2]} />
        <meshStandardMaterial 
          color="#C41E3A" 
          metalness={0.3} 
          roughness={0.7}
        />
      </mesh>
      
      {/* Dark stripe on deck for grip */}
      <mesh position={[0, 0.08, 0]}>
        <boxGeometry args={[1.0, 0.02, 2.0]} />
        <meshStandardMaterial color="#333333" metalness={0} roughness={1} />
      </mesh>
      
      {/* Trucks - left front */}
      <mesh position={[-0.4, -0.15, 0.7]}>
        <boxGeometry args={[0.15, 0.15, 0.3]} />
        <meshStandardMaterial color="#444444" metalness={0.6} roughness={0.4} />
      </mesh>
      
      {/* Trucks - right front */}
      <mesh position={[0.4, -0.15, 0.7]}>
        <boxGeometry args={[0.15, 0.15, 0.3]} />
        <meshStandardMaterial color="#444444" metalness={0.6} roughness={0.4} />
      </mesh>
      
      {/* Trucks - left back */}
      <mesh position={[-0.4, -0.15, -0.7]}>
        <boxGeometry args={[0.15, 0.15, 0.3]} />
        <meshStandardMaterial color="#444444" metalness={0.6} roughness={0.4} />
      </mesh>
      
      {/* Trucks - right back */}
      <mesh position={[0.4, -0.15, -0.7]}>
        <boxGeometry args={[0.15, 0.15, 0.3]} />
        <meshStandardMaterial color="#444444" metalness={0.6} roughness={0.4} />
      </mesh>
      
      {/* Wheels - front left */}
      <mesh position={[-0.4, -0.3, 0.7]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.25, 0.25, 0.15, 32]} />
        <meshStandardMaterial 
          color="#1E90FF" 
          metalness={0.4} 
          roughness={0.6}
        />
      </mesh>
      
      {/* Wheels - front right */}
      <mesh position={[0.4, -0.3, 0.7]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.25, 0.25, 0.15, 32]} />
        <meshStandardMaterial 
          color="#1E90FF" 
          metalness={0.4} 
          roughness={0.6}
        />
      </mesh>
      
      {/* Wheels - back left */}
      <mesh position={[-0.4, -0.3, -0.7]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.25, 0.25, 0.15, 32]} />
        <meshStandardMaterial 
          color="#1E90FF" 
          metalness={0.4} 
          roughness={0.6}
        />
      </mesh>
      
      {/* Wheels - back right */}
      <mesh position={[0.4, -0.3, -0.7]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.25, 0.25, 0.15, 32]} />
        <meshStandardMaterial 
          color="#1E90FF" 
          metalness={0.4} 
          roughness={0.6}
        />
      </mesh>
      
      {/* Wheel hubs for detail */}
      <mesh position={[-0.4, -0.3, 0.7]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.2, 32]} />
        <meshStandardMaterial color="#333333" metalness={0.8} roughness={0.2} />
      </mesh>
      
      <mesh position={[0.4, -0.3, 0.7]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.2, 32]} />
        <meshStandardMaterial color="#333333" metalness={0.8} roughness={0.2} />
      </mesh>
      
      <mesh position={[-0.4, -0.3, -0.7]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.2, 32]} />
        <meshStandardMaterial color="#333333" metalness={0.8} roughness={0.2} />
      </mesh>
      
      <mesh position={[0.4, -0.3, -0.7]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.2, 32]} />
        <meshStandardMaterial color="#333333" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
}

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
    // Face the horizon (+Z)
    meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, Math.PI + tilt * 0.5, 0.1);

    // Skateboard wobble
    if (skateRef.current) {
      skateRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 10) * 0.05;
    }
  });

  return (
    <group ref={meshRef} position={[0, 0.6, 0]}>
      {/* Skateboard - Procedural Model */}
      <group ref={skateRef} position={[0, -0.4, 0]}>
        <ProceduralSkateboard />
      </group>

      {/* Realistic Duck Model */}
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <group position={[0, -0.35, 0]} scale={100} rotation={[0, Math.PI, 0]}>
          <DuckModel />
        </group>

        {/* Helmet (Adjusted for new head position) */}
        <mesh position={[0, 1.2, 0.15]} rotation={[-0.2, 0, 0]}>
          <sphereGeometry args={[0.48, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#2563eb" /> {/* Solid Blue */}
        </mesh>
        {/* Helmet Strap */}
        <mesh position={[0, 0.95, 0.15]} rotation={[0, 0, 0]}>
          <torusGeometry args={[0.46, 0.03, 16, 32, Math.PI]} rotation={[0, 0, Math.PI]} />
          <meshStandardMaterial color="#111" />
        </mesh>
      </Float>
    </group>
  );
}

function Obstacle({ type, position, onHit }) {
  const ref = useRef();
  const scarfColor = useMemo(() => Math.random() > 0.5 ? "#ef4444" : "#22c55e", []);

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
        <group>
          <mesh>
            <coneGeometry args={[1.0, 2.4, 16]} />
            <meshStandardMaterial color="#fb923c" />
          </mesh>
          <mesh position={[0, -0.2, 0]}>
            <cylinderGeometry args={[0.8, 0.9, 0.4, 16]} />
            <meshStandardMaterial color="white" />
          </mesh>
          <mesh position={[0, -1.1, 0]}>
            <boxGeometry args={[2, 0.2, 2]} />
            <meshStandardMaterial color="#fb923c" />
          </mesh>
        </group>
      )}
      {type === "ice" && (
        <group>
          <mesh position={[-0.6, 0, 0]} rotation={[0.2, 0, 0.2]}>
            <coneGeometry args={[0.8, 2.4, 6]} />
            <meshStandardMaterial color="#bae6fd" transparent opacity={0.9} />
          </mesh>
          <mesh position={[0.6, 0, 0.4]} rotation={[-0.2, 0, -0.1]}>
            <coneGeometry args={[0.6, 1.6, 6]} />
            <meshStandardMaterial color="#bae6fd" transparent opacity={0.9} />
          </mesh>
          <mesh position={[0, 0, -0.6]} rotation={[0.1, 0, 0]}>
            <coneGeometry args={[0.6, 2.0, 6]} />
            <meshStandardMaterial color="#bae6fd" transparent opacity={0.9} />
          </mesh>
        </group>
      )}
      {type === "penguin" && (
        <group scale={2.5}>
          <mesh position={[0, 0.3, 0]}>
            <sphereGeometry args={[0.4, 16, 16]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
          <mesh position={[0, 0.35, 0.1]}>
            <sphereGeometry args={[0.25, 16, 16]} />
            <meshStandardMaterial color="white" />
          </mesh>
          <mesh position={[0, 0.75, 0]}>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
          {/* Scarf */}
          <mesh position={[0, 0.55, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.25, 0.08, 16, 32]} />
            <meshStandardMaterial color={scarfColor} />
          </mesh>
          {/* Beak */}
          <mesh position={[0, 0.75, 0.3]}>
            <coneGeometry args={[0.05, 0.2, 4]} rotation={[Math.PI / 2, 0, 0]} />
            <meshStandardMaterial color="#f59e0b" />
          </mesh>
        </group>
      )}
      {type === "barrel" && (
        <group>
          <mesh position={[0, 1.0, 0]}>
            <cylinderGeometry args={[1.0, 1.0, 2.4, 16]} />
            <meshStandardMaterial color="#78350f" />
          </mesh>
          {/* Snow top */}
          <mesh position={[0, 2.3, 0]}>
            <cylinderGeometry args={[1.1, 1.0, 0.4, 16]} />
            <meshStandardMaterial color="white" />
          </mesh>
        </group>
      )}
      {type === "fish" && (
        <group rotation={[Math.PI / 2, 0, Math.random()]} scale={1.2}>
          <mesh>
            <sphereGeometry args={[0.6, 16, 8]} />
            <meshStandardMaterial color="#94a3b8" />
          </mesh>
          <mesh position={[-0.7, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <coneGeometry args={[0.3, 0.5, 3]} />
            <meshStandardMaterial color="#94a3b8" />
          </mesh>
        </group>
      )}
    </group>
  );
}

function IceFloor() {
  const ref = useRef();
  useFrame((state, delta) => {
    ref.current.offset.y += 0.5 * delta;
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

function GameLogic({ isGameOver, setIsGameOver, score, setScore, speed, setSpeed, targetX, obstacles, setObstacles, duckPos }) {
  const lastSpawn = useRef(0);

  useFrame((state, delta) => {
    if (isGameOver) return;

    setScore(s => s + delta * 10);
    setSpeed(1 + state.clock.elapsedTime * 0.01);

    // Spawn obstacles
    if (state.clock.elapsedTime - lastSpawn.current > SPAWN_INTERVAL / speed) {
      lastSpawn.current = state.clock.elapsedTime;
      const type = ["cone", "ice", "penguin", "barrel", "fish"][Math.floor(Math.random() * 5)];
      setObstacles(prev => [
        ...prev,
        {
          id: Math.random(),
          type,
          position: [(Math.random() - 0.5) * ROAD_WIDTH, 0.5, 60]
        }
      ]);
    }

    // Move and filter obstacles
    setObstacles(prev => {
      const moved = prev.map(o => ({
        ...o,
        position: [o.position[0], o.position[1], o.position[2] - GAME_SPEED_START * delta * speed]
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

      return moved.filter(o => o.position[2] > -15);
    });
  });

  return null;
}

export default function DuckSkateGame() {
  const [targetX, setTargetX] = useState(0);
  const [score, setScore] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [isGameOver, setIsGameOver] = useState(false);
  const [obstacles, setObstacles] = useState([]);
  const duckPos = useRef(0);
  const [aspect, setAspect] = useState(window.innerWidth / window.innerHeight);

  const handleInput = (clientX) => {
    const x = (clientX / window.innerWidth) * 2 - 1;
    const scaledX = x * (ROAD_WIDTH / 2);
    setTargetX(scaledX);
    duckPos.current = scaledX;
  };

  const handleMouseMove = (e) => handleInput(e.clientX);
  const handleTouchMove = (e) => {
    if (e.touches && e.touches[0]) {
      handleInput(e.touches[0].clientX);
    }
  };

  const handleResize = () => {
    setAspect(window.innerWidth / window.innerHeight);
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const cameraPosition = useMemo(() => {
    return aspect < 1 ? [0, 6, -15] : [0, 4, -12];
  }, [aspect]);

  return (
    <div className="game-shell" style={{ width: "100vw", height: "100vh", background: "#d8f3ff", touchAction: "none" }}>
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={cameraPosition} rotation={[0, Math.PI, 0]} fov={aspect < 1 ? 75 : 65} />
        <ambientLight intensity={0.7} />
        <pointLight position={[10, 10, 10]} intensity={1} castShadow />
        <Suspense fallback={null}>
          <GameLogic
            isGameOver={isGameOver}
            setIsGameOver={setIsGameOver}
            score={score}
            setScore={setScore}
            speed={speed}
            setSpeed={setSpeed}
            targetX={targetX}
            obstacles={obstacles}
            setObstacles={setObstacles}
            duckPos={duckPos}
          />
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
        <fog attach="fog" args={["#b9e7ff", 2, 120]} />
      </Canvas>

      <div className="hud">
        <div className="stat score">SCORE: {Math.floor(score)}</div>
        <div className="stat speed">SPEED: {speed.toFixed(1)}</div>
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
