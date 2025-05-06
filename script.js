const config = {
    blockWidth: 120,
    blockHeight: 40,
    craneSpeed: 2,
    craneSpeedIncrease: 0.2,
    craneSpeedIncreaseThreshold: 5,
    groundLevel: 550,
    perfectDropBonus: 50,
    blockColors: ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#1abc9c'],
    wobbleThreshold: 2.5, // Degrees
    craneWidth: 120,
    craneHeight: 80,
    stackTolerance: 120 // Maximum horizontal distance between blocks to count as stacked
};

// Game variables
let score = 0;
let floors = 0;
let isGameOver = false;
let craneDirRight = true;
let craneX = 100;
let currentCraneSpeed = config.craneSpeed;
let lastBlockX = 400; // Center of the game
let lastBlockY = config.groundLevel - (config.blockHeight / 2); // Top of the last block
let droppedBlocks = [];
let blockOnCrane = null;
let sounds = {};
let canBlock = true;
let cameraOffsetY = 0;
let cameraTargetY = 0;

// Matter.js setup
const Engine = Matter.Engine;
const Render = Matter.Render;
const World = Matter.World;
const Bodies = Matter.Bodies;
const Events = Matter.Events;

const engine = Engine.create({
    gravity: { x: 0, y: 0.98 } // Adjust gravity to make game feel right
});

const gameContainer = document.getElementById('game-container');
const canvas = document.getElementById('game-canvas');
const scoreElement = document.getElementById('score');
const floorsElement = document.getElementById('floors');
const gameOverElement = document.getElementById('game-over');
const finalScoreElement = document.getElementById('final-score');
const restartButton = document.getElementById('restart-btn');

// Set game container and canvas size
function resizeGame() {
    const containerWidth = gameContainer.clientWidth;
    const containerHeight = gameContainer.clientHeight;
    
    canvas.width = containerWidth;
    canvas.height = containerHeight;
    
    // Update the render size
    if (render) {
        render.options.width = containerWidth;
        render.options.height = containerHeight;
        render.canvas.width = containerWidth;
        render.canvas.height = containerHeight;
    }
    
    // Update ground position
    if (ground) {
        Matter.Body.setPosition(ground, {
            x: containerWidth / 2,
            y: config.groundLevel
        });
    }
}

// Setup renderer
const render = Render.create({
    canvas: canvas,
    engine: engine,
    options: {
        width: canvas.width,
        height: canvas.height,
        wireframes: false,
        background: '#87CEEB'
    }
});

// Create ground
const ground = Bodies.rectangle(
    canvas.width / 2,
    config.groundLevel,
    canvas.width,
    20,
    { isStatic: true, render: { fillStyle: '#394240' } }
);

World.add(engine.world, ground);

// Start the engine and renderer
Engine.run(engine);
Render.run(render);

// Load sounds
function loadSounds() {
    sounds.drop = new Audio();
    sounds.drop.src = "data:audio/mp3;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFyZ2Vzb3VuZEJhbmsuY29tAAAAQ29weXJpZ2h0IG1lc3NhZ2UAAABNZW5hY2UAAAAFAAAAVElUMgAAAAcAAABleGU6Y29tAAA=";

    sounds.crash = new Audio();
    sounds.crash.src = "data:audio/mp3;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFyZ2Vzb3VuZEJhbmsuY29tAAAAQ29weXJpZ2h0IG1lc3NhZ2UAAABNZW5hY2UAAAAFAAAAVElUMgAAAAcAAABleGU6Y29tAAA=";

    sounds.perfect = new Audio();
    sounds.perfect.src = "data:audio/mp3;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFyZ2Vzb3VuZEJhbmsuY29tAAAAQ29weXJpZ2h0IG1lc3NhZ2UAAABNZW5hY2UAAAAFAAAAVElUMgAAAAcAAABleGU6Y29tAAA=";
}

// Get random color for blocks
function getRandomColor() {
    return config.blockColors[Math.floor(Math.random() * config.blockColors.length)];
}

// Create a new block on the crane
function createBlockOnCrane() {
    blockOnCrane = {
        x: craneX,
    y: 50, 
    width: config.blockWidth,
    height: config.blockHeight,
    color: getRandomColor()
    };
}

// Check if the block is properly stacked on the previous block
function isBlockStacked(x, y) {
    // First block can be placed anywhere on the ground
    if (floors === 0) {
        return true;
    }
    
    // Get all blocks that are directly on the ground platform
    const groundBlocks = droppedBlocks.filter(block => {
        // Check if the block is resting on the ground (with a small tolerance)
        const distanceToGround = Math.abs(block.position.y + (config.blockHeight / 2) - config.groundLevel);
        return distanceToGround < 5; // 5px tolerance for physics engine fluctuations
    });
    
    // If there's already a block on the ground and we're trying to add another one
    // horizontally on the ground, prevent it
    if (groundBlocks.length >= 1 && Math.abs(y - config.groundLevel + (config.blockHeight / 2)) < 20) {
        return false;
    }
    
    // For subsequent blocks, check if they're stacked on top of the first block
    const firstBlock = droppedBlocks[0];
    const horizontalDistance = Math.abs(x - firstBlock.position.x);
    return horizontalDistance < config.stackTolerance;
}

