// Основной класс игры Doodle Jump - УПРОЩЕННАЯ ВЕРСИЯ
console.log('🔧 Loading DoodleJumpGame class...');

class DoodleJumpGame {
    constructor() {
        console.log('🎮 Initializing DoodleJumpGame...');
        
        // Инициализация основных компонентов
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) {
            console.error('❌ Canvas element not found!');
            return;
        }
        
        this.ctx = this.canvas.getContext('2d');
        this.assets = new AssetManager();
        this.platformManager = new PlatformManager();
        this.player = new Player();
        
        // Состояние игры
        this.state = 'loading';
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('doodleHighScore')) || 0;
        
        // Система камеры
        this.cameraY = 0;
        this.cameraOffset = 200; // Отступ камеры от верха
        
        // Управление касаниями
        this.isTouching = false;
        
        // Время и анимация
        this.animationId = null;
        this.lastTime = 0;
        this.deltaTime = 0;
        
        // Инициализация
        this.init();
    }

    async init() {
        console.log('🚀 Starting game initialization...');
        
        try {
            // Загрузка ресурсов
            await this.assets.loadAllAssets();
            console.log('✅ Assets loaded successfully');
            
            // Настройка управления
            this.setupControls();
            
            // Настройка интерфейса
            this.setupUI();
            
            // Переход в меню
            this.state = 'menu';
            this.hideElement('loadingScreen');
            this.showElement('startScreen');
            
            // Запуск игрового цикла
            this.gameLoop();
            
            console.log('🎉 Game initialized successfully!');
            
        } catch (error) {
            console.error('❌ Error during game initialization:', error);
            this.showErrorScreen('Failed to initialize game: ' + error.message);
        }
    }

    setupControls() {
        console.log('🎛️ Setting up controls...');
        
        // Клавиатура
        document.addEventListener('keydown', (e) => {
            this.handleKeyDown(e);
        });
        
        document.addEventListener('keyup', (e) => {
            this.handleKeyUp(e);
        });
        
        // Сенсорное управление
        this.setupTouchControls();
        
        // Кнопки интерфейса
        this.setupButtonHandlers();
    }

    handleKeyDown(e) {
        switch(e.code) {
            case 'ArrowLeft':
                this.player.setInput('left', true);
                break;
            case 'ArrowRight':
                this.player.setInput('right', true);
                break;
            case 'Space':
            case 'Enter':
                if (this.state === 'menu') {
                    this.startGame();
                }
                break;
        }
    }

    handleKeyUp(e) {
        switch(e.code) {
            case 'ArrowLeft':
                this.player.setInput('left', false);
                break;
            case 'ArrowRight':
                this.player.setInput('right', false);
                break;
        }
    }

    setupTouchControls() {
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.isTouching = true;
            this.handleTouch(e.touches[0]);
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (this.isTouching) {
                this.handleTouch(e.touches[0]);
            }
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.isTouching = false;
            this.player.clearTargetPosition();
        });
    }

    handleTouch(touch) {
        const canvasRect = this.canvas.getBoundingClientRect();
        const touchX = touch.clientX - canvasRect.left;
        this.player.setTargetPosition(touchX);
    }

    setupButtonHandlers() {
        const startButton = document.getElementById('startButton');
        const restartButton = document.getElementById('restartButton');
        
        if (startButton) {
            startButton.addEventListener('click', () => this.startGame());
        }
        
        if (restartButton) {
            restartButton.addEventListener('click', () => this.restartGame());
        }
    }

    setupUI() {
        this.updateHighScoreDisplay();
    }

    startGame() {
        console.log('🎮 Starting new game...');
        
        this.state = 'playing';
        this.score = 0;
        this.cameraY = 0;
        
        // Сброс компонентов
        this.player.reset();
        this.platformManager.reset();
        this.isTouching = false;
        
        // Обновление интерфейса
        this.hideElement('startScreen');
        this.hideElement('gameOverScreen');
        
        this.updateScoreDisplay();
    }

    restartGame() {
        this.startGame();
    }

    gameOver() {
        console.log('💀 Game Over!');
        
        this.state = 'game_over';
        this.isTouching = false;
        this.player.clearTargetPosition();
        
        // Обновление рекорда
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('doodleHighScore', this.highScore);
        }
        
        // Показ экрана Game Over
        document.getElementById('finalScore').textContent = Math.floor(this.score);
        document.getElementById('gameOverHighScore').textContent = `Best: ${Math.floor(this.highScore)}`;
        this.showElement('gameOverScreen');
    }

    updateScoreDisplay() {
        const scoreDisplay = document.getElementById('scoreDisplay');
        if (scoreDisplay) {
            scoreDisplay.textContent = `Score: ${Math.floor(this.score)} | Best: ${Math.floor(this.highScore)}`;
        }
    }

    updateHighScoreDisplay() {
        const menuHighScore = document.getElementById('menuHighScore');
        if (menuHighScore) {
            menuHighScore.textContent = `Best: ${Math.floor(this.highScore)}`;
        }
    }

    // ОБНОВЛЕННАЯ СИСТЕМА КАМЕРЫ
    updateCamera() {
        // Камера следует за игроком, когда он поднимается выше центра
        if (this.player.y < this.cameraY + this.cameraOffset) {
            this.cameraY = this.player.y - this.cameraOffset;
        }
        
        // Не позволяем камере уходить ниже начальной позиции
        this.cameraY = Math.min(this.cameraY, 0);
    }

    update(currentTime) {
        if (this.lastTime === 0) this.lastTime = currentTime;
        this.deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        if (this.state !== 'playing') return;
        
        // Обновление игрока
        const playerAlive = this.player.update(this.deltaTime);
        if (!playerAlive) {
            this.gameOver();
            return;
        }
        
        // Обновление камеры
        this.updateCamera();
        
        // Проверка столкновений
        const collisionOccurred = this.platformManager.checkCollisions(this.player, currentTime);
        if (collisionOccurred) {
            this.player.onPlatformHit();
            this.player.jump();
        }
        
        // Обновление платформ
        this.platformManager.update(this.player.y, this.deltaTime);
        
        // Обновление счета на основе высоты
        const heightScore = Math.max(0, -this.player.y);
        this.score = Math.max(this.score, heightScore);
        this.updateScoreDisplay();
    }

    // ОБНОВЛЕННАЯ ОТРИСОВКА С УЧЕТОМ КАМЕРЫ
    draw() {
        try {
            // Очистка canvas
            this.clearCanvas();
            
            // Сохраняем контекст для трансформаций камеры
            this.ctx.save();
            
            // Применяем смещение камеры
            this.ctx.translate(0, -this.cameraY);
            
            // Отрисовка игровых объектов с учетом камеры
            this.platformManager.draw(this.ctx, this.assets);
            this.player.draw(this.ctx, this.assets);
            
            // Восстанавливаем контекст
            this.ctx.restore();
            
        } catch (error) {
            console.error('❌ Error in game draw:', error);
        }
    }

    clearCanvas() {
        const background = this.assets.getImage('background');
        
        if (background) {
            // Отрисовываем фон без смещения камеры (фон статичный)
            this.ctx.drawImage(background, 0, 0, this.canvas.width, this.canvas.height);
        } else {
            const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
            gradient.addColorStop(0, '#87CEEB');
            gradient.addColorStop(1, '#E0F7FA');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    gameLoop(currentTime = 0) {
        this.update(currentTime);
        this.draw();
        this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
    }

    showErrorScreen(message) {
        const loadingText = document.getElementById('loadingText');
        if (loadingText) {
            loadingText.textContent = message;
            loadingText.style.color = '#e74c3c';
        }
        this.state = 'menu';
    }

    hideElement(id) {
        const element = document.getElementById(id);
        if (element) element.style.display = 'none';
    }

    showElement(id) {
        const element = document.getElementById(id);
        if (element) element.style.display = 'block';
    }
}

// Явно добавляем класс в глобальную область видимости
window.DoodleJumpGame = DoodleJumpGame;

console.log('✅ DoodleJumpGame class defined');