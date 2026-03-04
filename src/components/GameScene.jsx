import React, { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Html } from "@react-three/drei";
import { DuckModel as Duck } from "./Duck";
import * as THREE from "three";

const OBSTACLE_SPAWN_MS = 1100;
const OBSTACLE_SPEED = 12;
const LANE_WIDTH = 8;
const COLLISION_DISTANCE = 1.8;

function IceFloor() {
  return (
    <mesh position={[0, -0.5, -40]} receiveShadow>
      <boxGeometry args={[80, 1, 220]} />
      <meshStandardMaterial color="#d9f3ff" roughness={0} metalness={0.5} />
    </mesh>
  );
}

function Skateboard() {
  return (
    <mesh position={[0, -0.35, 0]} castShadow receiveShadow>
      <boxGeometry args={[1.8, 0.2, 3.1]} />
      <meshStandardMaterial color="#1f2937" roughness={0.45} metalness={0.25} />
    </mesh>
  );
}

function Player({ duckXRef, gameOver }) {
  const groupRef = useRef();
  const { viewport } = useThree();

  useFrame((state, delta) => {
    if (!groupRef.current || gameOver) return;

    const targetX = state.mouse.x * (viewport.width / 2);
    const laneHalf = Math.min(LANE_WIDTH / 2, Math.max(1.6, viewport.width * 0.35));
    const clampedX = THREE.MathUtils.clamp(targetX, -laneHalf, laneHalf);

    groupRef.current.position.x = THREE.MathUtils.lerp(
      groupRef.current.position.x,
      clampedX,
      Math.min(1, 10 * delta)
    );

    duckXRef.current = groupRef.current.position.x;
  });

  return (
    <group ref={groupRef} position={[0, 0.7, 0]}>
      <Skateboard />
      <group position={[0, -0.28, 0]} scale={72} rotation={[0, Math.PI, 0]}>
        <Duck />
      </group>
    </group>
  );
}

function Obstacle({ type, position }) {
  if (type === "rock") {
    return (
      <mesh position={position} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.9, 0]} />
        <meshStandardMaterial color="#64748b" roughness={0.85} metalness={0.1} />
      </mesh>
    );
  }

  return (
    <group position={position}>
      <mesh position={[0, 1, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.6, 0.75, 1.9, 12]} />
        <meshStandardMaterial color="#111827" roughness={0.8} metalness={0.1} />
      </mesh>
      <mesh position={[0, 2.05, 0]} castShadow receiveShadow>
        <sphereGeometry args={[0.55, 16, 16]} />
        <meshStandardMaterial color="#111827" roughness={0.8} metalness={0.1} />
      </mesh>
      <mesh position={[0, 1.95, 0.42]} castShadow receiveShadow>
        <coneGeometry args={[0.1, 0.35, 4]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.7} metalness={0.1} />
      </mesh>
      <mesh position={[0, 1.1, 0.45]} castShadow receiveShadow>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.9} metalness={0.02} />
      </mesh>
    </group>
  );
}

function GameWorld() {
  const [obstacles, setObstacles] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [speed, setSpeed] = useState(1);
  const duckXRef = useRef(0);
  const spawnTimerRef = useRef(null);

  const resetGame = () => {
    setObstacles([]);
    setScore(0);
    setSpeed(1);
    setGameOver(false);
    duckXRef.current = 0;
  };

  const spawnObstacle = () => {
    setObstacles((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).slice(2),
        type: Math.random() > 0.5 ? "rock" : "penguin",
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

    setSpeed((prev) => Math.min(2.8, prev + delta * 0.04));
    setScore((prev) => prev + delta * 10);

    setObstacles((prev) => {
      const moved = prev
        .map((obstacle) => ({ ...obstacle, z: obstacle.z + OBSTACLE_SPEED * speed * delta }))
        .filter((obstacle) => obstacle.z < 12);

      const collided = moved.some((obstacle) => {
        const dx = obstacle.x - duckXRef.current;
        const dz = obstacle.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        return distance < COLLISION_DISTANCE;
      });

      if (collided) {
        setGameOver(true);
      }

      return moved;
    });
  });

  const scoreLabel = useMemo(() => Math.floor(score), [score]);

  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight
        position={[7, 12, 5]}
        intensity={1.3}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      <Environment preset="city" />
      <IceFloor />
      <Player duckXRef={duckXRef} gameOver={gameOver} />

      {obstacles.map((obstacle) => (
        <Obstacle key={obstacle.id} type={obstacle.type} position={[obstacle.x, 0, obstacle.z]} />
      ))}

      <HtmlScore score={scoreLabel} speed={speed} gameOver={gameOver} onRestart={resetGame} />
    </>
  );
}

function HtmlScore({ score, speed, gameOver, onRestart }) {
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
            color: "#facc15",
            fontWeight: 800,
            fontSize: "clamp(20px, 5vw, 46px)",
            fontFamily: "system-ui, sans-serif",
            textShadow: "0 2px 4px rgba(0,0,0,0.35)",
            pointerEvents: "none",
          }}
        >
          <span>SCORE: {score}</span>
          <span style={{ color: "#7dd3fc" }}>SPEED: {speed.toFixed(1)}</span>
        </div>

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
      camera={{ fov: 62, position: [0, 5.5, 12] }}
      style={{ width: "100vw", height: "100vh" }}
    >
      <color attach="background" args={["#7aa9c7"]} />
      <fog attach="fog" args={["#7aa9c7", 25, 150]} />
      <GameWorld />
    </Canvas>
  );
}