// Drop the block from the crane
function dropBlock() {
    if (isGameOver || !blockOnCrane) return;
    
    // Check if this will be a valid placement before creating the block
    if (!isBlockStacked(blockOnCrane.x, blockOnCrane.y)) {
        
    }
    
    const block = Bodies.rectangle(
        blockOnCrane.x,
        blockOnCrane.y - cameraOffsetY, // переводим из экранных координат в мировые
        blockOnCrane.width,
        blockOnCrane.height,
        {
            restitution: 0.1,
            friction: 0.8,
            render: {
                fillStyle: blockOnCrane.color
            }
        }
    );
 
    sounds.drop.play();
    
    World.add(engine.world, block);
    droppedBlocks.push(block);
    
    // Check if this is a perfect drop
    const isPerfectDrop = Math.abs(blockOnCrane.x - lastBlockX) < 10;
    if (isPerfectDrop && floors > 0) {
        score += config.perfectDropBonus;
        sounds.perfect.play();
        
        // Create visual effect for perfect drop
        const perfectEffect = document.createElement('div');
        perfectEffect.textContent = '+' + config.perfectDropBonus;
        perfectEffect.style.position = 'absolute';
        perfectEffect.style.left = blockOnCrane.x + 'px';
        perfectEffect.style.top = (blockOnCrane.y + cameraOffsetY) + 'px';
        perfectEffect.style.color = '#FFD700';
        perfectEffect.style.fontSize = '24px';
        perfectEffect.style.fontWeight = 'bold';
        perfectEffect.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.5)';
        perfectEffect.style.zIndex = '150';
        perfectEffect.style.transition = 'transform 1s, opacity 1s';
        perfectEffect.style.opacity = '1';
        
        gameContainer.appendChild(perfectEffect);
        
        setTimeout(() => {
            perfectEffect.style.transform = 'translateY(-50px)';
            perfectEffect.style.opacity = '0';
        }, 50);
        
        setTimeout(() => {
            gameContainer.removeChild(perfectEffect);
        }, 1100);
    }
    
    // Update last block position for the next drop
    lastBlockX = blockOnCrane.x;
    lastBlockY = lastBlockY - config.blockHeight; // Move up for the next block
    // Поднимаем камеру, если башня достигла середины экрана
const thresholdY = canvas.height / 2;
if (lastBlockY + cameraOffsetY < thresholdY) {
    cameraTargetY = thresholdY - lastBlockY;
}
    
    blockOnCrane = null;
    
    // Increment floors and score
    floors++;
    score += 10;
    
    // Update UI
    updateUI();
    
    // Increase crane speed every 5 floors
    if (floors % config.craneSpeedIncreaseThreshold === 0) {
        currentCraneSpeed += config.craneSpeedIncrease;
    }
    
    // Create new block on crane
    createBlockOnCrane();
}

// Update UI elements
function updateUI() {
    scoreElement.textContent = `Score: ${score}`;
    floorsElement.textContent = `Floors: ${floors}`;
}

// Game over function
function gameOver() {
    isGameOver = true;
    sounds.crash.play();
    finalScoreElement.textContent = `Final Score: ${score}`;
    gameOverElement.style.display = 'block';
}

// Reset game
function resetGame() {
    // Clear all blocks
    droppedBlocks.forEach(block => {
        World.remove(engine.world, block);
        cameraOffsetY = 0;
        cameraTargetY = 0;
    });
    
    // Reset variables
    score = 0;
    floors = 0;
    isGameOver = false;
    craneDirRight = true;
    craneX = 100;
    currentCraneSpeed = config.craneSpeed;
    lastBlockX = 400; // Center of the game
    lastBlockY = config.groundLevel - (config.blockHeight / 2); // Reset the height too
    droppedBlocks = [];
    
    // Reset UI
    updateUI();
    gameOverElement.style.display = 'none';
    
    // Create new block
    createBlockOnCrane();
}

