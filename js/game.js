// Основной класс игры Doodle Jump
class DoodleJumpGame {
    constructor() {
        console.log('Initializing DoodleJumpGame...');
        
        // Инициализация основных компонентов
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.assets = new AssetManager();
        this.platformManager = new PlatformManager();
        this.player = new Player();
        
        // Состояние игры
        this.state = GameState.MENU;
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('doodleHighScore')) || 0;
        this.distance = 0;
        
        // Время и анимация
        this.animationId = null;
        this.lastTime = 0;
        this.deltaTime = 0;
        
        // Инициализация
        this.init();
    }

    // Инициализация игры
    async init() {
        console.log('Starting game initialization...');
        
        try {
            // Загрузка ресурсов
            await this.assets.loadAllAssets();
            console.log('Assets loaded successfully');
            
            // Настройка управления
            this.setupControls();
            
            // Настройка интерфейса
            this.setupUI();
            
            // Запуск игрового цикла
            this.gameLoop();
            
            console.log('Game initialized successfully!');
            
        } catch (error) {
            console.error('Error during game initialization:', error);
        }
    }

    // Настройка элементов управления
    setupControls() {
        // Клавиатура
        document.addEventListener('keydown', (e) => {
            this.handleKeyDown(e);
        });
        
        document.addEventListener('keyup', (e) => {
            this.handleKeyUp(e);
        });
        
        // Сенсорное управление
        this.setupTouchControls();
        
        // Гироскоп (если доступен)
        this.setupGyroControls();
        
        // Кнопки интерфейса
        this.setupButtonHandlers();
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
            const touchX = e.touches[0].clientX;
            this.handleTouch(touchX);
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touchX = e.touches[0].clientX;
            this.handleTouch(touchX);
        });
        
        this.canvas.addEventListener('touchend', () => {
            this.player.setInput('left', false);
            this.player.setInput('right', false);
        });
    }

    // Обработка касаний
    handleTouch(touchX) {
        const canvasRect = this.canvas.getBoundingClientRect();
        const canvasX = touchX - canvasRect.left;
        const centerX = this.canvas.width / 2;
        
        if (canvasX < centerX - 20) {
            this.player.setInput('left', true);
            this.player.setInput('right', false);
        } else if (canvasX > centerX + 20) {
            this.player.setInput('left', false);
            this.player.setInput('right', true);
        } else {
            this.player.setInput('left', false);
            this.player.setInput('right', false);
        }
    }

    // Настройка гироскопа
    setupGyroControls() {
        if (window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', (e) => {
                if (this.state === GameState.PLAYING) {
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
    }

    // Настройка UI
    setupUI() {
        this.updateHighScoreDisplay();
    }

    // Начало игры
    startGame() {
        this.state = GameState.PLAYING;
        this.score = 0;
        this.distance = 0;
        this.player.reset();
        this.platformManager.reset();
        
        // Обновление интерфейса
        document.getElementById('startScreen').style.display = 'none';
        document.getElementById('gameOverScreen').style.display = 'none';
        
        this.updateScoreDisplay();
        console.log('Game started!');
    }

    // Рестарт игры
    restartGame() {
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
        this.state = GameState.GAME_OVER;
        
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
        
        console.log('Game over! Score:', this.score);
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

    // Обновление игровой логики
    update(currentTime) {
        // Расчет времени между кадрами
        if (this.lastTime === 0) this.lastTime = currentTime;
        this.deltaTime = (currentTime - this.lastTime) / 1000; // в секундах
        this.lastTime = currentTime;
        
        if (this.state !== GameState.PLAYING) return;
        
        // Обновление игрока
        const playerAlive = this.player.update(this.deltaTime);
        if (!playerAlive) {
            this.gameOver();
            return;
        }
        
        // Проверка столкновений с платформами
        if (this.platformManager.checkCollisions(this.player)) {
            this.player.onPlatformHit();
        }
        
        // Обновление платформ и получение очков
        const scrollAmount = this.platformManager.update(this.player.y, this.deltaTime);
        if (scrollAmount > 0) {
            this.distance += scrollAmount;
            this.score += scrollAmount * CONFIG.GAME.SCORE_MULTIPLIER;
            this.updateScoreDisplay();
        }
        
        // Увеличение сложности
        this.increaseDifficulty();
    }

    // Увеличение сложности со временем
    increaseDifficulty() {
        const difficulty = 1 + (this.distance * CONFIG.GAME.DIFFICULTY_INCREASE);
        CONFIG.PLAYER.GRAVITY = 0.5 * difficulty;
    }

    // Отрисовка игры
    draw() {
        // Очистка canvas
        this.clearCanvas();
        
        // Отрисовка фона
        this.drawBackground();
        
        // Отрисовка игровых объектов
        this.platformManager.draw(this.ctx, this.assets);
        this.player.draw(this.ctx, this.assets);
        
        // Отрисовка UI поверх игры
        this.drawUI();
    }

    // Очистка canvas
    clearCanvas() {
        const background = this.assets.getImage('background');
        if (background) {
            this.ctx.drawImage(background, 0, 0);
        } else {
            // Fallback фон
            const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
            gradient.addColorStop(0, CONFIG.COLORS.BACKGROUND_TOP);
            gradient.addColorStop(1, CONFIG.COLORS.BACKGROUND_BOTTOM);
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    // Отрисовка фона
    drawBackground() {
        // Дополнительные элементы фона могут быть добавлены здесь
        // Например, параллакс-эффект с облаками
    }

    // Отрисовка UI
    drawUI() {
        // Основной UI уже отрисовывается HTML-элементами
        // Здесь можно добавить внутриигровые элементы UI
    }

    // Основной игровой цикл
    gameLoop(currentTime = 0) {
        this.update(currentTime);
        this.draw();
        this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
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
            // Fallback для старых браузеров
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
}

console.log('DoodleJumpGame class defined');