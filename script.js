
// Функция определения мобильного устройства
function isMobileDevice() {
    return window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Адаптивные настройки конфигурации
const config = {
    blockWidth: isMobileDevice() ? 80 : 120,
    blockHeight: isMobileDevice() ? 30 : 40,
    craneSpeed: isMobileDevice() ? 2.5 : 3,
    craneSpeedIncrease: 0.2,
    craneSpeedIncreaseThreshold: 5,
    groundLevel: 550,
    perfectDropBonus: 50,
    wobbleThreshold: 2.5,
    craneWidth: isMobileDevice() ? 80 : 120,
    craneHeight: isMobileDevice() ? 60 : 80,
    stackTolerance: isMobileDevice() ? 80 : 120
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
    const isMobile = isMobileDevice();
    const containerWidth = isMobile ? window.innerWidth : gameContainer.clientWidth;
    const containerHeight = isMobile ? window.innerHeight : gameContainer.clientHeight;
    
    canvas.width = containerWidth;
    canvas.height = containerHeight;
    
    // Адаптируем groundLevel для мобильных
    if (isMobile) {
        config.groundLevel = containerHeight - 50;
    }
    
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
    // Футуристичная цветовая палитра космических контейнеров
    const blockColors = [
        {fill: '#1e3799', stroke: '#0c2461', details: '#4a69bd'}, // Глубокий космический синий
        {fill: '#6a0572', stroke: '#380036', details: '#9980FA'}, // Футуристичный фиолетовый
        {fill: '#009432', stroke: '#006266', details: '#7bed9f'}, // Неоновый зеленый
        {fill: '#1289A7', stroke: '#0652DD', details: '#74b9ff'}, // Голографический синий
        {fill: '#833471', stroke: '#6F1E51', details: '#FDA7DF'}, // Квантовый пурпурный
        {fill: '#EE5A24', stroke: '#D980FA', details: '#fad390'}, // Космический оранжевый
        {fill: '#12CBC4', stroke: '#0652DD', details: '#C4E538'}  // Бирюзовый неон
    ];
    return blockColors[Math.floor(Math.random() * blockColors.length)];
}
function createBlockOnCrane() {
    const colorData = getRandomColor();
    blockOnCrane = {
        x: craneX,
        y: 50, 
        width: config.blockWidth,
        height: config.blockHeight,
        fill: colorData.fill,
        stroke: colorData.stroke,
        details: colorData.details // Добавляем цвет для деталей
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
                opacity: 1, // Явно задаем полную непрозрачность
                width: blockOnCrane.width,  // Сохраняем размеры для правильной отрисовки деталей
                height: blockOnCrane.height
            },
            // Сохраняем цвет деталей для использования в обработчике рендера
            details: blockOnCrane.details,
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
        
        // Create visual effect for perfect drop - более футуристичный
        const perfectEffect = document.createElement('div');
        perfectEffect.textContent = '+' + config.perfectDropBonus;
        perfectEffect.style.position = 'absolute';
        perfectEffect.style.left = blockOnCrane.x + 'px';
        perfectEffect.style.top = (blockOnCrane.y + cameraOffsetY) + 'px';
        perfectEffect.style.color = '#00ffff';
        perfectEffect.style.fontSize = '24px';
        perfectEffect.style.fontWeight = 'bold';
        perfectEffect.style.textShadow = '0 0 8px #00ffff, 0 0 12px #00ffff';
        perfectEffect.style.zIndex = '150';
        perfectEffect.style.transition = 'transform 1s, opacity 1s';
        perfectEffect.style.opacity = '1';
        
        gameContainer.appendChild(perfectEffect);
        
        setTimeout(() => {
            perfectEffect.style.transform = 'translateY(-50px) scale(1.5)';
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
// Обновленная функция drawCrane без анимированной полосы заряда
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

    // Кабина крана - делаем более футуристичной
    ctx.fillStyle = "#2c3e50";
    ctx.fillRect(craneX - 25, craneTopY - 20, 50, 20);
    
    // Окно кабины - добавляем голографический эффект
    const gradient = ctx.createLinearGradient(craneX - 15, craneTopY - 16, craneX + 15, craneTopY - 4);
    gradient.addColorStop(0, "#3498db");
    gradient.addColorStop(0.5, "#2ecc71");
    gradient.addColorStop(1, "#9b59b6");
    ctx.fillStyle = gradient;
    ctx.fillRect(craneX - 15, craneTopY - 16, 30, 12);
    
    // Отражение света в окнах - делаем более ярким
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(craneX - 12, craneTopY - 16, 5, 7);

    // Механизм крана - более технологичный вид
    ctx.fillStyle = "#34495e";
    ctx.fillRect(craneX - 8, craneTopY, 16, 20);
    
    // Добавляем светящиеся индикаторы на механизм
    ctx.fillStyle = "#e74c3c";
    ctx.beginPath();
    ctx.arc(craneX - 4, craneTopY + 8, 2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = "#2ecc71";
    ctx.beginPath();
    ctx.arc(craneX + 4, craneTopY + 8, 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Трос - делаем его светящимся
    ctx.strokeStyle = "#ecf0f1";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(craneX, craneTopY + 20);
    ctx.lineTo(craneX, blockOnCrane ? blockOnCrane.y - blockOnCrane.height / 2 : craneTopY + hookLength);
    ctx.stroke();
    
    // Добавляем свечение вокруг троса
    ctx.shadowColor = "#89c9ff";
    ctx.shadowBlur = 5;
    ctx.strokeStyle = "#89c9ff";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(craneX, craneTopY + 20);
    ctx.lineTo(craneX, blockOnCrane ? blockOnCrane.y - blockOnCrane.height / 2 : craneTopY + hookLength);
    ctx.stroke();
    
    // Убираем свечение для остальных элементов
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // Если блок есть - рисуем его как футуристичный контейнер
    if (blockOnCrane) {
        const x = blockOnCrane.x - blockOnCrane.width / 2;
        const y = blockOnCrane.y - blockOnCrane.height / 2;
        
        // Основной блок - полностью непрозрачный
        ctx.fillStyle = blockOnCrane.fill;
        ctx.fillRect(x, y, blockOnCrane.width, blockOnCrane.height);
        
        // Голографическая обводка
        ctx.strokeStyle = blockOnCrane.stroke;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, blockOnCrane.width, blockOnCrane.height);
        
        // Добавляем футуристичные детали
        
        // Горизонтальные линии энергии
        ctx.fillStyle = blockOnCrane.details;
        ctx.fillRect(x + 10, y + 5, blockOnCrane.width - 20, 3);
        ctx.fillRect(x + 10, y + blockOnCrane.height - 8, blockOnCrane.width - 20, 3);
        
        // Добавляем "порты" или "панели" по бокам
        const portSize = 8;
        const portY = y + (blockOnCrane.height - portSize) / 2;
        
        // Левый порт
        ctx.fillStyle = blockOnCrane.stroke;
        ctx.fillRect(x + 2, portY, portSize, portSize);
        ctx.fillStyle = blockOnCrane.details;
        ctx.fillRect(x + 3, portY + 1, portSize - 2, portSize - 2);
        
        // Правый порт
        ctx.fillStyle = blockOnCrane.stroke;
        ctx.fillRect(x + blockOnCrane.width - portSize - 2, portY, portSize, portSize);
        ctx.fillStyle = blockOnCrane.details;
        ctx.fillRect(x + blockOnCrane.width - portSize - 1, portY + 1, portSize - 2, portSize - 2);
        
        // Центральный индикатор - СТАТИЧНЫЙ, без анимации
        const indicatorWidth = 20;
        const indicatorHeight = 6;
        const indicatorX = x + (blockOnCrane.width - indicatorWidth) / 2;
        const indicatorY = y + (blockOnCrane.height - indicatorHeight) / 2;
        
        ctx.fillStyle = blockOnCrane.stroke;
        ctx.fillRect(indicatorX, indicatorY, indicatorWidth, indicatorHeight);
        
        // Заливаем индикатор полностью цветом деталей
        ctx.fillStyle = blockOnCrane.details;
        ctx.fillRect(indicatorX + 1, indicatorY + 1, indicatorWidth - 2, indicatorHeight - 2);
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
    
    // Убеждаемся, что все блоки непрозрачные
    droppedBlocks.forEach(block => {
        block.render.opacity = 1;
    });
    ground.render.opacity = 1;
    
    // Плавное движение камеры к цели
    cameraOffsetY += (cameraTargetY - cameraOffsetY) * 0.05;

    // Смещаем рендер вверх
    render.bounds.min.y = -cameraOffsetY;
    render.bounds.max.y = canvas.height - cameraOffsetY;
    render.bounds.min.x = 0;
    render.bounds.max.x = canvas.width;
    
    // Обновляем трансформацию контекста канваса для физического движка
    render.context.globalAlpha = 1.0;
    render.context.setTransform(1, 0, 0, 1, 0, cameraOffsetY);
    
    // Draw crane (в экранных координатах)
    const ctx = render.context;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transformation - draw in screen coordinates
    
    ctx.globalAlpha = 1.0;
    drawCrane(ctx);              // Draw crane and cable without offset
    
    ctx.restore();
    
    // Отрисовываем детали на упавших блоках (после отрисовки блоков движком)
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, cameraOffsetY);
    renderBlockDetails(ctx);
    ctx.restore();
    
    requestAnimationFrame(gameLoop);
}

// Game initialization
function initGame() {
    const startButton = document.getElementById('start-btn');
    const isMobile = isMobileDevice();

    startButton.addEventListener('click', function() {
        if (isMobile) {
            // Плавный переход для мобильных
            const startScreen = document.getElementById('start-screen');
            startScreen.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
            startScreen.style.opacity = '0';
            startScreen.style.transform = 'translate(-50%, -50%) scale(0.9)';
            
            setTimeout(() => {
                startScreen.style.display = 'none';
                canvas.style.display = 'block';
                document.getElementById('ui-container').style.display = 'block';
                document.getElementById('game-background').style.display = 'block';
                
                // Плавное появление игры
                canvas.style.opacity = '0';
                setTimeout(() => {
                    canvas.style.transition = 'opacity 0.3s ease-in';
                    canvas.style.opacity = '1';
                }, 50);
            }, 300);
        } else {
            // Стандартный переход для десктопа
            document.getElementById('start-screen').style.display = 'none';
            canvas.style.display = 'block';
            document.getElementById('ui-container').style.display = 'block';
            document.getElementById('game-background').style.display = 'block';
        }
    });
    
    // Оптимизация для мобильных
    if (isMobile) {
        // Упрощаем настройки рендера для мобильных
        render.options.pixelRatio = 1;
        engine.world.gravity.y = 0.98;
        
        // Предотвращаем двойной тап и зум
        document.addEventListener('gesturestart', function(e) {
            e.preventDefault();
        });
        
        // Адаптивные тач-события
        let touchStartY = 0;
        canvas.addEventListener('touchstart', function(e) {
            touchStartY = e.touches[0].clientY;
            e.preventDefault();
        });
        
        canvas.addEventListener('touchend', function(e) {
            const touchEndY = e.changedTouches[0].clientY;
            if (Math.abs(touchEndY - touchStartY) < 10) {
                dropBlock();
            }
            e.preventDefault();
        });
    }
    
    // Установка настроек рендера
    render.options.wireframes = false;
    render.options.background = 'transparent';
    render.options.showSleeping = false;
    
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
    
    if (!isMobile) {
        canvas.addEventListener('click', dropBlock);
    }
    
    restartButton.addEventListener('click', resetGame);
    
    window.addEventListener('resize', resizeGame);
    
    // Обработка изменения ориентации на мобильных
    if (isMobile) {
        window.addEventListener('orientationchange', function() {
            setTimeout(resizeGame, 100);
        });
    }

    
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
