import { useEffect, useRef, useState } from "react";

const DUCK_Y_OFFSET = 120;
const BASE_SPAWN_MS = 850;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function initGameState(width, height) {
  return {
    duck: {
      x: width / 2,
      y: height - DUCK_Y_OFFSET,
      targetX: width / 2,
      tilt: 0,
      lastDx: 0,
      radius: 26,
    },
    obstacles: [],
    particles: [],
    speed: 3.2,
    score: 0,
    spawnTimer: 0,
    animationFrameId: null,
    gameOver: false,
    lastTime: 0,
    width,
    height,
  };
}

function createObstacle(width) {
  const type = Math.random() < 0.55 ? "rock" : "penguin";
  const size = type === "rock" ? 42 : 38;
  return {
    type,
    x: 30 + Math.random() * (width - 60),
    y: -size,
    size,
    swayPhase: Math.random() * Math.PI * 2,
  };
}

function createSkateParticle(x, y) {
  const spread = (Math.random() - 0.5) * 1.4;
  return {
    x,
    y,
    vx: spread,
    vy: 1.2 + Math.random() * 1.8,
    life: 24 + Math.random() * 14,
    maxLife: 38,
  };
}

function drawBackground(ctx, width, height, timeSec) {
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, "#d8f3ff");
  sky.addColorStop(1, "#b9e7ff");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "rgba(170, 220, 255, 0.35)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 10; i += 1) {
    const baseX = ((i * 140 + timeSec * 130) % (width + 220)) - 110;
    ctx.beginPath();
    ctx.moveTo(baseX, 0);
    ctx.lineTo(baseX - 120, height);
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(255, 255, 255, 0.22)";
  for (let i = 0; i < 8; i += 1) {
    const x = (i * 180 + timeSec * 60) % (width + 200) - 100;
    const y = 80 + i * 70;
    ctx.beginPath();
    ctx.ellipse(x, y, 75, 16, -0.12, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawHud(ctx, score, speed, width) {
  ctx.fillStyle = "rgba(0, 20, 32, 0.55)";
  ctx.fillRect(0, 0, width, 56);

  ctx.fillStyle = "#ffffff";
  ctx.font = "700 22px Inter, Arial, sans-serif";
  ctx.textBaseline = "middle";
  ctx.fillText(`SCORE: ${Math.floor(score)}`, 18, 28);
  ctx.textAlign = "right";
  ctx.fillText(`SPEED: ${speed.toFixed(1)}`, width - 18, 28);
  ctx.textAlign = "left";
}

function drawDuck(ctx, duck) {
  ctx.save();
  ctx.translate(duck.x, duck.y);
  ctx.rotate(duck.tilt);

  ctx.fillStyle = "#f7c948";
  ctx.beginPath();
  ctx.arc(0, 0, duck.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(duck.radius - 2, -duck.radius + 2, 14, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ff8f1f";
  ctx.beginPath();
  ctx.moveTo(duck.radius + 8, -duck.radius + 2);
  ctx.lineTo(duck.radius + 24, -duck.radius + 8);
  ctx.lineTo(duck.radius + 8, -duck.radius + 14);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#111";
  ctx.beginPath();
  ctx.arc(duck.radius + 2, -duck.radius + 1, 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(duck.radius - 8, -duck.radius + 3, 2.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#2c3e50";
  ctx.fillRect(-32, duck.radius - 2, 64, 8);

  ctx.fillStyle = "#0e1726";
  ctx.beginPath();
  ctx.arc(-18, duck.radius + 8, 5.2, 0, Math.PI * 2);
  ctx.arc(18, duck.radius + 8, 5.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawObstacle(ctx, obstacle) {
  if (obstacle.type === "rock") {
    ctx.fillStyle = "#6f7f90";
    ctx.beginPath();
    ctx.moveTo(obstacle.x, obstacle.y - obstacle.size * 0.4);
    ctx.lineTo(obstacle.x + obstacle.size * 0.55, obstacle.y - obstacle.size * 0.9);
    ctx.lineTo(obstacle.x + obstacle.size, obstacle.y - obstacle.size * 0.25);
    ctx.lineTo(obstacle.x + obstacle.size * 0.82, obstacle.y + obstacle.size * 0.48);
    ctx.lineTo(obstacle.x + obstacle.size * 0.18, obstacle.y + obstacle.size * 0.48);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#95a7b8";
    ctx.fillRect(
      obstacle.x + obstacle.size * 0.18,
      obstacle.y - obstacle.size * 0.32,
      obstacle.size * 0.35,
      obstacle.size * 0.16
    );
    return;
  }

  ctx.fillStyle = "#0c0f15";
  ctx.beginPath();
  ctx.ellipse(obstacle.x + obstacle.size * 0.5, obstacle.y, obstacle.size * 0.44, obstacle.size * 0.62, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#f5f9ff";
  ctx.beginPath();
  ctx.ellipse(obstacle.x + obstacle.size * 0.5, obstacle.y + obstacle.size * 0.1, obstacle.size * 0.22, obstacle.size * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ff9f1c";
  ctx.beginPath();
  ctx.moveTo(obstacle.x + obstacle.size * 0.46, obstacle.y - obstacle.size * 0.1);
  ctx.lineTo(obstacle.x + obstacle.size * 0.6, obstacle.y - obstacle.size * 0.05);
  ctx.lineTo(obstacle.x + obstacle.size * 0.46, obstacle.y + obstacle.size * 0.02);
  ctx.closePath();
  ctx.fill();
}

function drawParticles(ctx, particles) {
  for (let i = 0; i < particles.length; i += 1) {
    const p = particles[i];
    const alpha = clamp(p.life / p.maxLife, 0, 1);
    ctx.fillStyle = `rgba(230, 246, 255, ${alpha})`;
    ctx.fillRect(p.x, p.y, 3, 3);
  }
}

function detectCollision(duck, obstacle) {
  const duckLeft = duck.x - duck.radius * 0.9;
  const duckTop = duck.y - duck.radius * 0.95;
  const duckWidth = duck.radius * 1.8;
  const duckHeight = duck.radius * 1.9;

  const obsLeft = obstacle.x;
  const obsTop = obstacle.y - obstacle.size * 0.9;
  const obsWidth = obstacle.size;
  const obsHeight = obstacle.size * 1.4;

  return (
    duckLeft < obsLeft + obsWidth &&
    duckLeft + duckWidth > obsLeft &&
    duckTop < obsTop + obsHeight &&
    duckTop + duckHeight > obsTop
  );
}

export default function DuckSkateGame() {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const [isGameOver, setIsGameOver] = useState(false);

  const restartGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    gameRef.current = initGameState(canvas.width, canvas.height);
    setIsGameOver(false);

    const loop = (time) => {
      runFrame(time);
    };

    gameRef.current.animationFrameId = requestAnimationFrame(loop);
  };

  const runFrame = (time) => {
    const canvas = canvasRef.current;
    const game = gameRef.current;
    if (!canvas || !game || game.gameOver) return;

    const ctx = canvas.getContext("2d");
    const delta = game.lastTime ? Math.min(34, time - game.lastTime) : 16;
    game.lastTime = time;

    game.duck.x += (game.duck.targetX - game.duck.x) * 0.16;
    const velocityX = game.duck.targetX - game.duck.x;
    game.duck.lastDx = velocityX;
    const targetTilt = clamp(velocityX * 0.0042, -0.34, 0.34);
    game.duck.tilt += (targetTilt - game.duck.tilt) * 0.18;

    game.speed += delta * 0.00019;
    game.score += delta * 0.055;

    game.spawnTimer += delta;
    const spawnInterval = Math.max(360, BASE_SPAWN_MS - (game.speed - 3.2) * 48);
    if (game.spawnTimer >= spawnInterval) {
      game.spawnTimer = 0;
      game.obstacles.push(createObstacle(game.width));
    }

    for (let i = game.obstacles.length - 1; i >= 0; i -= 1) {
      const obstacle = game.obstacles[i];
      obstacle.y += game.speed;
      if (obstacle.type === "penguin") {
        obstacle.swayPhase += 0.05;
        obstacle.x += Math.sin(obstacle.swayPhase) * 0.8;
      }

      if (obstacle.y - obstacle.size > game.height + 12) {
        game.obstacles.splice(i, 1);
        continue;
      }

      if (detectCollision(game.duck, obstacle)) {
        game.gameOver = true;
        setIsGameOver(true);
      }
    }

    if (Math.abs(game.duck.lastDx) > 0.4) {
      game.particles.push(createSkateParticle(game.duck.x - 18, game.duck.y + 34));
      game.particles.push(createSkateParticle(game.duck.x + 18, game.duck.y + 34));
    }

    for (let i = game.particles.length - 1; i >= 0; i -= 1) {
      const p = game.particles[i];
      p.x -= p.vx;
      p.y += p.vy;
      p.life -= 1;
      if (p.life <= 0) {
        game.particles.splice(i, 1);
      }
    }

    drawBackground(ctx, game.width, game.height, time / 1000);
    drawParticles(ctx, game.particles);
    for (let i = 0; i < game.obstacles.length; i += 1) {
      drawObstacle(ctx, game.obstacles[i]);
    }
    drawDuck(ctx, game.duck);
    drawHud(ctx, game.score, game.speed, game.width);

    if (!game.gameOver) {
      game.animationFrameId = requestAnimationFrame(runFrame);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      if (gameRef.current) {
        gameRef.current.width = canvas.width;
        gameRef.current.height = canvas.height;
        gameRef.current.duck.y = canvas.height - DUCK_Y_OFFSET;
        gameRef.current.duck.targetX = clamp(gameRef.current.duck.targetX, 30, canvas.width - 30);
        gameRef.current.duck.x = clamp(gameRef.current.duck.x, 30, canvas.width - 30);
      }
    };

    resizeCanvas();
    gameRef.current = initGameState(canvas.width, canvas.height);

    const handleMouseMove = (event) => {
      if (!gameRef.current || gameRef.current.gameOver) return;
      gameRef.current.duck.targetX = clamp(event.clientX, 30, gameRef.current.width - 30);
    };

    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("mousemove", handleMouseMove);

    gameRef.current.animationFrameId = requestAnimationFrame(runFrame);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", handleMouseMove);
      if (gameRef.current?.animationFrameId) {
        cancelAnimationFrame(gameRef.current.animationFrameId);
      }
    };
  }, []);

  const finalScore = Math.floor(gameRef.current?.score || 0);

  return (
    <div className="game-shell">
      <canvas ref={canvasRef} className="game-canvas" />
      {isGameOver && (
        <div className="overlay">
          <div className="panel">
            <h1>Game Over</h1>
            <p>Final Score: {finalScore}</p>
            <button type="button" onClick={restartGame}>
              Restart
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