// Draw the crane properly
function drawCrane(ctx) {
    const craneTopY = 20;
    const hookLength = 30;

    ctx.fillStyle = "#555";
    ctx.fillRect(0, craneTopY, canvas.width, 8);

    ctx.fillStyle = "#333";
    ctx.fillRect(craneX - 20, craneTopY - 15, 40, 15);

    ctx.fillStyle = "#444";
    ctx.fillRect(craneX - 5, craneTopY, 10, 15);

    ctx.strokeStyle = "#222";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(craneX, craneTopY + 15);
    ctx.lineTo(craneX, blockOnCrane ? blockOnCrane.y - blockOnCrane.height / 2 : craneTopY + hookLength);
    ctx.stroke();

    if (!blockOnCrane) {
        ctx.fillStyle = "#222";
        ctx.beginPath();
        ctx.moveTo(craneX - 5, craneTopY + hookLength);
        ctx.lineTo(craneX + 5, craneTopY + hookLength);
        ctx.lineTo(craneX, craneTopY + hookLength + 5);
        ctx.closePath();
        ctx.fill();
    }

    ctx.fillStyle = "#222";
    ctx.beginPath();
    ctx.arc(craneX - 15, craneTopY - 15, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(craneX + 15, craneTopY - 15, 5, 0, Math.PI * 2);
    ctx.fill();
}


// Main game loop
function gameLoop() {
    if (!isGameOver) {
        // Move crane
        if (craneDirRight) {
            craneX += currentCraneSpeed;
            if (craneX > canvas.width - config.blockWidth / 2) {
                craneDirRight = false;
            }
        } else {
            craneX -= currentCraneSpeed;
            if (craneX < config.blockWidth / 2) {
                craneDirRight = true;
            }
        }
        
        // Update block on crane position
        if (blockOnCrane) {
            blockOnCrane.x = craneX;
            blockOnCrane.y = 50; // Оставляем фиксированным — всегда у крана
        }
        
        // Check for tower collapse
        if (droppedBlocks.length > 0) {
            // Check if any block falls off the screen or tilts too much
            droppedBlocks.forEach(block => {
                const angle = Math.abs(block.angle) * (180 / Math.PI);
                
                // Add wobble effect for blocks that are tilting
                if (angle > config.wobbleThreshold && angle < 30) {
                    const wobbleStrength = Math.min(angle / 10, 0.5);
                    Matter.Body.setPosition(block, {
                        x: block.position.x + (Math.random() * 2 - 1) * wobbleStrength,
                        y: block.position.y
                    });
                }
                
                if (block.position.y > canvas.height + 100 || angle > 45) {
                    if (!isGameOver) {
                        gameOver();
                    }
                }
            });
            
            // Check if there are multiple blocks on the ground level
            const groundBlocks = droppedBlocks.filter(block => {
                const distanceToGround = Math.abs(block.position.y + (config.blockHeight / 2) - config.groundLevel);
                return distanceToGround < 5;
            });
            
            if (groundBlocks.length > 1 && !isGameOver) {
                gameOver();
            }
        }
    }
    
    // Draw crane
    const ctx = render.context;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transformation - draw in screen coordinates
    drawCrane(ctx);                     // Draw crane and cable without offset
    
    // Draw block on crane in screen coordinates (not affected by camera)
    if (blockOnCrane) {
        ctx.fillStyle = blockOnCrane.color;
        ctx.fillRect(
            blockOnCrane.x - blockOnCrane.width / 2,
            blockOnCrane.y - blockOnCrane.height / 2,
            blockOnCrane.width,
            blockOnCrane.height
        );
    }
    ctx.restore();
    // Плавное движение камеры к цели
cameraOffsetY += (cameraTargetY - cameraOffsetY) * 0.05;

// Смещаем рендер вверх
render.bounds.min.y = -cameraOffsetY;
render.bounds.max.y = canvas.height - cameraOffsetY;
render.bounds.min.x = 0;
render.bounds.max.x = canvas.width;

// Обновляем трансформацию контекста канваса
render.context.setTransform(1, 0, 0, 1, 0, cameraOffsetY);///////////////////////////
    
    requestAnimationFrame(gameLoop);
}

// Game initialization
function initGame() {
    const startButton = document.getElementById('start-btn');

    startButton.addEventListener('click', function() {
        document.getElementById('start-screen').style.display = 'none';
        canvas.style.display = 'block';
        document.getElementById('ui-container').style.display = 'block';
    });
    
    resizeGame();
    loadSounds();
    createBlockOnCrane();
    updateUI();
    gameLoop();
    
    // Input event listeners
    window.addEventListener('keydown', function(e) {
        if (e.code === 'Space') {
            dropBlock();
            e.preventDefault();
        }
    });
    
    canvas.addEventListener('click', dropBlock);
    canvas.addEventListener('touchstart', function(e) {
        dropBlock();
        e.preventDefault();
    });
    
    restartButton.addEventListener('click', resetGame);
    
    window.addEventListener('resize', resizeGame);
}

// Detect matter.js collisions for sound effects
Events.on(engine, 'collisionStart', function(event) {
    const pairs = event.pairs;
    
    for (let i = 0; i < pairs.length; i++) {
        const pair = pairs[i];
        
        // If it's a block hitting the ground or another block
        if (droppedBlocks.includes(pair.bodyA) || droppedBlocks.includes(pair.bodyB)) {
            if (pair.bodyA === ground || pair.bodyB === ground) {
                // If it's the first block hitting the ground
                if (droppedBlocks.length === 1) {
                    sounds.drop.play();
                }
            } else {
                // Block hitting another block
                sounds.drop.play();
            }
        }
    }
});

// Start the game when the page loads
window.onload = initGame;