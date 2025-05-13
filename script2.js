
// Функция для создания фона стартового экрана
function createStartScreenBackground() {
    const startScreen = document.getElementById('start-screen');
    const backgroundContainer = document.createElement('div');
    backgroundContainer.id = 'start-screen-bg';
    
    // Стили для контейнера фона
    backgroundContainer.style.position = 'absolute';
    backgroundContainer.style.top = '0';
    backgroundContainer.style.left = '0';
    backgroundContainer.style.width = '100%';
    backgroundContainer.style.height = '100%';
    backgroundContainer.style.zIndex = '-1';
    backgroundContainer.style.overflow = 'hidden';
    
    // Добавляем контейнер фона в начальный экран
    startScreen.prepend(backgroundContainer);
    
    // Для мобильных устройств создаем статичный фон
    if (isMobileDevice()) {
        createMobileBackground(backgroundContainer);
    } else {
        createDesktopBackground(backgroundContainer);
    }
}

// Упрощенный фон для мобильных устройств
function createMobileBackground(container) {
    // Создаем минимальное количество статичных блоков
    const colors = [
        {fill: '#3498db', stroke: '#2980b9'},
        {fill: '#e74c3c', stroke: '#c0392b'},
        {fill: '#2ecc71', stroke: '#27ae60'}
    ];
    
    const numBlocks = 5; // Уменьшаем количество блоков
    for (let i = 0; i < numBlocks; i++) {
        const block = document.createElement('div');
        const colorIndex = i % colors.length;
        const size = 40 + Math.random() * 30;
        
        block.className = 'floating-block';
        block.style.position = 'absolute';
        block.style.width = size + 'px';
        block.style.height = size / 3 + 'px';
        block.style.backgroundColor = colors[colorIndex].fill;
        block.style.border = `1px solid ${colors[colorIndex].stroke}`;
        block.style.borderRadius = '4px';
        block.style.opacity = '0.1';
        
        // Статичное положение
        const startX = 20 + (i * 15);
        const startY = 20 + (i * 20);
        block.style.left = startX + '%';
        block.style.top = startY + '%';
        
        container.appendChild(block);
    }
}

// Полный фон для десктопа
function createDesktopBackground(container) {
    // Создаем плавающие блоки
    const colors = [
        {fill: '#3498db', stroke: '#2980b9'},
        {fill: '#e74c3c', stroke: '#c0392b'},
        {fill: '#f1c40f', stroke: '#f39c12'},
        {fill: '#2ecc71', stroke: '#27ae60'},
        {fill: '#9b59b6', stroke: '#8e44ad'},
        {fill: '#e67e22', stroke: '#d35400'},
        {fill: '#1abc9c', stroke: '#16a085'}
    ];
    
    const numBlocks = 15;
    for (let i = 0; i < numBlocks; i++) {
        const block = document.createElement('div');
        const colorIndex = Math.floor(Math.random() * colors.length);
        const size = 20 + Math.random() * 60;
        
        block.className = 'floating-block';
        block.style.position = 'absolute';
        block.style.width = size + 'px';
        block.style.height = size / 3 + 'px';
        block.style.backgroundColor = colors[colorIndex].fill;
        block.style.border = `2px solid ${colors[colorIndex].stroke}`;
        block.style.boxShadow = `0 0 10px ${colors[colorIndex].fill}, inset 0 0 5px ${colors[colorIndex].stroke}`;
        block.style.borderRadius = '4px';
        block.style.opacity = '0.2';
        
        const startX = Math.random() * 100;
        const startY = Math.random() * 100;
        block.style.left = startX + '%';
        block.style.top = startY + '%';
        
        // Добавляем блик
        const highlight = document.createElement('div');
        highlight.style.position = 'absolute';
        highlight.style.top = '20%';
        highlight.style.left = '10%';
        highlight.style.width = '80%';
        highlight.style.height = '20%';
        highlight.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
        highlight.style.borderRadius = '2px';
        block.appendChild(highlight);
        
        container.appendChild(block);
        
        // Анимируем только на десктопе
        animateBlock(block);
    }
    
    // Добавляем звезды только для десктопа
    createStarryBackground(container);
}

