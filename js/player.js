// player.js
// Класс игрока
console.log('🔧 Loading Player class...');

class Player {
    constructor() {
        console.log('🎮 Creating new Player instance');
        
        this.stats = {
            totalJumps: 0,
            jumpHistory: [],
            velocityHistory: [],
            lastCollisionTime: 0
        };
        
        this.reset();
        this.input = {
            left: false,
            right: false
        };
        this.lastDirection = 'right';
        this.targetX = null;
    }

    // Сброс состояния игрока - ИСПРАВЛЕННЫЙ
    reset() {
        console.log('🔄 Resetting player state');
        
        this.width = CONFIG.PLAYER.WIDTH;
        this.height = CONFIG.PLAYER.HEIGHT;
        this.x = CONFIG.CANVAS.WIDTH / 2 - this.width / 2;
        
        // Используем фиксированную стартовую позицию с проверкой
        if (CONFIG.PLAYER.START_Y && !isNaN(CONFIG.PLAYER.START_Y)) {
            this.y = CONFIG.PLAYER.START_Y;
        } else {
            // Fallback позиция
            this.y = CONFIG.CANVAS.HEIGHT - 150;
            console.warn('⚠️ Using fallback player START_Y:', this.y);
        }
        
        this.velocityX = 0;
        this.velocityY = 0;
        this.isJumping = false;
        this.jumpCount = 0;
        this.maxJumps = 1;
        this.targetX = this.x;
        
        // КРИТИЧЕСКИ ВАЖНО: сбрасываем ВСЕ состояния прыжка
        this.lastJumpTime = 0;
        this.canJump = true;
        this.jumpCooldown = false;
        this.jumpInProgress = false;
        this.isOnPlatform = true;
        
        // Сбрасываем статистику
        this.stats.totalJumps = 0;
        this.stats.jumpHistory = [];
        this.stats.velocityHistory = [];
        this.stats.lastCollisionTime = 0;
        
        console.log(`✅ Player reset complete at (${Math.round(this.x)}, ${Math.round(this.y)})`);
        
        // Проверка валидности позиции
        if (isNaN(this.x) || isNaN(this.y)) {
            console.error('❌ Player has invalid position after reset!', {
                x: this.x,
                y: this.y
            });
            // Экстренное исправление
            this.x = CONFIG.CANVAS.WIDTH / 2 - this.width / 2;
            this.y = CONFIG.CANVAS.HEIGHT - 150;
            console.log('🔄 Emergency position fix applied');
        }
    }

    // player.js - ЗАМЕНИТЬ метод update
    // Обновление состояния игрока - ОПТИМИЗИРОВАННАЯ ВЕРСИЯ
    update(deltaTime) {
        // Сохраняем предыдущую скорость для отладки
        const previousVelocityY = this.velocityY;
        
        // Применяем гравитацию ТОЛЬКО если не на платформе
        if (!this.isOnPlatform) {
            this.velocityY += CONFIG.PLAYER.GRAVITY;
        }
        
        // Ограничение максимальной скорости падения
        if (this.velocityY > CONFIG.PLAYER.MAX_FALL_SPEED) {
            this.velocityY = CONFIG.PLAYER.MAX_FALL_SPEED;
        }
        
        // Обработка ввода для движения
        this.handleMovement(deltaTime);
        
        // Обновление позиции по Y
        this.y += this.velocityY;
        
        // Проверка границ экрана (телепортация)
        this.handleScreenBounds();
        
        // Обновление направления для анимации
        this.updateDirection();
        
        // Автоматически сбрасываем isOnPlatform если падаем
        if (this.velocityY > 0.5) { // Небольшой порог для стабильности
            this.isOnPlatform = false;
        }
        
        // Разрешаем прыжок только если игрок падает или на платформе
        if (this.velocityY > 0.5 || this.isOnPlatform) {
            this.canJump = true;
        }
        
        // Автоматический сброс jumpInProgress через короткое время
        if (this.jumpInProgress && this.velocityY > 0) {
            this.jumpInProgress = false;
        }
        
        // Логирование аномальной скорости
        if (Math.abs(this.velocityY) > 12 && window.LOG_VELOCITY) {
            console.warn(`🚨 HIGH VELOCITY: ${this.velocityY.toFixed(2)} (was ${previousVelocityY.toFixed(2)})`);
        }
        
        // Сохраняем историю скорости для отладки
        if (window.DEBUG_MODE) {
            this.stats.velocityHistory.push({
                time: Date.now(),
                velocityY: this.velocityY,
                y: this.y,
                isOnPlatform: this.isOnPlatform
            });
            
            // Держим только последние 50 записей
            if (this.stats.velocityHistory.length > 50) {
                this.stats.velocityHistory.shift();
            }
        }
        
        // Проверка выхода за нижнюю границу
        if (this.y > CONFIG.CANVAS.HEIGHT + 100) {
            console.log('💀 Player fell off screen');
            return false;
        }
        
        return true;
    }

