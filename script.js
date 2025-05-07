const config = {
    blockWidth: 120,
    blockHeight: 40,
    craneSpeed: 3,
    craneSpeedIncrease: 0.2,
    craneSpeedIncreaseThreshold: 5,
    groundLevel: 550,
    perfectDropBonus: 50,
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
        background: '#000000', // Прозрачный фон, но объекты непрозрачные
        showSleeping: false,
        showDebug: false,
        showBroadphase: false,
        showBounds: false,
        showVelocity: false,
        showCollisions: false,
        showSeparations: false,
        showAxes: false,
        showPositions: false,
        showAngleIndicator: false,
        showIds: false,
        showShadows: false
        
    }
});

// Create ground
const ground = Bodies.rectangle(
    canvas.width / 2,
    config.groundLevel,
    canvas.width,
    20,
    { 
        isStatic: true, 
        render: { 
            fillStyle: '#3a566e',
            strokeStyle: '#89c9ff',
            lineWidth: 3,
            opacity: 1
        },
        collisionFilter: {
            group: 1,
            category: 1,
            mask: 1
        }
    }
);


World.add(engine.world, ground);

// Start the engine and renderer
Matter.Runner.run(engine);
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
    // Новая яркая палитра, больше подходящая для морского порта
    const blockColors = [
        {fill: '#225D6C', stroke: '#183E48'}, // Тусклый неоновый голубой
        {fill: '#6B1E5E', stroke: '#4A1442'}, // Глубокий фиолетовый неон
        {fill: '#3D6B3A', stroke: '#284A27'}, // Зелёный с тусклым свечением
        {fill: '#6C5F28', stroke: '#4A411B'}, // Мутный неоново-жёлтый
        {fill: '#6A2B2B', stroke: '#471D1D'}, // Приглушённый красный
        {fill: '#2A5B66', stroke: '#1B3E45'}, // Лазурный с металлическим оттенком
        {fill: '#7A4B26', stroke: '#56361A'}, // Темно-оранжевый
    ];
    return blockColors[Math.floor(Math.random() * blockColors.length)];
}

// Create a new block on the crane
function createBlockOnCrane() {
    const colorData = getRandomColor();
    blockOnCrane = {
        x: craneX,
        y: 50, 
        width: config.blockWidth,
        height: config.blockHeight,
        fill: colorData.fill,
        stroke: colorData.stroke
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
        // Функциональность была пустой, оставляем как есть
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
                fillStyle: blockOnCrane.fill,
                strokeStyle: blockOnCrane.stroke,
                lineWidth: 2,
                opacity: 1 // Явно задаем полную непрозрачность
            },
            collisionFilter: {
                group: 1,
                category: 1,
                mask: 1
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
    // Полностью отменяем прозрачность
    ctx.globalAlpha = 1.0;
    
    const craneTopY = 20;
    const hookLength = 30;

    // Убираем тени, так как они могут влиять на прозрачность
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';

    // Основная балка крана (горизонтальная)
    ctx.fillStyle = "#566d86";
    ctx.fillRect(0, craneTopY, canvas.width, 12);
    
    // Металлический эффект - блики 
    ctx.fillStyle = "#89c9ff";
    ctx.fillRect(0, craneTopY + 2, canvas.width, 2);

    // Кабина крана
    ctx.fillStyle = "#2c3e50";
    ctx.fillRect(craneX - 25, craneTopY - 20, 50, 20);
    
    // Окно кабины
    ctx.fillStyle = "#3498db";
    ctx.fillRect(craneX - 15, craneTopY - 16, 30, 12);
    
    // Отражение света в окнах
    ctx.fillStyle = "#a7d4ff";
    ctx.fillRect(craneX - 12, craneTopY - 16, 5, 7);

    // Механизм крана
    ctx.fillStyle = "#34495e";
    ctx.fillRect(craneX - 8, craneTopY, 16, 20);
    
    // Трос
    ctx.strokeStyle = "#bdc3c7";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(craneX, craneTopY + 20);
    ctx.lineTo(craneX, blockOnCrane ? blockOnCrane.y - blockOnCrane.height / 2 : craneTopY + hookLength);
    ctx.stroke();

    // Если блок есть - рисуем его
    if (blockOnCrane) {
        const x = blockOnCrane.x - blockOnCrane.width / 2;
        const y = blockOnCrane.y - blockOnCrane.height / 2;
        
        // Отключаем любые тени
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
        
        // Основной блок - полностью непрозрачный
        ctx.fillStyle = blockOnCrane.fill;
        ctx.fillRect(x, y, blockOnCrane.width, blockOnCrane.height);
        
        // Обводка
        ctx.strokeStyle = blockOnCrane.stroke;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, blockOnCrane.width, blockOnCrane.height);
        
        // Блики для эффекта металлического контейнера
        ctx.fillStyle = 'rgba(255, 255, 255, 1.0)'; // Полная непрозрачность
        ctx.fillRect(x + 10, y + 5, blockOnCrane.width - 20, 5);
        
        // Детали контейнера - ребра жесткости
        ctx.fillStyle = blockOnCrane.stroke;
        ctx.fillRect(x, y + blockOnCrane.height - 8, blockOnCrane.width, 4);
    }
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
    droppedBlocks.forEach(block => {
        block.render.opacity = 1;
    });
    ground.render.opacity = 1;
    // Draw crane
    const ctx = render.context;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transformation - draw in screen coordinates
    
    
    ctx.globalAlpha = 1.0;
    drawCrane(ctx);              // Draw crane and cable without offset
    
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
render.context.globalAlpha = 1.0;
    render.context.setTransform(1, 0, 0, 1, 0, cameraOffsetY);
    
    requestAnimationFrame(gameLoop);
}

// Game initialization
function initGame() {
    const startButton = document.getElementById('start-btn');

    startButton.addEventListener('click', function() {
        document.getElementById('start-screen').style.display = 'none';
        canvas.style.display = 'block';
        document.getElementById('ui-container').style.display = 'block';
        document.getElementById('game-background').style.display = 'block'; // Убедимся, что фон отображается
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
