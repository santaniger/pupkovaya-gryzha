// Класс игрока
class Player {
    constructor() {
        this.reset();
        this.input = {
            left: false,
            right: false
        };
        this.lastDirection = 'right'; // Для анимации
    }

    // Сброс состояния игрока
    reset() {
        this.width = CONFIG.PLAYER.WIDTH;
        this.height = CONFIG.PLAYER.HEIGHT;
        this.x = CONFIG.CANVAS.WIDTH / 2 - this.width / 2;
        this.y = CONFIG.CANVAS.HEIGHT - 150;
        this.velocityX = 0;
        this.velocityY = 0;
        this.isJumping = true;
        this.jumpCount = 0;
        this.maxJumps = 2; // Двойной прыжок
    }

    // Обновление состояния игрока
    update(deltaTime) {
        // Применяем гравитацию
        this.velocityY += CONFIG.PLAYER.GRAVITY;
        
        // Обработка ввода для движения
        this.handleMovement();
        
        // Обновление позиции
        this.x += this.velocityX;
        this.y += this.velocityY;
        
        // Проверка границ экрана (телепортация)
        this.handleScreenBounds();
        
        // Обновление направления для анимации
        this.updateDirection();
        
        // Проверка выхода за нижнюю границу
        if (this.y > CONFIG.CANVAS.HEIGHT + 100) {
            return false; // Игрок упал - game over
        }
        
        return true;
    }

    // Обработка движения
    handleMovement() {
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
            // Замедление при отсутствии ввода
            this.velocityX *= CONFIG.PLAYER.FRICTION;
            if (Math.abs(this.velocityX) < 0.5) this.velocityX = 0;
        }
    }

    // Обработка границ экрана
    handleScreenBounds() {
        if (this.x < -this.width) {
            this.x = CONFIG.CANVAS.WIDTH;
        } else if (this.x > CONFIG.CANVAS.WIDTH) {
            this.x = -this.width;
        }
    }

    // Обновление направления для анимации
    updateDirection() {
        if (this.velocityX < -0.5) {
            this.lastDirection = 'left';
        } else if (this.velocityX > 0.5) {
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
                ctx.drawImage(image, -this.x - this.width, this.y);
                ctx.restore();
            } else {
                ctx.drawImage(image, this.x, this.y);
            }
        } else {
            // Fallback отрисовка
            this.drawFallback(ctx);
        }
        
        // Отладочная информация (можно включить через window.DEBUG = true)
        if (window.DEBUG) {
            this.drawDebugInfo(ctx);
        }
    }

    // Fallback отрисовка
    drawFallback(ctx) {
        // Тень
        ctx.fillStyle = CONFIG.COLORS.PLAYER_SHADOW;
        ctx.beginPath();
        ctx.arc(this.x + this.width/2 + 2, this.y + this.height/2 + 2, this.width/2 - 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Основное тело
        ctx.fillStyle = CONFIG.COLORS.PLAYER;
        ctx.beginPath();
        ctx.arc(this.x + this.width/2, this.y + this.height/2, this.width/2 - 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Детали лица
        this.drawFace(ctx);
    }

    // Рисование лица
    drawFace(ctx) {
        const centerX = this.x + this.width/2;
        const centerY = this.y + this.height/2;
        
        // Глаза
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(centerX - 8, centerY - 5, 5, 0, Math.PI * 2);
        ctx.arc(centerX + 8, centerY - 5, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Зрачки
        ctx.fillStyle = CONFIG.COLORS.TEXT_PRIMARY;
        ctx.beginPath();
        ctx.arc(centerX - 8, centerY - 5, 2.5, 0, Math.PI * 2);
        ctx.arc(centerX + 8, centerY - 5, 2.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Улыбка
        ctx.strokeStyle = CONFIG.COLORS.TEXT_PRIMARY;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY + 5, 7, 0.2 * Math.PI, 0.8 * Math.PI);
        ctx.stroke();
        
        // Блики
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(centerX - 9, centerY - 6, 1, 0, Math.PI * 2);
        ctx.arc(centerX + 7, centerY - 6, 1, 0, Math.PI * 2);
        ctx.fill();
    }

    // Отладочная информация
    drawDebugInfo(ctx) {
        ctx.fillStyle = 'red';
        ctx.font = '12px Arial';
        ctx.fillText(`X: ${Math.round(this.x)}`, this.x, this.y - 10);
        ctx.fillText(`Y: ${Math.round(this.y)}`, this.x, this.y - 25);
        ctx.fillText(`VX: ${this.velocityX.toFixed(1)}`, this.x, this.y - 40);
        ctx.fillText(`VY: ${this.velocityY.toFixed(1)}`, this.x, this.y - 55);
    }

    // Прыжок
    jump() {
        if (this.jumpCount < this.maxJumps) {
            this.velocityY = CONFIG.PLAYER.JUMP_FORCE;
            this.isJumping = true;
            this.jumpCount++;
            return true;
        }
        return false;
    }

    // Обработка приземления на платформу
    onPlatformHit() {
        this.isJumping = false;
        this.jumpCount = 0;
        this.jump();
    }

    // Установка ввода
    setInput(direction, active) {
        if (this.input.hasOwnProperty(direction)) {
            this.input[direction] = active;
        }
    }

    // Обработка наклона устройства
    handleDeviceTilt(gamma) {
        // gamma - наклон устройства в градусах (-90 до 90)
        const deadZone = 5; // Мертвая зона
        const maxTilt = 30; // Максимальный наклон
        
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

    // Сброс счетчика прыжков (для двойного прыжка)
    resetJumps() {
        this.jumpCount = 0;
    }
}

console.log('Player class defined');