    // Обработка движения
    handleMovement(deltaTime) {
        if (this.targetX !== null) {
            // Плавное движение к целевой позиции
            const diff = this.targetX - this.x;
            this.velocityX = diff * 0.15;
            
            if (Math.abs(this.velocityX) > CONFIG.PLAYER.MAX_SPEED) {
                this.velocityX = Math.sign(this.velocityX) * CONFIG.PLAYER.MAX_SPEED;
            }
        } else {
            // Клавиатурное управление (резервное)
            if (this.input.left) {
                this.velocityX = Math.max(
                    this.velocityX - CONFIG.PLAYER.ACCELERATION, 
                    -CONFIG.PLAYER.MAX_SPEED
                );
            } else if (this.input.right) {
                this.velocityX = Math.min(
                    this.velocityX + CONFIG.PLAYER.ACCELERATION, 
                    CONFIG.PLAYER.MAX_SPEED
                );
            } else {
                this.velocityX *= CONFIG.PLAYER.FRICTION;
                if (Math.abs(this.velocityX) < 0.1) this.velocityX = 0;
            }
        }
        
        this.x += this.velocityX;
    }

    // Обработка границ экрана
    handleScreenBounds() {
        if (this.x < -this.width) {
            this.x = CONFIG.CANVAS.WIDTH;
            if (this.targetX !== null) this.targetX = this.x;
        } else if (this.x > CONFIG.CANVAS.WIDTH) {
            this.x = -this.width;
            if (this.targetX !== null) this.targetX = this.x;
        }
    }

    // Обновление направления для анимации
    updateDirection() {
        if (this.velocityX < -0.1) {
            this.lastDirection = 'left';
        } else if (this.velocityX > 0.1) {
            this.lastDirection = 'right';
        }
    }

    // Отрисовка игрока
    draw(ctx, assets) {
        const image = assets.getImage('player');
        
        if (image) {
            // Отражение изображения если движется влево
            if (this.lastDirection === 'left') {
                ctx.save();
                ctx.scale(-1, 1);
                ctx.drawImage(image, -this.x - this.width, this.y, this.width, this.height);
                ctx.restore();
            } else {
                ctx.drawImage(image, this.x, this.y, this.width, this.height);
            }
        } else {
            // Fallback отрисовка
            this.drawFallback(ctx);
        }
        
        // Отладочная информация
        if (window.DEBUG_MODE) {
            this.drawDebugInfo(ctx);
        }
    }

