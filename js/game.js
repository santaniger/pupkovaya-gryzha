// Основной класс игры Doodle Jump - ИСПРАВЛЕННОЕ УПРАВЛЕНИЕ
console.log('🔧 Loading DoodleJumpGame class...');

class DoodleJumpGame {
    constructor() {
        console.log('🎮 Initializing DoodleJumpGame...');
        
        // Включаем отладку
        window.DEBUG_MODE = false;
        window.LOG_PLATFORMS = false;
        
        // Проверяем мобильное устройство
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        console.log('📱 Mobile device:', this.isMobile);
        
        // Инициализация основных компонентов
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) {
            console.error('❌ Canvas element not found!');
            this.showFatalError('Game canvas not found');
            return;
        }
        
        try {
            this.ctx = this.canvas.getContext('2d');
            this.assets = new AssetManager();
            this.platformManager = new PlatformManager();
            this.player = new Player();
        } catch (error) {
            console.error('❌ Error initializing game components:', error);
            this.showFatalError('Failed to initialize game: ' + error.message);
            return;
        }
        
        // Состояние игры
        this.state = 'loading';
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('doodleHighScore')) || 0;
        
        // Система камеры
        this.cameraY = 0;
        this.cameraOffset = 200;
        
        // Система сложности
        this.difficultyLevel = 1;
        this.lastDifficultyUpdate = 0;
        
        // Управление касаниями
        this.isTouching = false;
        this.touchStartX = 0;
        this.lastTouchX = 0;
        
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
            // Обновляем текст загрузки
            this.updateLoadingText('Спрайты гружу...');
            
            // Загрузка ресурсов
            await this.assets.loadAllAssets();
            console.log('✅ Assets loaded successfully');
            
            this.updateLoadingText('Автопрыжок там...');
            
            // Настройка управления
            this.setupControls();
            
            // Настройка интерфейса
            this.setupUI();
            
            // Проверяем начальное состояние
            this.validateInitialState();
            
            this.updateLoadingText('Ща...');
            
            // Переход в меню
            this.state = 'menu';
            
            // Даем время на отрисовку
            setTimeout(() => {
                this.showScreen('startScreen');
                console.log('🎉 Game initialized successfully!');
                
                // Выводим отладочную информацию
                console.log('📊 Initial game state:', this.getDebugInfo());
            }, 500);
            
            // Запуск игрового цикла
            this.gameLoop();
            
        } catch (error) {
            console.error('❌ Error during game initialization:', error);
            this.showFatalError('Failed to initialize game: ' + error.message);
        }
    }

    // Проверка начального состояния
    validateInitialState() {
        console.log('🔍 Validating initial game state...');
        
        const startPlatform = this.platformManager.getStartPlatform();
        if (!startPlatform) {
            console.error('❌ No start platform found!');
            this.platformManager.generateInitialPlatforms();
            return false;
        }
        
        console.log('✅ Start platform found:', {
            x: startPlatform.x,
            y: startPlatform.y,
            type: startPlatform.type
        });
        
        // Проверяем позицию игрока
        console.log('✅ Player position:', {
            x: this.player.x,
            y: this.player.y,
            width: this.player.width,
            height: this.player.height
        });
        
        // Проверяем, находится ли игрок над стартовой платформой
        const playerOnPlatform = 
            this.player.y + this.player.height <= startPlatform.y + startPlatform.height &&
            this.player.y + this.player.height >= startPlatform.y;
            
        console.log(`✅ Player on platform: ${playerOnPlatform}`);
        
        if (!playerOnPlatform) {
            console.warn('⚠️ Adjusting player position to be on start platform');
            this.player.y = startPlatform.y - this.player.height;
        }
        
        return true;
    }

    updateLoadingText(text) {
        const loadingText = document.getElementById('loadingText');
        if (loadingText) {
            loadingText.textContent = text;
        }
    }

    setupControls() {
        console.log('🎛️ Setting up controls...');
        
        // Клавиатура (для десктопа)
        if (!this.isMobile) {
            document.addEventListener('keydown', (e) => {
                this.handleKeyDown(e);
            });
            
            document.addEventListener('keyup', (e) => {
                this.handleKeyUp(e);
            });
        }
        
        // Сенсорное управление (основное для мобильных)
        this.setupTouchControls();
        
        // Кнопки интерфейса
        this.setupButtonHandlers();
    }

    setupTouchControls() {
        // Более надежная обработка касаний для мобильных
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.state === 'playing') {
                this.isTouching = true;
                const touch = e.touches[0];
                this.touchStartX = touch.clientX;
                this.lastTouchX = touch.clientX;
                this.handleTouch(touch);
            }
        }, { passive: false });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (this.state === 'playing' && this.isTouching) {
                const touch = e.touches[0];
                this.handleTouch(touch);
            }
        }, { passive: false });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.isTouching = false;
            this.player.clearTargetPosition();
        }, { passive: false });
        
        this.canvas.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            this.isTouching = false;
            this.player.clearTargetPosition();
        }, { passive: false });
    }

    // ИСПРАВЛЕННОЕ УПРАВЛЕНИЕ - точное следование за пальцем
    handleTouch(touch) {
        const canvasRect = this.canvas.getBoundingClientRect();
        
        // Вычисляем позицию касания относительно canvas
        const touchX = touch.clientX - canvasRect.left;
        
        // Ограничиваем позицию в пределах canvas
        const clampedX = Math.max(0, Math.min(touchX, this.canvas.width));
        
        // Устанавливаем точную позицию игрока (центрируем под пальцем)
        this.player.setExactPosition(clampedX);
        
        this.lastTouchX = touch.clientX;
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

    setupButtonHandlers() {
        const startButton = document.getElementById('startButton');
        const restartButton = document.getElementById('restartButton');
        const shareButton = document.getElementById('shareButton');
        const victoryRestartButton = document.getElementById('victoryRestartButton');
        const victoryShareButton = document.getElementById('victoryShareButton');
        
        if (startButton) {
            startButton.addEventListener('click', () => this.startGame());
            startButton.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.startGame();
            });
        }
        
        if (restartButton) {
            restartButton.addEventListener('click', () => this.restartGame());
            restartButton.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.restartGame();
            });
        }
        
        if (shareButton) {
            shareButton.addEventListener('click', () => this.shareScore());
            shareButton.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.shareScore();
            });
        }
        
        // НОВЫЕ ОБРАБОТЧИКИ ДЛЯ ЭКРАНА ПОБЕДЫ
        if (victoryRestartButton) {
            victoryRestartButton.addEventListener('click', () => this.restartGame());
            victoryRestartButton.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.restartGame();
            });
        }
        
        if (victoryShareButton) {
            victoryShareButton.addEventListener('click', () => this.shareVictory());
            victoryShareButton.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.shareVictory();
            });
        }
    }

    setupUI() {
        this.updateHighScoreDisplay();
    }

    // ИСПРАВЛЕННОЕ УПРАВЛЕНИЕ ЭКРАНАМИ
    showScreen(screenId) {
        console.log(`🖥️ Showing screen: ${screenId}`);
        
        // Скрываем все экраны
        const screens = ['loadingScreen', 'startScreen', 'gameOverScreen', 'victoryScreen'];
        screens.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.style.display = 'none';
            }
        });
        
        // Показываем нужный экран
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.style.display = 'flex';
        } else {
            console.error(`❌ Screen not found: ${screenId}`);
        }
    }

    startGame() {
        console.log('🎮 Starting new game...');
        
        this.state = 'playing';
        this.score = 0;
        this.cameraY = 0;
        this.victoryAchieved = false; // Сбрасываем флаг победы
        
        // Сброс компонентов
        this.player.reset();
        this.platformManager.reset();
        this.isTouching = false;
        
        // Автоматический первый прыжок
        setTimeout(() => {
            this.player.jump();
            console.log('🦘 Auto jump at game start');
        }, 100);
        
        // Обновление интерфейса
        this.hideAllScreens();
        
        this.updateScoreDisplay();
    }

    restartGame() {
        console.log('🔄 Restarting game...');
        this.startGame();
    }

    shareVictory() {
        const shareText = `🎉 I reached ${Math.floor(this.score)} points and completed Doodle Jump! Can you beat my score?`;
        
        if (navigator.share) {
            navigator.share({
                title: 'Doodle Jump Victory!',
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
        
        // Показ экрана Game Over с изображением
        document.getElementById('finalScore').textContent = `Дорос до ЗП:\n${Math.floor(this.score)} к/наносек`;
        document.getElementById('gameOverHighScore').textContent = `Рекордная премия:\n${Math.floor(this.highScore)} к/наносек`;
        
        // Показываем PNG изображение
        this.showGameOverImage();
        
        this.showScreen('gameOverScreen');
        
        // Отправка счета в Telegram
        this.sendTelegramScore();
    }
    
    // Новый метод для отображения PNG изображения
    showGameOverImage() {
        const gameOverImage = document.getElementById('gameOverImage');
        if (gameOverImage) {
            // Показываем изображение (оно уже загружено с правильным src)
            gameOverImage.style.display = 'block';
            
            // Добавляем обработчик ошибки загрузки
            gameOverImage.onerror = () => {
                console.warn('⚠️ Game over PNG failed to load, hiding image');
                gameOverImage.style.display = 'none';
            };
            
            // Проверяем загрузилось ли изображение
            if (!gameOverImage.complete || gameOverImage.naturalHeight === 0) {
                console.log('🔄 Game over image still loading...');
                gameOverImage.onload = () => {
                    console.log('✅ Game over PNG loaded successfully');
                };
            }
        }
    }
    
    // Новый метод для установки изображения Game Over
    setGameOverImage() {
        const gameOverImage = document.getElementById('gameOverImage');
        const gameOverCanvas = this.assets.getImage('gameOver');
        
        if (gameOverImage && gameOverCanvas) {
            // Конвертируем canvas в data URL и устанавливаем как src
            gameOverImage.src = gameOverCanvas.toDataURL();
        } else {
            console.warn('⚠️ Game over image not found, using fallback');
            // Fallback - скрываем изображение если нет
            if (gameOverImage) {
                gameOverImage.style.display = 'none';
            }
        }
    }

    hideAllScreens() {
        const screens = ['loadingScreen', 'startScreen', 'gameOverScreen', 'victoryScreen'];
        screens.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.style.display = 'none';
            }
        });
    }

    updateCamera() {
        // Камера следует за игроком, когда он поднимается выше центра
        if (this.player.y < this.cameraY + this.cameraOffset) {
            this.cameraY = this.player.y - this.cameraOffset;
        }
        
        // Не позволяем камере уходить ниже начальной позиции
        this.cameraY = Math.min(this.cameraY, 0);
        
        if (window.DEBUG_MODE) {
            console.log(`📷 Camera: ${Math.round(this.cameraY)}, Player: ${Math.round(this.player.y)}`);
        }
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

        if (this.lastTime === 0) this.lastTime = currentTime;
        this.deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        if (this.state !== 'playing') return;
        
        // ПРОВЕРКА ПОБЕДЫ
        if (!this.victoryAchieved && this.score >= this.victoryScore) {
            this.victory();
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
        
        // Обновление платформ - передаем позицию игрока для генерации
        this.platformManager.update(this.player.y, this.deltaTime);
        const highestPlatform = this.platformManager.getHighestPlatform();
        if (highestPlatform && this.player.y < highestPlatform.y + 300) {
            console.log('🚨 Player close to top - forcing platform generation');
            this.platformManager.generateInfinitePlatforms(this.player.y);
        }
        
        // Обновление счета
        const heightScore = Math.max(0, -this.player.y);
        this.score = Math.max(this.score, heightScore);
        
        this.updateScoreDisplay();
        
        // Отладочная информация каждые 2 секунды
        if (window.DEBUG_MODE && currentTime % 2000 < 16) {
            console.log('📊 Game state:', this.getDebugInfo());
            const platformInfo = this.platformManager.getDebugInfo();
            console.log('📈 Platform distribution:', platformInfo.distribution);
        }
    }
    
    sendTelegramVictory() {
        if (window.tg && typeof window.tg.sendData === 'function') {
            try {
                window.tg.sendData(JSON.stringify({
                    action: 'victory',
                    score: Math.floor(this.score),
                    highScore: Math.floor(this.highScore),
                    victoryScore: this.victoryScore,
                    timestamp: Date.now()
                }));
            } catch (error) {
                console.log('Could not send victory to Telegram:', error);
            }
        }
    }

    victory() {
        console.log('🎉 Victory achieved! Score:', Math.floor(this.score));
        
        this.victoryAchieved = true;
        this.state = 'victory';
        this.isTouching = false;
        this.player.clearTargetPosition();
        
        // Обновление рекорда
        const isNewHighScore = this.score > this.highScore;
        if (isNewHighScore) {
            this.highScore = this.score;
            localStorage.setItem('doodleHighScore', this.highScore);
        }
        
        // Обновление экрана победы
        document.getElementById('victoryScore').textContent = `Final Score: ${Math.floor(this.score)}`;
        document.getElementById('victoryHighScore').textContent = 
            isNewHighScore ? `New Best: ${Math.floor(this.highScore)}` : `Best: ${Math.floor(this.highScore)}`;
        
        this.showScreen('victoryScreen');
        
        // Отправка победы в Telegram
        this.sendTelegramVictory();
    }

    updateDifficulty() {
        const difficultyThreshold = 500; // Увеличиваем сложность каждые 500 очков
        const newDifficulty = Math.floor(this.score / difficultyThreshold) + 1;
        
        if (newDifficulty > this.difficultyLevel) {
            this.difficultyLevel = newDifficulty;
            console.log(`🎯 Difficulty increased to level ${this.difficultyLevel}`);
            
            // Можно добавить эффекты увеличения сложности здесь
            // Например: увеличить скорость движения платформ, уменьшить промежутки и т.д.
        }
    }

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
            
            // Отладочная информация на холсте
            if (window.DEBUG_MODE) {
                this.drawDebugInfo();
            }
            
            // Восстанавливаем контекст
            this.ctx.restore();
            
        } catch (error) {
            console.error('❌ Error in game draw:', error);
        }
    }

    drawDebugInfo() {
        this.ctx.fillStyle = 'white';
        this.ctx.font = '12px Arial';
        
        this.ctx.fillText(`Player: ${Math.round(this.player.x)}, ${Math.round(this.player.y)}`, 10, 20);
        this.ctx.fillText(`Velocity: ${this.player.velocityY.toFixed(1)}`, 10, 40);
        this.ctx.fillText(`Camera: ${Math.round(this.cameraY)}`, 10, 60);
        this.ctx.fillText(`Score: ${Math.round(this.score)}`, 10, 80);
        
        const platformInfo = this.platformManager.getDebugInfo();
        this.ctx.fillText(`Platforms: ${platformInfo.totalPlatforms}`, 10, 100);
        this.ctx.fillText(`Highest: ${platformInfo.highestPlatformY}`, 10, 120);
    }

    getDebugInfo() {
        const platformInfo = this.platformManager.getDebugInfo();
        
        return {
            game: {
                state: this.state,
                score: Math.round(this.score),
                cameraY: Math.round(this.cameraY),
                difficulty: this.difficultyLevel
            },
            player: this.player.getDebugInfo(),
            platforms: platformInfo
        };
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

    // Поделиться результатом
    shareScore() {
        const shareText = `🎯 Я получил оффер на ${Math.floor(this.score)} к/наносек в Грыжа Jump! Рад за меня?`;
        
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
            alert('Ну скопировал, а куда это отправлять то?) 📋');
        } catch (error) {
            console.log('Clipboard copy failed:', error);
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            alert('Ну скопировал, а куда это отправлять то?) 📋');
        }
    }

    // Обновление отображения счета
    updateScoreDisplay() {
        const scoreDisplay = document.getElementById('scoreDisplay');
        if (scoreDisplay) {
            scoreDisplay.textContent = `ЗП: ${Math.floor(this.score)} | Рекорд: ${Math.floor(this.highScore)}`;
        }
    }

    // Обновление отображения рекорда
    updateHighScoreDisplay() {
        const menuHighScore = document.getElementById('menuHighScore');
        if (menuHighScore) {
            menuHighScore.textContent = `Рекорд: ${Math.floor(this.highScore)}`;
        }
    }

    showFatalError(message) {
        const loadingScreen = document.getElementById('loadingScreen');
        const loadingText = document.getElementById('loadingText');
        
        if (loadingScreen && loadingText) {
            loadingText.textContent = message;
            loadingText.style.color = '#e74c3c';
            loadingText.style.fontSize = '16px';
            
            // Добавляем кнопку перезагрузки
            const reloadButton = document.createElement('button');
            reloadButton.textContent = 'Reload Game';
            reloadButton.className = 'button';
            reloadButton.style.marginTop = '20px';
            reloadButton.onclick = () => window.location.reload();
            
            loadingScreen.appendChild(reloadButton);
        }
    }
}

window.DoodleJumpGame = DoodleJumpGame;
console.log('✅ DoodleJumpGame class defined');