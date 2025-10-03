const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Set canvas size
canvas.width = 500;
canvas.height = 500;

// Load images
const mooseImg = new Image();
mooseImg.src = "https://i.ibb.co/Kjj1tz2f/Baby-Moose.png";

const acornImg = new Image();
acornImg.src = "https://i.ibb.co/7tF3jPqT/Moose-Door.png";

// NEW: Load Background Image
const backgroundImg = new Image();
backgroundImg.src = "https://i.ibb.co/pjpRz3JH/Twitter-header-1.jpg";

// Game State
let gameActive = true;
let score = 0;
let highScore = 0;

// Player object
const player = {
  x: 50,
  y: canvas.height / 2,
  size: 30,
  gravity: 0.45,
  lift: -10,
  velocity: 0,
  isScored: false
};

// Obstacles
let pipes = [];
const pipeWidth = 50;

// DIFFICULTY ADJUSTMENTS
const gap = 160; // Increased from 120 (approx 17.5%) for easier vertical passage
let frame = 0;
const pipeSpawnRate = 98; // Increased from 90 (20%) for wider horizontal spacing

// GAME SPEED ADJUSTMENT (15% slower than initial speed)
const pipeSpeed = 1.7; 

// NEW: Background scrolling variables
let backgroundX = 0;
const backgroundScrollSpeed = 0.5; // Slower than pipes to give depth perception

// --- Game Logic Functions ---

// Input (Jump)
document.addEventListener("keydown", e => {
  if (e.code === "Space" && gameActive) {
    player.velocity = player.lift;
  } else if (e.code === "Space" && !gameActive) {
    resetGame();
  }
});

canvas.addEventListener("click", () => {
  if (gameActive) {
    player.velocity = player.lift;
  } else {
    resetGame();
  }
});

// Collision Detection (AABB vs AABB)
function checkCollision(pipe) {
  // Check collision with the top pipe
  const topPipeCollision = (
    player.x < pipe.x + pipeWidth && 
    player.x + player.size > pipe.x && 
    player.y < pipe.y 
  );

  // Check collision with the bottom pipe
  const bottomPipeCollision = (
    player.x < pipe.x + pipeWidth && 
    player.x + player.size > pipe.x && 
    player.y + player.size > pipe.y + gap 
  );

  return topPipeCollision || bottomPipeCollision;
}

// Update game
function update() {
  if (!gameActive) return;

  // 1. Player Physics
  player.velocity += player.gravity;
  player.y += player.velocity;

  // 2. Wall Collision (Game Over Mechanism)
  if (player.y + player.size > canvas.height || player.y < 0) {
    gameOver();
    return;
  }
  
  // 3. Pipe Generation
  if (frame % pipeSpawnRate === 0) {
    const pipeY = Math.random() * (canvas.height - gap - 100) + 50;
    pipes.push({ 
      x: canvas.width, 
      y: pipeY,
      passed: false 
    });
  }

  // 4. Pipe Movement, Scoring, and Collision
  pipes.forEach(pipe => {
    pipe.x -= pipeSpeed; 

    // Collision check (Game Over Mechanism)
    if (checkCollision(pipe)) {
      gameOver();
    }

    // Scoring
    if (pipe.x + pipeWidth < player.x && !pipe.passed) {
      score++;
      pipe.passed = true;
    }
  });

  // 5. Remove off-screen pipes
  pipes = pipes.filter(pipe => pipe.x + pipeWidth > 0);

  // NEW: Update background position for scrolling effect
  backgroundX -= backgroundScrollSpeed;
  // Loop background when it goes off screen
  if (backgroundX <= -backgroundImg.width) {
    backgroundX = 0;
  }

  frame++;
}

// Draw game
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // NEW: Draw Background Image (before anything else)
  if (backgroundImg.complete && backgroundImg.naturalWidth !== 0) {
    // Draw the image, and then draw it again if needed to fill the screen for scrolling
    ctx.drawImage(backgroundImg, backgroundX, 0, backgroundImg.width, canvas.height);
    // If the image is smaller than the canvas width, or if it's scrolling
    if (backgroundImg.width < canvas.width || backgroundX < 0) {
      ctx.drawImage(backgroundImg, backgroundX + backgroundImg.width, 0, backgroundImg.width, canvas.height);
    }
  } else {
    // Fallback if image not loaded
    ctx.fillStyle = "#87CEEB"; // Sky blue
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Player (Moose)
  if (mooseImg.complete && mooseImg.naturalWidth !== 0) {
    ctx.drawImage(mooseImg, player.x, player.y, player.size, player.size);
  } else {
    ctx.fillStyle = "red";
    ctx.fillRect(player.x, player.y, player.size, player.size);
  }

  // Pipes (Acorns/Doors)
  pipes.forEach(pipe => {
    const imgToUse = acornImg.complete && acornImg.naturalWidth !== 0 ? acornImg : null;

    if (imgToUse) {
      // Top pipe
      ctx.drawImage(imgToUse, pipe.x, 0, pipeWidth, pipe.y);
      // Bottom pipe
      ctx.drawImage(imgToUse, pipe.x, pipe.y + gap, pipeWidth, canvas.height - pipe.y - gap);
    } else {
      ctx.fillStyle = "green";
      ctx.fillRect(pipe.x, 0, pipeWidth, pipe.y);
      ctx.fillRect(pipe.x, pipe.y + gap, pipeWidth, canvas.height - pipe.y - gap);
    }
  });
  
  // Draw Score
  ctx.fillStyle = "black";
  ctx.font = "20px Arial";
  ctx.fillText(`Score: ${score}`, 10, 30);
  ctx.fillText(`High Score: ${highScore}`, canvas.width - 150, 30);

  // Game Over Screen
  if (!gameActive) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.font = "40px Arial";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = "20px Arial";
    ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
    ctx.fillText("Press SPACE or Click to Restart", canvas.width / 2, canvas.height / 2 + 60);
  }
}

// Game Over Function
function gameOver() {
  gameActive = false;
  if (score > highScore) {
    highScore = score;
  }
}

// Reset Game Function
function resetGame() {
  player.y = canvas.height / 2;
  player.velocity = 0;
  pipes = [];
  score = 0;
  frame = 0;
  backgroundX = 0; // Reset background position
  gameActive = true; 
}

// Main loop
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

// Start the game loop
loop();