    // Fallback отрисовка
    drawFallback(ctx) {
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        const radius = this.width / 2 - 2;
        
        // Тень
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(centerX + 2, centerY + 2, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Основное тело
        ctx.fillStyle = CONFIG.COLORS.PLAYER;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Детали лица
        this.drawFace(ctx, centerX, centerY);
    }

    // Рисование лица
    drawFace(ctx, centerX, centerY) {
        // Корректировка позиции глаз в зависимости от направления
        const eyeOffset = this.lastDirection === 'left' ? -1 : 1;
        
        // Глаза
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(centerX - 8 * eyeOffset, centerY - 5, 5, 0, Math.PI * 2);
        ctx.arc(centerX + 8 * eyeOffset, centerY - 5, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Зрачки
        ctx.fillStyle = CONFIG.COLORS.TEXT_PRIMARY;
        ctx.beginPath();
        ctx.arc(centerX - 8 * eyeOffset, centerY - 5, 2.5, 0, Math.PI * 2);
        ctx.arc(centerX + 8 * eyeOffset, centerY - 5, 2.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Улыбка
        ctx.strokeStyle = CONFIG.COLORS.TEXT_PRIMARY;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY + 5, 7, 0.2 * Math.PI, 0.8 * Math.PI);
        ctx.stroke();
    }

    // Отладочная информация
    drawDebugInfo(ctx) {
        ctx.fillStyle = 'red';
        ctx.font = '10px Arial';
        ctx.fillText(`X: ${Math.round(this.x)}`, this.x, this.y - 10);
        ctx.fillText(`Y: ${Math.round(this.y)}`, this.x, this.y - 22);
        ctx.fillText(`VX: ${this.velocityX.toFixed(1)}`, this.x, this.y - 34);
        ctx.fillText(`VY: ${this.velocityY.toFixed(1)}`, this.x, this.y - 46);
        ctx.fillText(`OnPlatform: ${this.isOnPlatform}`, this.x, this.y - 58);
        ctx.fillText(`CanJump: ${this.canJump}`, this.x, this.y - 70);
        
        // Показываем последние 3 прыжка
        const recentJumps = this.stats.jumpHistory.slice(-3);
        recentJumps.forEach((jump, index) => {
            ctx.fillText(`Jump${index}: ${jump.velocityY.toFixed(1)}`, this.x, this.y - (82 + index * 12));
        });
    }

    // player.js - ЗАМЕНИТЬ метод jump
    // Прыжок - ОПТИМИЗИРОВАННАЯ ВЕРСИЯ
    jump() {
        const currentTime = Date.now();
        
        // УПРОЩЕННЫЕ ПРОВЕРКИ
        if (this.jumpCooldown) {
            if (window.LOG_JUMP) console.log('🚫 Jump blocked: cooldown active');
            return false;
        }
        
        if (!this.canJump) {
            if (window.LOG_JUMP) console.log('🚫 Jump blocked: cannot jump now');
            return false;
        }
        
        const timeSinceLastJump = currentTime - this.lastJumpTime;
        if (timeSinceLastJump < CONFIG.GAME.JUMP_COOLDOWN) {
            if (window.LOG_JUMP) console.log(`🚫 Jump blocked: too fast (${timeSinceLastJump}ms < ${CONFIG.GAME.JUMP_COOLDOWN}ms)`);
            return false;
        }
        
        // ВСЕ ПРОВЕРКИ ПРОЙДЕНЫ - ВЫПОЛНЯЕМ ПРЫЖОК
        this.jumpInProgress = true;
        
        // ФИКСИРОВАННАЯ СИЛА ПРЫЖКА
        this.velocityY = CONFIG.PLAYER.JUMP_FORCE;
        this.isJumping = true;
        this.isOnPlatform = false; // Больше не на платформе
        this.jumpCount++;
        this.lastJumpTime = currentTime;
        this.canJump = false;
        this.jumpCooldown = true;
        this.stats.totalJumps++;
        
        // Записываем в историю прыжков
        this.stats.jumpHistory.push({
            time: currentTime,
            velocityY: this.velocityY,
            jumpCount: this.jumpCount,
            sequence: this.stats.totalJumps,
            fromPlatform: this.isOnPlatform
        });
        
        // Держим только последние 10 прыжков
        if (this.stats.jumpHistory.length > 10) {
            this.stats.jumpHistory.shift();
        }
        
        if (window.LOG_JUMP) {
            console.log(`🦘 JUMP #${this.stats.totalJumps}!`, {
                velocityY: this.velocityY,
                jumpCount: this.jumpCount,
                timeSinceLast: timeSinceLastJump + 'ms',
                fromPlatform: this.isOnPlatform
            });
        }
        
        // Сбрасываем кулдаун через КОРОТКОЕ время
        setTimeout(() => {
            this.jumpCooldown = false;
            // Не сбрасываем jumpInProgress сразу - это делается в update
        }, 30); // Уменьшено с 50ms до 30ms
        
        return true;
    }

    // Обработка приземления на платформу - ИСПРАВЛЕННАЯ ВЕРСИЯ
    onPlatformHit() {
        if (window.LOG_COLLISION) {
            console.log('🎯 Platform hit - resetting jump state');
        }
        
        // СБРАСЫВАЕМ ВСЕ СОСТОЯНИЯ
        this.isJumping = false;
        this.isOnPlatform = true;
        this.jumpCount = 0;
        this.canJump = true;
        this.velocityY = 0; // Останавливаем падение
        
        // Записываем время последней коллизии
        this.stats.lastCollisionTime = Date.now();
    }

    // Установка ввода для клавиатуры
    setInput(direction, active) {
        if (this.input.hasOwnProperty(direction)) {
            this.input[direction] = active;
        }
    }

    // Установка целевой позиции для касаний
    setTargetPosition(x) {
        this.targetX = x - this.width / 2;
    }

    // Сброс целевой позиции
    clearTargetPosition() {
        this.targetX = null;
    }

    // Обработка наклона устройства
    handleDeviceTilt(gamma) {
        const deadZone = 5;
        
        if (Math.abs(gamma) < deadZone) {
            this.input.left = false;
            this.input.right = false;
        } else if (gamma < -deadZone) {
            this.input.left = true;
            this.input.right = false;
        } else if (gamma > deadZone) {
            this.input.left = false;
            this.input.right = true;
        }
    }

    // Получение позиции для камеры
    getCameraY() {
        return this.y;
    }

    // Сброс счетчика прыжков
    resetJumps() {
        this.jumpCount = 0;
        this.canJump = true;
        this.jumpCooldown = false;
        this.jumpInProgress = false;
        this.isOnPlatform = true;
    }
    
    // Методы для отладки
    getDebugInfo() {
        return {
            position: { x: Math.round(this.x), y: Math.round(this.y) },
            velocity: { x: this.velocityX.toFixed(2), y: this.velocityY.toFixed(2) },
            state: {
                isJumping: this.isJumping,
                isOnPlatform: this.isOnPlatform,
                jumpCount: this.jumpCount,
                canJump: this.canJump,
                jumpCooldown: this.jumpCooldown,
                jumpInProgress: this.jumpInProgress
            },
            stats: {
                totalJumps: this.stats.totalJumps,
                lastJumpTime: this.lastJumpTime,
                lastCollisionTime: this.stats.lastCollisionTime
            }
        };
    }
}

console.log('✅ Player class defined');