// Оптимизированная анимация для десктопа
function animateBlock(block) {
    // Используем CSS transitions вместо keyframes для лучшей производительности
    const duration = 15 + Math.random() * 20;
    const delay = Math.random() * 5;
    
    // Используем простые трансформации
    block.style.transition = `transform ${duration}s ease-in-out`;
    
    // Простая анимация движения
    function moveBlock() {
        const x = (Math.random() - 0.5) * 50;
        const y = (Math.random() - 0.5) * 50;
        const rotate = (Math.random() - 0.5) * 20;
        
        block.style.transform = `translate(${x}px, ${y}px) rotate(${rotate}deg)`;
        
        setTimeout(moveBlock, duration * 1000);
    }
    
    setTimeout(moveBlock, delay * 1000);
}

// Звёздный фон только для десктопа
function createStarryBackground(container) {
    const numStars = 50; // Уменьшаем количество звезд
    
    for (let i = 0; i < numStars; i++) {
        const star = document.createElement('div');
        const size = 1 + Math.random() * 2;
        
        star.className = 'star';
        star.style.position = 'absolute';
        star.style.width = size + 'px';
        star.style.height = size + 'px';
        star.style.backgroundColor = '#fff';
        star.style.borderRadius = '50%';
        star.style.boxShadow = '0 0 ' + (size * 2) + 'px rgba(0, 255, 255, 0.5)';
        
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        
        // Простая анимация мерцания
        const animationDuration = 1 + Math.random() * 4;
        star.style.animation = `twinkle ${animationDuration}s ease-in-out infinite`;
        
        container.appendChild(star);
    }
    
    // Добавляем @keyframes для мерцания только один раз
    if (!document.getElementById('twinkle-animation')) {
        const twinkleKeyframes = `
            @keyframes twinkle {
                0%, 100% { opacity: 0.3; }
                50% { opacity: 1; }
            }
        `;
        
        const styleElement = document.createElement('style');
        styleElement.id = 'twinkle-animation';
        styleElement.innerHTML = twinkleKeyframes;
        document.head.appendChild(styleElement);
    }
}

// Оптимизированная инициализация
window.addEventListener('DOMContentLoaded', function() {
    createStartScreenBackground();
});

// Оптимизированная функция отрисовки деталей блоков
function renderBlockDetails(ctx) {
    droppedBlocks.forEach(block => {
        if (block.render && block.details) {
            ctx.save();
            
            ctx.translate(block.position.x, block.position.y);
            ctx.rotate(block.angle);
            
            const width = block.render.width || config.blockWidth;
            const height = block.render.height || config.blockHeight;
            
            // Горизонтальные линии энергии
            ctx.fillStyle = block.details;
            ctx.fillRect(-width/2 + 10, -height/2 + 5, width - 20, 3);
            ctx.fillRect(-width/2 + 10, height/2 - 8, width - 20, 3);
            
            // Добавляем "порты" или "панели" по бокам
            const portSize = 8;
            
            // Левый порт
            ctx.fillStyle = block.render.strokeStyle;
            ctx.fillRect(-width/2 + 2, -portSize/2, portSize, portSize);
            ctx.fillStyle = block.details;
            ctx.fillRect(-width/2 + 3, -portSize/2 + 1, portSize - 2, portSize - 2);
            
            // Правый порт
            ctx.fillStyle = block.render.strokeStyle;
            ctx.fillRect(width/2 - portSize - 2, -portSize/2, portSize, portSize);
            ctx.fillStyle = block.details;
            ctx.fillRect(width/2 - portSize - 1, -portSize/2 + 1, portSize - 2, portSize - 2);
            
            // Центральный индикатор СТАТИЧНЫЙ - без анимации
            const indicatorWidth = 20;
            const indicatorHeight = 6;
            
            ctx.fillStyle = block.render.strokeStyle;
            ctx.fillRect(-indicatorWidth/2, -indicatorHeight/2, indicatorWidth, indicatorHeight);
            
            // Заливаем индикатор полностью, без пульсации
            ctx.fillStyle = block.details;
            ctx.fillRect(-indicatorWidth/2 + 1, -indicatorHeight/2 + 1, indicatorWidth - 2, indicatorHeight - 2);
            
            ctx.restore();
        }
    });
}
