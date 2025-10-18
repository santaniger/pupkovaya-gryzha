// Класс игрока
class Player {
    constructor() {
        this.reset();
        this.input = {
            left: false,
            right: false
        };
        this.lastDirection = 'right';
        this.targetX = null;
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
        this.maxJumps = 1;
        this.targetX = this.x;
        
        // УБРАНЫ ВСЕ буст-переменные
        this.lastJumpTime = 0;
        this.canJump = true;
    }

    // Обновление состояния игрока
    update(deltaTime) {
        // Применяем гравитацию
        this.velocityY += CONFIG.PLAYER.GRAVITY;
        
        // Ограничиваем максимальную скорость падения
        if (this.velocityY > 12) {
            this.velocityY = 12;
        }
        
        // Обработка ввода для движения
        this.handleMovement(deltaTime);
        
        // Обновление позиции по Y
        this.y += this.velocityY;
        
        // Проверка границ экрана (телепортация)
        this.handleScreenBounds();
        
        // Обновление направления для анимации
        this.updateDirection();
        
        // Разрешаем прыжок если игрок падает
        if (this.velocityY > 0) {
            this.canJump = true;
        }
        
        // Проверка выхода за нижнюю границу
        if (this.y > CONFIG.CANVAS.HEIGHT + 100) {
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
        if (window.DEBUG) {
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
        ctx.font = '12px Arial';
        ctx.fillText(`X: ${Math.round(this.x)}`, this.x, this.y - 10);
        ctx.fillText(`Y: ${Math.round(this.y)}`, this.x, this.y - 25);
        ctx.fillText(`VX: ${this.velocityX.toFixed(1)}`, this.x, this.y - 40);
        ctx.fillText(`VY: ${this.velocityY.toFixed(1)}`, this.x, this.y - 55);
        ctx.fillText(`Jumps: ${this.jumpCount}`, this.x, this.y - 70);
    }

    // Прыжок - АБСОЛЮТНО ПРЕДСКАЗУЕМАЯ СИЛА
    jump() {
        const currentTime = Date.now();
        
        // Защита от слишком частых прыжков
        if (currentTime - this.lastJumpTime < 200) { // Увеличили до 200 мс
            return false;
        }
        
        // Проверяем можно ли прыгать
        if (!this.canJump) {
            return false;
        }
        
        if (this.jumpCount < this.maxJumps) {
            // ФИКСИРОВАННАЯ СИЛА ПРЫЖКА - НИКАКИХ МОДИФИКАТОРОВ!
            this.velocityY = CONFIG.PLAYER.JUMP_FORCE;
            this.isJumping = true;
            this.jumpCount++;
            this.lastJumpTime = currentTime;
            this.canJump = false;
            
            console.log(`Jump! Fixed velocityY: ${this.velocityY}`);
            
            return true;
        }
        return false;
    }

    // Обработка приземления на платформу - ТОЛЬКО СБРОС СОСТОЯНИЯ И ПРЫЖОК
    onPlatformHit() {
        // Сбрасываем состояние прыжка
        this.isJumping = false;
        this.jumpCount = 0;
        this.canJump = true;
        
        // Вызываем прыжок - СИЛА БУДЕТ ТОЧНО CONFIG.PLAYER.JUMP_FORCE
        this.jump();
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
    }
}

console.log('Player class defined');