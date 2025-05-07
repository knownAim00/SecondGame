

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
    
    // Создаем плавающие блоки
    const colors = [
        {fill: '#3498db', stroke: '#2980b9'}, // Синий
        {fill: '#e74c3c', stroke: '#c0392b'}, // Красный
        {fill: '#f1c40f', stroke: '#f39c12'}, // Жёлтый
        {fill: '#2ecc71', stroke: '#27ae60'}, // Зелёный
        {fill: '#9b59b6', stroke: '#8e44ad'}, // Фиолетовый
        {fill: '#e67e22', stroke: '#d35400'}, // Оранжевый
        {fill: '#1abc9c', stroke: '#16a085'}  // Бирюзовый
    ];
    
    // Создаем разные размеры блоков
    const numBlocks = 15;
    for (let i = 0; i < numBlocks; i++) {
        const block = document.createElement('div');
        const colorIndex = Math.floor(Math.random() * colors.length);
        const size = 20 + Math.random() * 60; // Размер от 20px до 80px
        
        // Настраиваем стили для блока
        block.className = 'floating-block';
        block.style.position = 'absolute';
        block.style.width = size + 'px';
        block.style.height = size / 3 + 'px'; // Высота в 3 раза меньше ширины
        block.style.backgroundColor = colors[colorIndex].fill;
        block.style.border = `2px solid ${colors[colorIndex].stroke}`;
        block.style.boxShadow = `0 0 10px ${colors[colorIndex].fill}, inset 0 0 5px ${colors[colorIndex].stroke}`;
        block.style.borderRadius = '4px';
        block.style.opacity = '0.2';
        
        // Случайное начальное положение
        const startX = Math.random() * 100; // Процент от ширины контейнера
        const startY = Math.random() * 100; // Процент от высоты контейнера
        block.style.left = startX + '%';
        block.style.top = startY + '%';
        
        // Добавляем блик для эффекта металла
        const highlight = document.createElement('div');
        highlight.style.position = 'absolute';
        highlight.style.top = '20%';
        highlight.style.left = '10%';
        highlight.style.width = '80%';
        highlight.style.height = '20%';
        highlight.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
        highlight.style.borderRadius = '2px';
        block.appendChild(highlight);
        
        // Добавляем блок в контейнер
        backgroundContainer.appendChild(block);
        
        // Анимируем блок
        animateBlock(block);
    }
    
    // Добавляем эффект звезд в фоне
    createStarryBackground(backgroundContainer);
}

// Анимация для отдельного блока
function animateBlock(block) {
    // Начальные значения для анимации
    const duration = 15 + Math.random() * 20; // от 15 до 35 секунд
    const delay = Math.random() * 5; // задержка от 0 до 5 секунд
    
    // Создаем @keyframes анимацию с уникальным именем
    const animationName = 'float-' + Math.floor(Math.random() * 10000);
    const keyframes = `
        @keyframes ${animationName} {
            0% {
                transform: translate(0, 0) rotate(0deg);
            }
            25% {
                transform: translate(${Math.random() * 30 - 15}%, ${Math.random() * 30 - 15}%) rotate(${Math.random() * 20 - 10}deg);
            }
            50% {
                transform: translate(${Math.random() * 30 - 15}%, ${Math.random() * 30 - 15}%) rotate(${Math.random() * 20 - 10}deg);
            }
            75% {
                transform: translate(${Math.random() * 30 - 15}%, ${Math.random() * 30 - 15}%) rotate(${Math.random() * 20 - 10}deg);
            }
            100% {
                transform: translate(0, 0) rotate(0deg);
            }
        }
    `;
    
    // Добавляем стили в head
    const styleElement = document.createElement('style');
    styleElement.innerHTML = keyframes;
    document.head.appendChild(styleElement);
    
    // Применяем анимацию к блоку
    block.style.animation = `${animationName} ${duration}s ease-in-out ${delay}s infinite`;
}

// Создание звездного фона
function createStarryBackground(container) {
    const numStars = 100;
    
    for (let i = 0; i < numStars; i++) {
        const star = document.createElement('div');
        const size = 1 + Math.random() * 2; // Размер от 1px до 3px
        
        // Настраиваем стили для звезды
        star.className = 'star';
        star.style.position = 'absolute';
        star.style.width = size + 'px';
        star.style.height = size + 'px';
        star.style.backgroundColor = '#fff';
        star.style.borderRadius = '50%';
        star.style.boxShadow = '0 0 ' + (size * 2) + 'px #0ff';
        
        // Случайное положение
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        
        // Анимация мерцания
        const animationDuration = 1 + Math.random() * 4;
        star.style.animation = `twinkle ${animationDuration}s ease-in-out infinite`;
        
        // Добавляем звезду в контейнер
        container.appendChild(star);
    }
    
    // Добавляем @keyframes для мерцания
    const twinkleKeyframes = `
        @keyframes twinkle {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 1; }
        }
    `;
    
    const styleElement = document.createElement('style');
    styleElement.innerHTML = twinkleKeyframes;
    document.head.appendChild(styleElement);
}

// Вызываем функцию создания фона при загрузке страницы
window.addEventListener('DOMContentLoaded', function() {
    createStartScreenBackground();
});
