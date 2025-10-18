// game.js
// Основной класс игры Doodle Jump
console.log('🔧 Loading DoodleJumpGame class...');

class DoodleJumpGame {
    constructor() {
        console.log('🎮 Initializing DoodleJumpGame...');
        
        // Инициализация основных компонентов
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.assets = new AssetManager();
        this.platformManager = new PlatformManager();
        this.player = new Player();
        
        // Состояние игры
        this.state = GameState.LOADING;
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('doodleHighScore')) || 0;
        this.distance = 0;
        
        // Управление касаниями
        this.isTouching = false;
        this.touchId = null;
        
        // Время и анимация
        this.animationId = null;
        this.lastTime = 0;
        this.deltaTime = 0;
        this.currentTime = 0;
        this.frameCount = 0;
        
        // Статистика для отладки
        this.stats = {
            totalFrames: 0,
            collisionHistory: [],
            jumpSequence: [],
            gameStartTime: 0,
            initializationTime: 0
        };
        
        // Инициализация
        this.init();
    }

    // В методе init исправляем загрузку ассетов
    async init() {
        console.log('🚀 Starting game initialization...');
        this.stats.initializationTime = Date.now();
        
        try {
            // Загрузка ресурсов с проверкой ошибок
            if (!this.assets || typeof this.assets.loadAllAssets !== 'function') {
                throw new Error('AssetManager not available');
            }
            
            const assetsLoaded = await this.assets.loadAllAssets();
            if (!assetsLoaded || !this.assets.isLoaded()) {
                throw new Error('Assets failed to load');
            }
            
            console.log('✅ Assets loaded successfully');
            
            // Настройка управления
            this.setupControls();
            
            // Настройка интерфейса
            this.setupUI();
            
            // Проверка начального состояния
            this.validateInitialState();
            
            // Запуск игрового цикла
            this.gameLoop();
            
            const initTime = Date.now() - this.stats.initializationTime;
            console.log(`🎉 Game initialized successfully in ${initTime}ms!`);
            
        } catch (error) {
            console.error('❌ Error during game initialization:', error);
            this.showErrorScreen('Failed to initialize game: ' + error.message);
        }
    }

   // game.js - ЗАМЕНИТЬ метод validateInitialState
    // Проверка начального состояния - ИСПРАВЛЕННАЯ ВЕРСИЯ БЕЗ РЕКУРСИИ
    validateInitialState() {
        console.log('🔍 Validating initial game state...');
        
        // Добавляем счетчик попыток для предотвращения бесконечного цикла
        if (!this.validationAttempts) {
            this.validationAttempts = 0;
        }
        this.validationAttempts++;
        
        if (this.validationAttempts > 5) {
            console.error('❌ Too many validation attempts, aborting!');
            this.validationAttempts = 0;
            return false;
        }
        
        // Сначала проверяем позицию игрока
        if (isNaN(this.player.x) || isNaN(this.player.y)) {
            console.error('❌ Player has invalid position!', {
                x: this.player.x,
                y: this.player.y
            });
            
            // Экстренное исправление позиции игрока
            this.player.x = CONFIG.CANVAS.WIDTH / 2 - this.player.width / 2;
            this.player.y = CONFIG.CANVAS.HEIGHT - 150;
            this.player.isOnPlatform = true;
            console.log('🔄 Emergency player position fix applied');
        }
        
        const startPlatform = this.platformManager.getStartPlatform();
        if (!startPlatform) {
            console.error('❌ Start platform not found!');
            
            // Создаем экстренную платформу без рекурсивного вызова
            const emergencyPlatform = new Platform(
                CONFIG.CANVAS.WIDTH / 2 - CONFIG.PLATFORMS.WIDTH / 2,
                CONFIG.CANVAS.HEIGHT - 100,
                PlatformType.NORMAL
            );
            this.platformManager.platforms.unshift(emergencyPlatform);
            console.log('🔄 Emergency start platform created');
            
            // Сбрасываем счетчик и возвращаем успех после однократного исправления
            this.validationAttempts = 0;
            return true;
        }
        
        // Проверяем позицию стартовой платформы
        if (isNaN(startPlatform.x) || isNaN(startPlatform.y)) {
            console.error('❌ Start platform has invalid position!', {
                x: startPlatform.x,
                y: startPlatform.y
            });
            
            // Исправляем позицию платформы
            startPlatform.x = CONFIG.CANVAS.WIDTH / 2 - CONFIG.PLATFORMS.WIDTH / 2;
            startPlatform.y = CONFIG.CANVAS.HEIGHT - 100;
            console.log('🔄 Start platform position fixed');
        }
        
        const playerOnPlatform = 
            this.player.y + this.player.height <= startPlatform.y + startPlatform.height &&
            this.player.y + this.player.height >= startPlatform.y &&
            this.player.x + this.player.width > startPlatform.x &&
            this.player.x < startPlatform.x + startPlatform.width;
            
        console.log('📊 Initial state validation:', {
            startPlatform: {
                x: startPlatform.x,
                y: startPlatform.y,
                width: startPlatform.width,
                height: startPlatform.height
            },
            player: {
                x: this.player.x,
                y: this.player.y,
                width: this.player.width,
                height: this.player.height
            },
            playerBottom: this.player.y + this.player.height,
            platformTop: startPlatform.y,
            playerOnPlatform: playerOnPlatform
        });
        
        if (!playerOnPlatform) {
            console.warn('⚠️ Player not properly positioned on start platform');
            
            // Автоматическая корректировка позиции
            const targetY = startPlatform.y - this.player.height;
            console.log(`🔄 Auto-correcting player position from ${this.player.y} to ${targetY}`);
            
            this.player.y = targetY;
            this.player.isOnPlatform = true;
            this.player.velocityY = 0;
            
            // Повторная проверка после корректировки
            const corrected = 
                this.player.y + this.player.height <= startPlatform.y + startPlatform.height &&
                this.player.y + this.player.height >= startPlatform.y;
                
            console.log(`✅ Position correction ${corrected ? 'successful' : 'failed'}`);
        }
        
        // Финальная проверка всех платформ
        this.platformManager.validatePlatforms();
        
        // Сбрасываем счетчик при успешной валидации
        this.validationAttempts = 0;
        
        return true;
    }

    // Показать экран ошибки
    showErrorScreen(message) {
        const loadingScreen = document.getElementById('loadingScreen');
        const loadingText = document.getElementById('loadingText');
        
        if (loadingScreen && loadingText) {
            loadingText.textContent = message;
            loadingText.style.color = '#e74c3c';
            loadingScreen.style.borderColor = '#e74c3c';
        }
        
        this.state = GameState.MENU;
    }

    // Настройка элементов управления
    setupControls() {
        console.log('🎛️ Setting up controls...');
        
        // Клавиатура (резервное управление)
        document.addEventListener('keydown', (e) => {
            this.handleKeyDown(e);
        });
        
        document.addEventListener('keyup', (e) => {
            this.handleKeyUp(e);
        });
        
        // Сенсорное управление - ОСНОВНОЕ
        this.setupTouchControls();
        
        // Гироскоп (если доступен)
        this.setupGyroControls();
        
        // Кнопки интерфейса
        this.setupButtonHandlers();
        
        console.log('✅ Controls setup complete');
    }

    // Обработка нажатия клавиш
    handleKeyDown(e) {
        switch(e.code) {
            case 'ArrowLeft':
                this.player.setInput('left', true);
                break;
            case 'ArrowRight':
                this.player.setInput('right', true);
                break;
            case 'Space':
                if (this.state === GameState.MENU) {
                    this.startGame();
                }
                break;
            case 'Escape':
                if (this.state === GameState.PLAYING) {
                    this.pauseGame();
                }
                break;
        }
    }

    // Обработка отпускания клавиш
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

    // Настройка сенсорного управления
    setupTouchControls() {
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.state === GameState.PLAYING && e.touches.length > 0) {
                this.isTouching = true;
                this.touchId = e.touches[0].identifier;
                this.handleTouch(e.touches[0]);
            }
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (this.state === GameState.PLAYING && this.isTouching) {
                for (let touch of e.touches) {
                    if (touch.identifier === this.touchId) {
                        this.handleTouch(touch);
                        break;
                    }
                }
            }
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (this.state === GameState.PLAYING) {
                this.isTouching = false;
                this.touchId = null;
                this.player.clearTargetPosition();
            }
        });
        
        this.canvas.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            if (this.state === GameState.PLAYING) {
                this.isTouching = false;
                this.touchId = null;
                this.player.clearTargetPosition();
            }
        });
        
        this.canvas.addEventListener('click', (e) => {
            if (this.state === GameState.MENU) {
                this.startGame();
            }
        });
    }

    // Обработка касания
    handleTouch(touch) {
        const canvasRect = this.canvas.getBoundingClientRect();
        const touchX = touch.clientX - canvasRect.left;
        
        const clampedX = Math.max(0, Math.min(touchX, this.canvas.width));
        this.player.setTargetPosition(clampedX);
    }

    // Настройка гироскопа
    setupGyroControls() {
        if (window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', (e) => {
                if (this.state === GameState.PLAYING && !this.isTouching) {
                    this.player.handleDeviceTilt(e.gamma);
                }
            });
        }
    }

    // Настройка обработчиков кнопок
    setupButtonHandlers() {
        document.getElementById('startButton').addEventListener('click', () => this.startGame());
        document.getElementById('restartButton').addEventListener('click', () => this.restartGame());
        document.getElementById('shareButton').addEventListener('click', () => this.shareScore());
        
        document.getElementById('startButton').addEventListener('touchend', (e) => {
            e.preventDefault();
            this.startGame();
        });
        
        document.getElementById('restartButton').addEventListener('touchend', (e) => {
            e.preventDefault();
            this.restartGame();
        });
        
        document.getElementById('shareButton').addEventListener('touchend', (e) => {
            e.preventDefault();
            this.shareScore();
        });
    }

    // Настройка UI
    setupUI() {
        this.updateHighScoreDisplay();
        this.addMobileInstructions();
    }

    // Добавление инструкций для мобильных устройств
    addMobileInstructions() {
        const controlsInfo = document.querySelector('.controls');
        if (controlsInfo) {
            controlsInfo.innerHTML = '<p><strong>Controls:</strong><br>Touch and drag to move</p>';
        }
    }

    // game.js - ЗАМЕНИТЬ метод startGame
    // Начало игры - ИСПРАВЛЕННАЯ ВЕРСИЯ БЕЗ РЕКУРСИИ
    startGame() {
        console.log('🎮 Starting new game...');
        
        this.state = GameState.PLAYING;
        this.score = 0;
        this.distance = 0;
        
        // Сбрасываем счетчик валидации
        this.validationAttempts = 0;
        
        // Сбрасываем компоненты
        this.player.reset();
        this.platformManager.reset();
        this.isTouching = false;
        this.touchId = null;
        
        // Сброс статистики
        this.stats.gameStartTime = Date.now();
        this.stats.collisionHistory = [];
        this.stats.jumpSequence = [];
        this.frameCount = 0;
        
        // Обновление интерфейса
        document.getElementById('startScreen').style.display = 'none';
        document.getElementById('gameOverScreen').style.display = 'none';
        
        this.updateScoreDisplay();
        
        // Проверка начального состояния с задержкой для гарантии инициализации
        setTimeout(() => {
            try {
                const validationResult = this.validateInitialState();
                if (!validationResult) {
                    console.error('❌ Game validation failed! Attempting recovery...');
                    this.emergencyRecovery();
                } else {
                    console.log('✅ Game started successfully!');
                }
            } catch (error) {
                console.error('💥 Error during validation:', error);
                this.emergencyRecovery();
            }
        }, 50);
    }

    // ДОБАВИТЬ метод emergencyRecovery
    emergencyRecovery() {
        console.log('🚨 Emergency recovery initiated...');
        
        // Полный сброс всех компонентов
        this.platformManager.platforms = [];
        this.platformManager.generateInitialPlatforms();
        
        this.player.x = CONFIG.CANVAS.WIDTH / 2 - this.player.width / 2;
        this.player.y = CONFIG.CANVAS.HEIGHT - 150;
        this.player.velocityX = 0;
        this.player.velocityY = 0;
        this.player.isOnPlatform = true;
        
        console.log('🔄 Emergency recovery completed');
        
        // Повторная проверка
        setTimeout(() => {
            const recovered = this.validateInitialState();
            console.log(`🔄 Emergency recovery ${recovered ? 'successful' : 'failed'}`);
        }, 100);
    }

    // Рестарт игры
    restartGame() {
        console.log('🔄 Restarting game...');
        this.startGame();
    }

    // Пауза игры
    pauseGame() {
        if (this.state === GameState.PLAYING) {
            this.state = GameState.PAUSED;
        } else if (this.state === GameState.PAUSED) {
            this.state = GameState.PLAYING;
        }
    }

    // Конец игры
    gameOver() {
        console.log('💀 Game Over!', {
            score: Math.floor(this.score),
            distance: Math.floor(this.distance),
            totalJumps: this.player.stats.totalJumps,
            playTime: Date.now() - this.stats.gameStartTime
        });
        
        this.state = GameState.GAME_OVER;
        this.isTouching = false;
        this.touchId = null;
        this.player.clearTargetPosition();
        
        // Обновление рекорда
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('doodleHighScore', this.highScore);
        }
        
        // Показ экрана Game Over
        document.getElementById('finalScore').textContent = Math.floor(this.score);
        document.getElementById('gameOverHighScore').textContent = `Best: ${Math.floor(this.highScore)}`;
        document.getElementById('gameOverScreen').style.display = 'block';
        
        // Отправка результата в Telegram
        this.sendTelegramScore();
    }

    // Отправка счета в Telegram
    sendTelegramScore() {
        if (window.tg && typeof window.tg.sendData === 'function') {
            try {
                window.tg.sendData(JSON.stringify({
                    action: 'gameOver',
                    score: Math.floor(this.score),
                    highScore: Math.floor(this.highScore),
                    timestamp: Date.now()
                }));
            } catch (error) {
                console.log('Could not send score to Telegram:', error);
            }
        }
    }

    // Обновление отображения счета
    updateScoreDisplay() {
        const scoreDisplay = document.getElementById('scoreDisplay');
        if (scoreDisplay) {
            scoreDisplay.textContent = `Score: ${Math.floor(this.score)} | Best: ${Math.floor(this.highScore)}`;
        }
    }

    // Обновление отображения рекорда
    updateHighScoreDisplay() {
        const menuHighScore = document.getElementById('menuHighScore');
        if (menuHighScore) {
            menuHighScore.textContent = `Best: ${Math.floor(this.highScore)}`;
        }
    }

    // Обновление игровой логики - ИСПРАВЛЕННАЯ ВЕРСИЯ
    update(currentTime) {
        try {
            this.currentTime = currentTime;
            this.frameCount++;
            this.stats.totalFrames++;
            
            // Расчет времени между кадрами
            if (this.lastTime === 0) this.lastTime = currentTime;
            this.deltaTime = (currentTime - this.lastTime) / 1000;
            this.lastTime = currentTime;
            
            if (this.state !== GameState.PLAYING) return;
            
            // Сохраняем предыдущую скорость для отладки
            const previousVelocityY = this.player.velocityY;
            
            // Обновление игрока
            const playerAlive = this.player.update(this.deltaTime);
            if (!playerAlive) {
                this.gameOver();
                return;
            }
            
            // Проверка столкновений с платформами
            const collisionOccurred = this.platformManager.checkCollisions(this.player, currentTime);
            if (collisionOccurred) {
                // Записываем в историю коллизий
                this.stats.collisionHistory.push({
                    time: currentTime,
                    frame: this.frameCount,
                    velocityBefore: previousVelocityY,
                    velocityAfter: this.player.velocityY,
                    playerY: this.player.y
                });
                
                // Держим только последние 10 коллизий
                if (this.stats.collisionHistory.length > 10) {
                    this.stats.collisionHistory.shift();
                }
                
                if (window.LOG_COLLISION) {
                    console.log('🔄 Processing platform collision...', {
                        frame: this.frameCount,
                        velocityBefore: previousVelocityY.toFixed(2),
                        velocityAfter: this.player.velocityY.toFixed(2),
                        playerY: this.player.y.toFixed(1)
                    });
                }
                
                // Сбрасываем состояние игрока
                this.player.onPlatformHit();
                
                // ВЫПОЛНЯЕМ ПРЫЖОК после приземления
                const jumpResult = this.player.jump();
                
                if (window.LOG_JUMP && jumpResult) {
                    console.log('🎯 Collision jump executed', {
                        velocityY: this.player.velocityY,
                        expected: CONFIG.PLAYER.JUMP_FORCE,
                        match: this.player.velocityY === CONFIG.PLAYER.JUMP_FORCE
                    });
                }
            }
            
            // Обновление платформ и получение очков
            const scrollAmount = this.platformManager.update(this.player.y, this.deltaTime);
            if (scrollAmount > 0) {
                this.distance += scrollAmount;
                this.score += scrollAmount * CONFIG.GAME.SCORE_MULTIPLIER;
                this.updateScoreDisplay();
            }
            
            // Обновление debug панели
            if (window.DEBUG_MODE) {
                this.updateDebugPanel();
            }
            
            // Мониторинг аномалий
            this.monitorAnomalies();
            
        } catch (error) {
            console.error('❌ Error in game update:', error);
        }
    }

    // Мониторинг аномалий
    monitorAnomalies() {
        // Проверка на аномальную скорость
        if (Math.abs(this.player.velocityY) > 15) {
            console.error('🚨 VELOCITY ANOMALY DETECTED!', {
                velocityY: this.player.velocityY,
                frame: this.frameCount,
                jumpCount: this.player.jumpCount,
                recentJumps: this.player.stats.jumpHistory.slice(-3)
            });
        }
        
        // Проверка на застревание в падении
        if (this.player.velocityY > 5 && this.frameCount > 60) {
            const recentCollisions = this.stats.collisionHistory.slice(-5);
            if (recentCollisions.length === 0) {
                console.warn('⚠️ Player falling without collisions - possible platform miss');
            }
        }
    }

    // Обновление debug панели
    updateDebugPanel() {
        const debugPanel = document.getElementById('debugPanel');
        if (!debugPanel) return;
        
        const playerInfo = this.player.getDebugInfo();
        const platformInfo = this.platformManager.getDebugInfo();
        
        debugPanel.innerHTML = `
            <div>Frame: ${this.frameCount}</div>
            <div>State: ${this.state}</div>
            <div>Pos: ${playerInfo.position.x}, ${playerInfo.position.y}</div>
            <div>VelY: ${playerInfo.velocity.y}</div>
            <div>OnPlatform: ${playerInfo.state.isOnPlatform}</div>
            <div>Jumps: ${playerInfo.stats.totalJumps}</div>
            <div>Platforms: ${platformInfo.totalPlatforms}</div>
            <div>Score: ${Math.floor(this.score)}</div>
        `;
    }

    // Отрисовка игры
    draw() {
        try {
            // Очистка canvas
            this.clearCanvas();
            
            // Отрисовка фона
            this.drawBackground();
            
            // Отрисовка игровых объектов
            this.platformManager.draw(this.ctx, this.assets);
            this.player.draw(this.ctx, this.assets);
            
            // Отрисовка UI поверх игры
            this.drawUI();
            
        } catch (error) {
            console.error('❌ Error in game draw:', error);
        }
    }

    // Очистка canvas
    clearCanvas() {
        const background = this.assets.getImage('background');
        
        if (background && background.complete && background.naturalWidth !== 0) {
            this.ctx.drawImage(background, 0, 0, this.canvas.width, this.canvas.height);
        } else {
            const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
            gradient.addColorStop(0, CONFIG.COLORS.BACKGROUND_TOP);
            gradient.addColorStop(1, CONFIG.COLORS.BACKGROUND_BOTTOM);
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    // Отрисовка фона
    drawBackground() {
        // Можно добавить параллакс-эффект или другие элементы фона
    }

    // Отрисовка UI
    drawUI() {
        // Основной UI уже отрисовывается HTML-элементами
    }

    // Основной игровой цикл - ИСПРАВЛЕННАЯ ВЕРСИЯ
    gameLoop(currentTime = 0) {
        try {
            this.update(currentTime);
            this.draw();
            this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
        } catch (error) {
            console.error('💥 Fatal error in game loop:', error);
            // Попытка восстановить игровой цикл
            setTimeout(() => {
                this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
            }, 100);
        }
    }

    // Поделиться результатом
    shareScore() {
        const shareText = `🎯 I scored ${Math.floor(this.score)} points in Doodle Jump! Can you beat my score?`;
        
        if (navigator.share) {
            navigator.share({
                title: 'Doodle Jump',
                text: shareText,
                url: window.location.href
            }).catch(error => {
                console.log('Share cancelled:', error);
                this.copyToClipboard(shareText);
            });
        } else if (window.tg && typeof window.tg.shareUrl === 'function') {
            window.tg.shareUrl(window.location.href, shareText);
        } else {
            this.copyToClipboard(shareText);
        }
    }

    // Копирование в буфер обмена
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            alert('Score copied to clipboard! 📋');
        } catch (error) {
            console.log('Clipboard copy failed:', error);
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            alert('Score copied to clipboard! 📋');
        }
    }

    // Остановка игры
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }
    
    // Методы для отладки
    getDebugStats() {
        return {
            game: {
                state: this.state,
                score: this.score,
                distance: this.distance,
                frameCount: this.frameCount
            },
            player: this.player.getDebugInfo(),
            platforms: this.platformManager.getDebugInfo(),
            collisions: this.stats.collisionHistory.length,
            recentCollisions: this.stats.collisionHistory.slice(-3)
        };
    }
}

console.log('✅ DoodleJumpGame class defined');